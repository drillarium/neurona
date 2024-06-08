class Properties {
  String id;
  String type;
  String title;
  dynamic defaultValue;
  bool readOnly;
  bool required;
  List<String> enumValues; // Add this property

  Properties({
    required this.id,
    required this.type,
    required this.title,
    this.defaultValue,
    required this.readOnly,
    required this.required,
    this.enumValues = const [], // Initialize with an empty list
  });

  factory Properties.fromJson(String propertyId, Map<String, dynamic> json) {
    List<String> enumValues = []; // Extract enum values
    enumValues = json['enum'].cast<String>();

    return Properties(
      id: propertyId,
      type: json['type'],
      title: json['title'],
      defaultValue: json['default'],
      readOnly: json['readOnly'],
      required: true,
      enumValues: enumValues, // Pass enum values
    );
  }
}
