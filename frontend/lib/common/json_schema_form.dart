import 'dart:async';
import 'dart:convert';

import 'package:neurona/common/checkbox_form_field.dart';
import 'package:neurona/models/properties.dart';
import 'package:neurona/models/schema.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:neurona/schema/json_schema_bloc.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class JsonSchemaForm extends StatefulWidget {
  final Schema schema;
  final JsonSchemaBloc jsonSchemaBloc;
  final Function(Map<String, dynamic>) onSubmit;

  const JsonSchemaForm(
      {super.key,
      required this.schema,
      required this.jsonSchemaBloc,
      required this.onSubmit});

  @override
  State<StatefulWidget> createState() => _jsonSchemaForm();
}

typedef JsonSchemaFormSetter<T> = void Function(T newValue);

// ignore: camel_case_types
class _jsonSchemaForm extends State<JsonSchemaForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();

    // added for accessing model
    StreamSubscription<String>? subscription;
    subscription = widget.jsonSchemaBloc.submitData.listen(
      (value) {
        widget.onSubmit(jsonDecode(value));
      },
      onDone: () {
        subscription?.cancel();
      },
      onError: (error) {
        subscription?.cancel();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: <Widget>[
          Form(
            key: _formKey,
            child: Container(
              padding: const EdgeInsets.only(left: 5.0, right: 5.0),
              child: Column(
                children: <Widget>[
                  Container(
                    padding: const EdgeInsets.only(bottom: 10.0),
                    decoration: const BoxDecoration(
                      color: Colors.transparent,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: [
                            Text(
                              widget.schema.title != ''
                                  ? widget.schema.title
                                  : '',
                              style: const TextStyle(
                                fontSize: 15.0,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              widget.schema.description != ''
                                  ? widget.schema.description
                                  : '',
                              style: const TextStyle(
                                fontSize: 15.0,
                              ),
                            ),
                          ],
                        ),
                        const Divider(),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(1.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: widget.schema.properties.map<Widget>((item) {
                        return getWidget(item);
                      }).toList(),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        _formKey.currentState!.save();
                        Map<String, dynamic> data = <String, dynamic>{};
                        data['submit'] = true;
                        widget.jsonSchemaBloc.jsonDataAdd.add(data);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      fixedSize: const Size(100, 20),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(1),
                      ),
                    ),
                    child: const Text(
                      'Save',
                      style: TextStyle(color: Colors.black, fontSize: 12.0),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget getWidget(Properties properties) {
    switch (properties.type) {
      case 'number':
      case 'string':
        if (properties.enumValues.isEmpty) {
          return getTextField(properties);
        } else {
          return getDropdownSelector(properties);
        }
      case 'boolean':
        return getCheckBox(properties);
      // case 'enum':
      // return getDropdownSelector(properties);
      default:
        return Container();
    }
  }

  Widget getTextField(Properties properties) {
    String defaultValue = "";
    if (properties.defaultValue is String) {
      defaultValue = properties.defaultValue;
    } else if (properties.defaultValue is int) {
      defaultValue = properties.defaultValue.toString();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 5.0),
      padding: const EdgeInsets.only(left: 5.0, right: 5.0, bottom: 5.0),
      decoration: const BoxDecoration(color: Colors.transparent),
      child: TextFormField(
        readOnly: properties.readOnly,
        onSaved: (value) {
          if (properties.type == "number") {
            Map<String, dynamic> data = <String, dynamic>{};
            data[properties.id] = int.parse(value!);
            widget.jsonSchemaBloc.jsonDataAdd.add(data);
          } else {
            Map<String, dynamic> data = <String, dynamic>{};
            data[properties.id] = value;
            widget.jsonSchemaBloc.jsonDataAdd.add(data);
          }
        },
        obscureText:
            properties.title.toLowerCase().contains("password") ? true : false,
        validator: (String? value) {
          if (properties.required) {
            if (value!.isEmpty) {
              return 'Required';
            }
          }
          return null;
        },
        controller: TextEditingController(text: defaultValue),
        decoration: InputDecoration(
          hintText: defaultValue,
          labelText:
              properties.required ? '${properties.title} *' : properties.title,
          labelStyle: const TextStyle(color: Colors.grey),
          border: const OutlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(
                color: Provider.of<ThemeProvider>(context).isDarkMode
                    ? Colors.white
                    : Colors.black,
                width: 1.0),
          ),
        ),
        style: const TextStyle(color: Colors.grey, fontSize: 12.0),
      ),
    );
  }

  Widget getCheckBox(Properties properties) {
    return StreamBuilder(
      stream: widget.jsonSchemaBloc.formData[properties.id],
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return CheckboxFormField(
            autoValidate: false,
            initialValue: snapshot.data,
            title: properties.title,
            validator: (bool? val) {
              if (properties.required && val == false) {
                return "Required";
              }
              return null;
            },
            onSaved: (bool? val) {},
            onChange: (val) {
              Map<String, dynamic> data = <String, dynamic>{};
              data[properties.id] = val;
              widget.jsonSchemaBloc.jsonDataAdd.add(data);
            },
          );
        } else {
          return Container();
        }
      },
    );
  }

  Widget getDropdownSelector(Properties properties) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15.0),
      padding: const EdgeInsets.only(left: 10.0, right: 10.0, bottom: 10.0),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(15),
      ),
      child: StreamBuilder(
        stream: widget.jsonSchemaBloc.formData[properties.id],
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            return DropdownButtonFormField<String>(
              // Specify type argument as String
              dropdownColor: Provider.of<ThemeProvider>(context).isDarkMode
                  ? Colors.black
                  : Colors.white,
              autovalidateMode: AutovalidateMode.always,
              value: snapshot.data,
              items: properties.enumValues
                  .map<DropdownMenuItem<String>>((String value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text(value,
                      style:
                          const TextStyle(color: Colors.grey, fontSize: 12.0)),
                );
              }).toList(),
              onChanged: (String? value) {
                // Use String as the type for onChanged
                Map<String, dynamic> data = <String, dynamic>{};
                data[properties.id] = value;
                widget.jsonSchemaBloc.jsonDataAdd.add(data);
              },
              decoration: InputDecoration(
                labelText: properties.required
                    ? '${properties.title} *'
                    : properties.title,
                labelStyle: const TextStyle(color: Colors.grey, fontSize: 12.0),
                focusedBorder: const UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey, width: 2.0),
                ),
              ),
            );
          } else {
            return Container();
          }
        },
      ),
    );
  }

  @override
  void dispose() {
    super.dispose();
    widget.jsonSchemaBloc.dispose();
  }
}
