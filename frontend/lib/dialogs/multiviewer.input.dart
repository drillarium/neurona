import 'package:flutter/material.dart';
import 'package:neurona/common/json_schema_form.dart';
import 'package:neurona/models/schema.dart';
import 'package:neurona/schema/json_schema_bloc.dart';

class MultiviewerInputDialog extends StatefulWidget {
  const MultiviewerInputDialog({super.key});

  @override
  State<MultiviewerInputDialog> createState() => _MultiviewerInputDialogState();
}

class _MultiviewerInputDialogState extends State<MultiviewerInputDialog> {
  List<String> items = ['Item 1', 'Item 2', 'Item 3'];
  String? selectedItem;
  JsonSchemaBloc jsonSchemaBloc = JsonSchemaBloc();

  buildSchema() {
    jsonSchemaBloc.getSchema("assets/json/users.json", "");
    return StreamBuilder<Schema>(
      stream: jsonSchemaBloc.jsonSchema,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return JsonSchemaForm(
            schema: snapshot.data!,
            jsonSchemaBloc: jsonSchemaBloc,
          );
        } else {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0)),
      child: Container(
        width: 600.0,
        height: 400.0,
        decoration: BoxDecoration(
          border: Border.all(
            color: Colors.white,
            width: 1.0,
          ),
        ),
        padding: const EdgeInsets.all(10.0),
        child: Row(
          children: [
            // Left Side: List and Buttons
            Expanded(
              flex: 2,
              child: Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          title: Text(items[index]),
                          selected: selectedItem == items[index],
                          onTap: () {
                            setState(() {
                              selectedItem = items[index];
                            });
                          },
                        );
                      },
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      PopupMenuButton<String>(
                        tooltip: "Options",
                        onSelected: (value) {
                          setState(() {
                            items.add('Item ${items.length + 1}');
                          });
                        },
                        itemBuilder: (BuildContext context) {
                          return [
                            const PopupMenuItem(
                              value: 'Option 1',
                              child: Text('Option 1'),
                            ),
                            const PopupMenuItem(
                              value: 'Option 2',
                              child: Text('Option 2'),
                            ),
                          ];
                        },
                        child: const IconButton(
                          onPressed: null,
                          iconSize: 20,
                          icon: Icon(Icons.add),
                        ),
                      ),
                      const SizedBox(width: 5),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            if (selectedItem != null) {
                              items.remove(selectedItem);
                              selectedItem = null;
                            }
                          });
                        },
                        iconSize: 20,
                        icon: const Icon(Icons.remove),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const VerticalDivider(),
            // Right Side: Details
            Expanded(
              flex: 3,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      IconButton(
                        iconSize: 16,
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          Navigator.of(context).pop();
                        },
                      ),
                    ],
                  ),
                  Expanded(
                    child: buildSchema(),
                    /* 
                      child: selectedItem == null
                        ? const Center(child: Text('No item selected'))
                        : Center(child: Text('Details for $selectedItem')),
                    */
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
