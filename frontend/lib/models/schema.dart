import 'package:neurona/models/properties.dart';

class Schema {
  String title;
  String type;
  String description;
  List<dynamic> required;
  List<Properties> properties;
  String model;

  Schema(
      {required this.title,
      required this.type,
      required this.description,
      required this.required,
      required this.properties,
      required this.model});

  factory Schema.fromJson(Map<String, dynamic> json) {
    Schema newSchema = Schema(
      title: json['title'],
      type: json['type'],
      description: json['description'],
      required: json['required'],
      properties: [],
      model: '',
    );
    newSchema.setProperties(json['properties'], newSchema.required);
    // print(newSchema.properties);
    return newSchema;
  }

  setProperties(Map<String, dynamic> json, List<dynamic> requiredList) {
    List<Properties> props = [];
    json.forEach((key, data) {
      bool required = true;
      if (!requiredList.contains(key)) {
        required = false;
      }
      List<String> enumValues = [];
      if (data['enum'] != null && data['enum'] is List<dynamic>) {
        enumValues = data['enum'].cast<String>();
      }
      bool readOnly = false;
      if (data['readOnly'] != null) {
        readOnly = data['readOnly'];
      }
      props.add(
        Properties(
          id: key,
          type: data['type'],
          title: data['title'],
          defaultValue: data['default'],
          readOnly: readOnly,
          required: required,
          enumValues: enumValues, // Set enumValues
        ),
      );
    });

    properties = props;
  }
}
