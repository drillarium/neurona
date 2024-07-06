import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:neurona/models/multiviewer.scene.dart';

class MultiviewerService {
  String baseUrl;

  // Private constructor
  MultiviewerService._privateConstructor(this.baseUrl);

  // Instance of ApiService
  static MultiviewerService? _instance;

  // Factory method to initialize the singleton instance with a base URL
  factory MultiviewerService.init(String baseUrl) {
    _instance ??= MultiviewerService._privateConstructor(baseUrl);
    return _instance!;
  }

  // Getter to access the singleton instance
  static MultiviewerService? get instance => _instance;

  // Get Scene schema
  Future<Map<String, dynamic>> fetchScenesSchema() async {
    try {
      final response =
          await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene/schema'));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get scences scchema');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get Inputs schema for a given scene
  Future<Map<String, dynamic>> fetchInputsSchema(int sceneId) async {
    try {
      final response = await http.get(
          Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneId/input/schema'));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get inputs scence schemes');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get Outputs schema for a given scene
  Future<Map<String, dynamic>> fetchOutputsSchema(int sceneId) async {
    try {
      final response = await http.get(Uri.parse(
          '$baseUrl/api/v1/multiviewer/scene/$sceneId/output/schema'));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get outputs scence schemes');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get Scenes
  Future<List<MultiviewerScene>> fetchScenes() async {
    try {
      final response =
          await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene'));

      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse
            .map((launcher) => MultiviewerScene.fromJson(launcher))
            .toList();
      } else if (response.statusCode == 204) {
        return [];
      } else {
        throw Exception('Failed to get scences');
      }
    } catch (e) {
      rethrow;
    }
  }

  // create scene
  Future<MultiviewerScene> createScene(MultiviewerScene scene) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(scene.toJson()),
      );

      if (response.statusCode == 201) {
        return MultiviewerScene.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to create scene');
      }
    } catch (e) {
      rethrow;
    }
  }

  // update scene
  Future<void> updateScene(MultiviewerScene scene) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/${scene.id}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(scene.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update user');
      }
    } catch (e) {
      rethrow;
    }
  }

  // delete scene
  Future<void> deleteScene(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete scene');
      }
    } catch (e) {
      rethrow;
    }
  }
}
