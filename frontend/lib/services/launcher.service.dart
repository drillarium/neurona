import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:neurona/models/launchers.dart';

class ApiLauncherService {
  String baseUrl;

  // Private constructor
  ApiLauncherService._privateConstructor(this.baseUrl);

  // Instance of ApiService
  static ApiLauncherService? _instance;

  // Factory method to initialize the singleton instance with a base URL
  factory ApiLauncherService.init(String baseUrl) {
    _instance ??= ApiLauncherService._privateConstructor(baseUrl);
    return _instance!;
  }

  // Getter to access the singleton instance
  static ApiLauncherService? get instance => _instance;

  // Get launchers
  Future<List<Launcher>> fetchLaunchers() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1/launchers'));

      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse
            .map((launcher) => Launcher.fromJson(launcher))
            .toList();
      } else if (response.statusCode == 204) {
        return [];
      } else {
        throw Exception('Failed to get launchers');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get launcher status
  Future<Map<String, dynamic>> getLauncherStatus(int id) async {
    try {
      final response =
          await http.get(Uri.parse('$baseUrl/api/v1/launchers/$id/status'));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get launcher status');
      }
    } catch (e) {
      rethrow;
    }
  }

  // create launcher
  Future<Launcher> createLauncher(Launcher launcher) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/launchers'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(launcher.toJson()),
      );

      if (response.statusCode == 201) {
        return Launcher.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to create launcher');
      }
    } catch (e) {
      rethrow;
    }
  }

  // updateLaunhcer
  Future<void> updateLauncher(Launcher launcher) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/launchers/${launcher.id}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(launcher.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update launcher');
      }
    } catch (e) {
      rethrow;
    }
  }

  // deleteLauncher
  Future<void> deleteLauncher(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/launchers/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete launcher');
      }
    } catch (e) {
      rethrow;
    }
  }
}
