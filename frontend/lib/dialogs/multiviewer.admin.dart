import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:neurona/common/json_schema_form.dart';
import 'package:neurona/models/multiviewer.scene.dart';
import 'package:neurona/models/schema.dart';
import 'package:neurona/models/users.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:neurona/schema/json_schema_bloc.dart';
import 'package:neurona/services/api.service.dart';
import 'package:neurona/services/multiviewer.service.dart';
import 'package:provider/provider.dart';

// for managing scenes, inputs or outputs
enum EngineType { scene, input, output }

class MultiviewerAdminDialog extends StatefulWidget {
  final EngineType engineType;
  final int sceneId;

  const MultiviewerAdminDialog({
    super.key,
    required this.engineType,
    this.sceneId = -1,
  });

  @override
  State<MultiviewerAdminDialog> createState() => _MultiviewerAdminDialogState();
}

class _MultiviewerAdminDialogState extends State<MultiviewerAdminDialog> {
  Map<String, dynamic>? schema; // depends on EngineType
  List<MultiviewerScene>? scenes;
  int selectedItemIndex = 0;
  JsonSchemaBloc jsonSchemaBloc = JsonSchemaBloc();
  String jsonModel = "";
  Timer? _timer;
  bool _showMessage = false;
  String message = "";
  String severity = "info";

