class MultiviewerInput {
  final int id;
  String name;
  int x;
  int y;
  int width;
  int height;

  MultiviewerInput({
    required this.id,
    required this.name,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });

  factory MultiviewerInput.fromJson(Map<String, dynamic> json) {
    return MultiviewerInput(
      id: json['id'],
      name: json['name'],
      x: json['x'],
      y: json['y'],
      width: json['width'],
      height: json['height'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'x': x,
      'y': y,
      'width': width,
      'height': height,
    };
  }
}

class MultiviewerOutput {
  final int id;
  String name;

  MultiviewerOutput({
    required this.id,
    required this.name,
  });

  factory MultiviewerOutput.fromJson(Map<String, dynamic> json) {
    return MultiviewerOutput(
      id: json['id'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

// Scene model
class MultiviewerScene {
  final int id;
  final String name;
  final String user;
  final String launcher;
  final int width;
  final int height;
  List<MultiviewerInput> inputs;
  final List<MultiviewerOutput> outputs;

  MultiviewerScene({
    required this.id,
    required this.name,
    required this.user,
    required this.launcher,
    required this.width,
    required this.height,
    required this.inputs,
    required this.outputs,
  });

  factory MultiviewerScene.fromJson(Map<String, dynamic> json) {
    List<MultiviewerInput> inputsList = [];
    if (json.containsKey('inputs')) {
      var inputsFromJson = json['inputs'] as List;
      inputsList = inputsFromJson.map((inputJson) => MultiviewerInput.fromJson(inputJson)).toList();
    }

    List<MultiviewerOutput> outputsList = [];
    if (json.containsKey('outputs')) {
      var outputsFromJson = json['outputs'] as List;
      outputsList = outputsFromJson.map((outputJson) => MultiviewerOutput.fromJson(outputJson)).toList();
    }

    return MultiviewerScene(
      id: json['id'],
      name: json['name'],
      user: json['user'],
      launcher: json['launcher'],
      width: json['width'],
      height: json['height'],
      inputs: inputsList,
      outputs: outputsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'user': user,
      'launcher': launcher,
      'width': width,
      'height': height,
      'inputs': inputs.map((input) => input.toJson()).toList(),
      'outputs': outputs.map((output) => output.toJson()).toList(),
    };
  }
}
