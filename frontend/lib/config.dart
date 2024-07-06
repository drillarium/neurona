import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class AppConfig {
  static String backendAddress = 'http://127.0.0.1:58338';

  static Future<void> loadConfig() async {
    try {
      String jsonString = await rootBundle.loadString('assets/config.json');
      Map<String, dynamic> config = jsonDecode(jsonString);
      backendAddress = config['backendAddress'];
    } catch (e) {
      if (kDebugMode) {
        print('Error loading config file: $e');
      }
    }
  }
}
