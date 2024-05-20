import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiService {
  String baseUrl;

  // Private constructor
  ApiService._privateConstructor(this.baseUrl);

  // Instance of ApiService
  static ApiService? _instance;

  // Factory method to initialize the singleton instance with a base URL
  factory ApiService.init(String baseUrl) {
    _instance ??= ApiService._privateConstructor(baseUrl);
    return _instance!;
  }

  // Getter to access the singleton instance
  static ApiService? get instance => _instance;

  // Validate user
  Future<bool> validateUser(String emailorname, String password) async {
    final body = jsonEncode({"emailorname": emailorname, "password": password});
    try {
      final response =
          await http.post(Uri.parse('$baseUrl/api/v1/users/validate'),
              headers: <String, String>{
                'Content-Type': 'application/json; charset=UTF-8',
              },
              body: body);
      return response.statusCode == 200;
    } catch (e) {
      throw ("Server $baseUrl not found");
    }
  }

  // Register user
  Future<bool> registerUser(
      String username, String email, String password) async {
    final body = jsonEncode(
        {"username": username, "email": email, "password": password});
    try {
      final response = await http.post(Uri.parse('$baseUrl/api/v1/users'),
          headers: <String, String>{
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: body);
      return response.statusCode == 200;
    } catch (e) {
      throw ("Server $baseUrl not found");
    }
  }

  // Get user data from email
  Future<Map<String, dynamic>?> getUser(String emailorname) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/users/$emailorname'),
      );
      if (response.statusCode == 200) {
        // Parse the response body
        final Map<String, dynamic> userData = json.decode(response.body);
        return userData;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}
