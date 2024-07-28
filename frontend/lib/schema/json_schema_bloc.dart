import 'dart:async';
import 'dart:convert';

import 'package:neurona/models/schema.dart';
import 'package:flutter/services.dart';
import 'package:rxdart/rxdart.dart';

class JsonSchemaBloc {
  final Map<String, BehaviorSubject<dynamic>> _formData =
      <String, BehaviorSubject<dynamic>>{};
  Map<String, Stream<dynamic>> formData = <String, Stream<dynamic>>{};
  StreamController<Map<String, dynamic>> jsonDataAdd =
      StreamController<Map<String, dynamic>>();
  final BehaviorSubject<Schema> _jsonSchema = BehaviorSubject<Schema>();
  Stream<Schema> get jsonSchema => _jsonSchema;
  final Map<String, dynamic> _data = <String, dynamic>{};
  final PublishSubject<String> _submitData = PublishSubject<String>();
  Stream<String> get submitData => _submitData;

  JsonSchemaBloc() {
    _jsonSchema.stream.listen((schema) {
      initDataBinding(schema);
    });

    jsonDataAdd.stream.listen((data) {
      data.forEach((key, value) {
        if (_formData.containsKey(key)) {
          _formData[key]?.add(value);
          _data[key] = value;
        }
        if (key == 'submit') {
          _submitData.add(getFormData());
        }
      });
    });
  }

  void getSchema(String pathToSchema, String jsonModel) async {
    _data.clear();
    String content = await rootBundle.loadString(pathToSchema);
    Map<String, dynamic> jsonMap = json.decode(content);
    Schema schema;
    if (jsonModel != '') {
      schema = Schema.fromJson(jsonMap);
      schema.model = jsonModel;
      _jsonSchema.add(schema);
    } else {
      jsonMap["title"] = jsonMap['title'];
      _jsonSchema.add(Schema.fromJson(jsonMap));
    }
  }

  void getSchema2(Map<String, dynamic> schema_, String jsonModel) {
    _data.clear();
    Map<String, dynamic> jsonMap = Map.from(schema_);
    Schema schema;
    if (jsonModel != '') {
      schema = Schema.fromJson(jsonMap);
      schema.model = jsonModel;
      _jsonSchema.add(schema);
    } else {
      jsonMap["title"] = jsonMap['title'];
      _jsonSchema.add(Schema.fromJson(jsonMap));
    }
  }

  void initDataBinding(Schema schema) {
    Map<String, dynamic> jsonData = {};
    if (schema.model != '') {
      jsonData = json.decode(schema.model);
    }

    for (var prop in schema.properties) {
      if (jsonData.containsKey(prop.id)) {
        prop.defaultValue = jsonData[prop.id];
      }
      if (prop.type == 'string' && prop.enumValues.isNotEmpty) {
        _data[prop.id] = prop.defaultValue;
      }
      _formData[prop.id] = BehaviorSubject<dynamic>();
      formData[prop.id] = _formData[prop.id]!.stream;
      _formData[prop.id]?.add(prop.defaultValue);
    }
  }

  String getFormData() {
    return json.encode(_data);
  }

  dispose() {
    _formData.forEach((key, value) {
      value.close();
    });

    _jsonSchema.close();
    jsonDataAdd.close();
  }
}