  @override
  void initState() {
    super.initState();
    // fetch scene schema
    if (widget.engineType == EngineType.scene) {
      fetchScenesSchema();
    }
    // fetch schema for input creation
    // also fetch the available inputs
    else if (widget.engineType == EngineType.input) {
      fetchInputsSchema(widget.sceneId);
    }
    // fetch schema for output creation
    // also fetch the available outputs
    else if (widget.engineType == EngineType.output) {
      fetchOutputsSchema(widget.sceneId);
    }
    // fetch scenes
    fetchScenes(resetSelected: true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  int generateRandomNumber() {
    Random random = Random();
    return 1000 + random.nextInt(9000);
  }

  fetchScenesSchema() {
    setState(() {
      MultiviewerService.instance!.fetchScenesSchema().then((response) {
        setState(() {
          schema = response;
          User user = ApiService.instance!.user;
          schema?["properties"]["user"]["default"] = user.username;
          schema?["properties"]["name"]["default"] =
              "Scene #${generateRandomNumber()}";
          selectedItemIndex = -1;
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching scenes schema");
          schema = null;
        });
      });
    });
  }

  fetchInputsSchema(int sceneId) {
    setState(() {
      MultiviewerService.instance!.fetchInputsSchema(sceneId).then((response) {
        setState(() {
          schema = response;
          selectedItemIndex = -1;
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching scenes schema");
          schema = null;
        });
      });
    });
  }

  fetchOutputsSchema(int sceneId) {
    setState(() {
      MultiviewerService.instance!.fetchOutputsSchema(sceneId).then((response) {
        setState(() {
          schema = response;
          selectedItemIndex = -1;
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching scenes schema");
          schema = null;
        });
      });
    });
  }

  fetchScenes({bool resetSelected = false}) {
    setState(() {
      MultiviewerService.instance!.fetchScenes().then((response) {
        setState(() {
          scenes = response;
          if (resetSelected) {
            selectedItemIndex = scenes!.isEmpty ? -1 : 0;
          }
          if (widget.engineType == EngineType.scene) {
            jsonModel =
                selectedItemIndex >= 0 && selectedItemIndex < scenes!.length
                    ? jsonEncode(scenes![selectedItemIndex])
                    : "";
          }
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching scenes");
          scenes = null;
          jsonModel = "";
        });
      });
    });
  }

  List<String> inputList() {
    List<String> ret = [];

    if (scenes != null) {
      var scene = scenes?.firstWhere((scene) => scene.id == widget.sceneId);
      if (scene != null) {
        ret = scene.inputs.map((input) => input.name).toList();
      }
    }

    return ret;
  }

  List<String> outputList() {
    List<String> ret = [];

    if (scenes != null) {
      var scene = scenes?.firstWhere((scene) => scene.id == widget.sceneId);
      if (scene != null) {
        ret = scene.outputs.map((output) => output.name).toList();
      }
    }

    return ret;
  }

  void setMessage(String messageSeverity, String messageText) {
    setState(() {
      message = messageText;
      severity = messageSeverity;
      _showMessage = true;
    });
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel(); // Cancel any existing timer
    _timer = Timer(const Duration(seconds: 3), () {
      setState(() {
        _showMessage = false;
      });
    });
  }

  buildSchema() {
    if (schema == null) return Container();

    jsonSchemaBloc.getSchema2(schema!, jsonModel);
    return StreamBuilder<Schema>(
      stream: jsonSchemaBloc.jsonSchema,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return JsonSchemaForm(
            schema: snapshot.data!,
            jsonSchemaBloc: jsonSchemaBloc,
            onSubmit: (model) {
              // add
              if (jsonModel.isEmpty) {
                MultiviewerScene scene = MultiviewerScene.fromJson(model);
                MultiviewerService.instance
                    ?.createScene(scene)
                    .then((response) {
                  setMessage("info", "Scene created");
                  selectedItemIndex = scenes!.length;
                  fetchScenes();
                }).catchError((error) {
                  setMessage(
                      "error", "Error creating scene ${error.toString()}");
                });
              }
              // update
              else {
                MultiviewerScene scene = MultiviewerScene.fromJson(model);
                MultiviewerService.instance
                    ?.updateScene(scene)
                    .then((response) {
                  setMessage("info", "Scene updated");
                  fetchScenes();
                }).catchError((error) {
                  setMessage(
                      "error", "Error updating scene ${error.toString()}");
                });
              }
            },
          );
        } else {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
      },
    );
  }

  severityToColor(String severity) {
    if (severity == "error") {
      return Colors.red;
    } else if (severity == "warning") {
      return Colors.orange;
    }
    return Colors.blue;
  }

  selectItem(int index) {
    setState(() {
      jsonModel = jsonEncode(scenes?[index]);
      selectedItemIndex = index;
    });
  }

  removeItem(int index) {
    MultiviewerService.instance
        ?.deleteScene(scenes![index].id)
        .then((response) {
      setState(() {
        setMessage("info", "Scene deleted");
        scenes?.removeAt(index);
        if (selectedItemIndex >= scenes!.length) {
          selectedItemIndex = scenes!.isNotEmpty ? 0 : -1;
        }
        if (selectedItemIndex >= 0) {
          jsonModel = jsonEncode(scenes![selectedItemIndex]);
        } else {
          jsonModel = "";
        }
      });
    }).catchError((error) {
      setMessage("error", "Error deleting scene ${error.toString()}");
    });
  }

  buildPopupMenuItems() {
    if (schema != null) {
      if (widget.engineType == EngineType.input) {
        // available
        final List<String> availables = [
          'Item 1',
          'Item 2',
          'Item 3',
          'Item 4'
        ];

        return availables.map((String item) {
          return PopupMenuItem<String>(
            value: item,
            child: Text(item),
          );
        }).toList();

        // schemas for creting new ones
        final List<String> schemas = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
      } else if (widget.engineType == EngineType.output) {
        // available

        // schemas for creting new ones
      }
    }

    // dummy return
    final List<String> dummyItems = [];
    return dummyItems.map((String item) {
      return PopupMenuItem<String>(
        value: item,
        child: Text(item),
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final dialogWidth = screenWidth * 2 / 3;
    final dialogHeight = screenHeight * 2 / 3;

    List<String> itemList = [];
    if (scenes != null) {
      if (widget.engineType == EngineType.scene) {
        itemList = scenes!.map((scene) => scene.name).toList();
      } else if (widget.engineType == EngineType.input) {
        itemList = inputList();
      } else if (widget.engineType == EngineType.output) {
        itemList = outputList();
      }
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0)),
      child: Container(
        width: dialogWidth,
        height: dialogHeight,
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
                      itemCount: itemList.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          title: Text(
                            itemList[index],
                            style: TextStyle(
                              color: selectedItemIndex == index
                                  ? Colors.blue
                                  : Provider.of<ThemeProvider>(context)
                                          .isDarkMode
                                      ? Colors.white
                                      : Colors.black,
                              fontSize: 14.0,
                            ),
                          ),
                          selected: selectedItemIndex == index,
                          onTap: () {
                            setState(() {
                              selectItem(index);
                              selectedItemIndex = index;
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
                        tooltip: "Add",
                        onSelected: (value) {},
                        itemBuilder: (BuildContext context) {
                          return buildPopupMenuItems();
                        },
                        child: IconButton(
                          onPressed: schema == null
                              ? null
                              : () {
                                  setState(() {
                                    if (widget.engineType == EngineType.scene) {
                                      schema?["properties"]["name"]["default"] =
                                          "Scene #${generateRandomNumber()}";
                                    }
                                    selectedItemIndex = -1;
                                    jsonModel = "";
                                  });
                                },
                          iconSize: 20,
                          icon: const Icon(Icons.add),
                        ),
                      ),
                      const SizedBox(width: 5),
                      IconButton(
                        onPressed: selectedItemIndex >= 0
                            ? () {
                                showDialog(
                                    context: context,
                                    builder: (BuildContext context) {
                                      return AlertDialog(
                                        title:
                                            const Text('Remove Confirmation'),
                                        content: const Text(
                                            'Are you sure you want to remove?'),
                                        actions: <Widget>[
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(context),
                                            child: const Text('Cancel'),
                                          ),
                                          TextButton(
                                            onPressed: () {
                                              removeItem(selectedItemIndex);
                                              Navigator.pop(context);
                                            },
                                            child: const Text('Remove'),
                                          ),
                                        ],
                                      );
                                    });
                              }
                            : null,
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
                    children: [
                      Expanded(
                        child: _showMessage
                            ? Text(
                                message,
                                style: TextStyle(
                                  color: severityToColor(severity),
                                  fontSize: 14.0,
                                ),
                              )
                            : Container(),
                      ),
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
