import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:neurona/models/users.dart';

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

  // current user
  User? user_;

  User get user => user_!;
  set user(User user) {
    user_ = user;
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

  // Get user data from email
  Future<User> getUser(String emailorname) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/users/$emailorname'),
        headers: {'Content-Type': 'application/json'},
      );
      if (response.statusCode == 200) {
        return User.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to load user');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get users
  Future<List<User>> fetchUsers() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1/users'));

      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((user) => User.fromJson(user)).toList();
      } else {
        throw Exception('Failed to load users');
      }
    } catch (e) {
      rethrow;
    }
  }

  // create user
  Future<User> createUser(User user) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/users'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(user.toJson()),
      );

      if (response.statusCode == 201) {
        return User.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to create user');
      }
    } catch (e) {
      rethrow;
    }
  }

  // updateUser
  Future<void> updateUser(User user) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/users/${user.id}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(user.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update user');
      }
    } catch (e) {
      rethrow;
    }
  }

  // deleteUser
  Future<void> deleteUser(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/users/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete user');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get config
  Future<Map<String, dynamic>> fetchConfig() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1'));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load users');
      }
    } catch (e) {
      rethrow;
    }
  }
}
