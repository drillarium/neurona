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
      final response = await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene/schema'));

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
      final response = await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneId/input/schema'));

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
      final response = await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneId/output/schema'));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get outputs scence schemes');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get available inputs for a given scene
  Future<List<dynamic>> fetchAvailableInputs(int sceneId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneId/input'));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get inputs scence schemes');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get available outputs for a given scene
  Future<List<dynamic>> fetchAvailableOutputs(int sceneId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneId/output'));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get inputs scence schemes');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get Scenes
  Future<List<MultiviewerScene>> fetchScenes() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene'));

      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((launcher) => MultiviewerScene.fromJson(launcher)).toList();
      } else if (response.statusCode == 204) {
        return [];
      } else {
        throw Exception('Failed to get scences');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Get Scenes
  Future<MultiviewerScene> fetchScene(int id) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1/multiviewer/scene/$id'));

      if (response.statusCode == 200) {
        dynamic jsonResponse = json.decode(response.body);
        return MultiviewerScene.fromJson(jsonResponse);
      } else {
        throw Exception('Failed to get scence');
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
        throw Exception('Failed to update scene');
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

  // add existing input to scene
  Future<void> addInputToScene(int sceneId, MultiviewerInput input) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/multiviewer/input/$sceneId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(input.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to add input to scene');
      }
    } catch (e) {
      rethrow;
    }
  }

  // add exisitng output to scene
  Future<void> addOutputToScene(int sceneId, MultiviewerOutput output) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/multiviewer/output/$sceneId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(output.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to add output to scene');
      }
    } catch (e) {
      rethrow;
    }
  }

  // update existing input to scene
  Future<void> updateInputFromScene(int sceneId, int inputIndex, MultiviewerInput input) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/multiviewer/input/$sceneId/$inputIndex'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(input.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update input to scene');
      }
    } catch (e) {
      rethrow;
    }
  }

  // update exisitng output to scene
  Future<void> updateOutputFromScene(int sceneId, int outputIndex, MultiviewerOutput output) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/multiviewer/output/$sceneId/$outputIndex'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(output.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update output to scene');
      }
    } catch (e) {
      rethrow;
    }
  }

  // remove input from scene
  Future<void> deleteInputFromScene(int sceneId, int inputIndex) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/multiviewer/input/$sceneId/$inputIndex'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete scene');
      }
    } catch (e) {
      rethrow;
    }
  }

  // remove output from scene
  Future<void> deleteOutputFromScene(int sceneId, int outputIndex) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/multiviewer/output/$sceneId/$outputIndex'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete scene');
      }
    } catch (e) {
      rethrow;
    }
  }

  // remove input from Launcher
  Future<void> deleteInputFromLauncher(int seneceID, String type, int inputID) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/$seneceID/input/$type/$inputID/launcher'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete input from launcher');
      }
    } catch (e) {
      rethrow;
    }
  }

  // remove output from Launcher
  Future<void> deleteOutputFromLauncher(int seneceID, String type, int outputID) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/$seneceID/output/$type/$outputID/launcher'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete output from launcher');
      }
    } catch (e) {
      rethrow;
    }
  }

  // update input form launcher
  Future<void> updateInputFromLauncher(int sceneID, dynamic input) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneID/input/launcher'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(input),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update input');
      }
    } catch (e) {
      rethrow;
    }
  }

  // update output form launcher
  Future<void> updateOutputFromLauncher(int sceneID, dynamic output) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneID/output/launcher'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(output),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update output');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<dynamic> createInputToLauncher(int sceneID, dynamic input) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneID/input/launcher'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(input),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to create input');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<dynamic> createOutputToLauncher(int sceneID, dynamic output) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/multiviewer/scene/$sceneID/output'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(output),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to create output');
      }
    } catch (e) {
      rethrow;
    }
  }
}
