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
  Map<String, dynamic>? schema; // for scene
  Map<String, dynamic>? schemaEngines; // depends on EngineType
  List<dynamic>? engines; // case input / output, running engines
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
      fetchAvailableInputs(widget.sceneId);
    }
    // fetch schema for output creation
    // also fetch the available outputs
    else if (widget.engineType == EngineType.output) {
      fetchOutputsSchema(widget.sceneId);
      fetchAvailableOutputs(widget.sceneId);
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
          schema = dummySchema("");
        });
      });
    });
  }

  fetchInputsSchema(int sceneId) {
    setState(() {
      MultiviewerService.instance!.fetchInputsSchema(sceneId).then((response) {
        setState(() {
          schemaEngines = response;
          selectedItemIndex = -1;
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching inputs schema");
          schema = dummySchema("");
        });
      });
    });
  }

  fetchOutputsSchema(int sceneId) {
    setState(() {
      MultiviewerService.instance!.fetchOutputsSchema(sceneId).then((response) {
        setState(() {
          schemaEngines = response;
          selectedItemIndex = -1;
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching outputs schema");
          schema = dummySchema("");
        });
      });
    });
  }

  fetchAvailableInputs(int sceneId) {
    setState(() {
      MultiviewerService.instance!
          .fetchAvailableInputs(sceneId)
          .then((response) {
        setState(() {
          engines = response;
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching input engines");
          schema = dummySchema("");
        });
      });
    });
  }

  fetchAvailableOutputs(int sceneId) {
    setState(() {
      MultiviewerService.instance!
          .fetchAvailableOutputs(sceneId)
          .then((response) {
        setState(() {
          engines = response;
        });
      }).catchError((error) {
        setState(() {
          setMessage("error", "Error fetching output engines");
          schema = dummySchema("");
        });
      });
    });
  }

  fetchScenes({bool resetSelected = false}) {
    setState(() {
      MultiviewerService.instance!.fetchScenes().then((response) {
        setState(() {
          scenes = response;
          if (widget.engineType == EngineType.scene) {
            if (resetSelected) {
              selectedItemIndex = scenes!.isEmpty ? -1 : 0;
            }

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
          if (widget.engineType == EngineType.scene) {
            jsonModel = "";
          }
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

  int engineId(int index) {
    if (scenes != null) {
      var scene = scenes?.firstWhere((scene) => scene.id == widget.sceneId);
      if (scene != null) {
        if (widget.engineType == EngineType.input) {
          if (index >= 0 && index < scene.inputs.length) {
            return scene.inputs[index].id;
          }
        } else if (widget.engineType == EngineType.output) {
          if (index >= 0 && index < scene.outputs.length) {
            return scene.outputs[index].id;
          }
        }
      }
    }
    return -1;
  }

  removeInputByPosition(int index) {
    if (scenes != null) {
      var scene = scenes?.firstWhere((scene) => scene.id == widget.sceneId);
      if (scene != null) {
        scene.inputs.removeAt(index);
      }
    }
  }

  removeOutputByPosition(int index) {
    if (scenes != null) {
      var scene = scenes?.firstWhere((scene) => scene.id == widget.sceneId);
      if (scene != null) {
        scene.outputs.removeAt(index);
      }
    }
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
              if (widget.engineType == EngineType.scene) {
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
              } else if (widget.engineType == EngineType.input) {
                // Add input to engine and add input to scene
                if (jsonModel.isEmpty) {
                  MultiviewerService.instance
                      ?.createInputToLauncher(widget.sceneId, model)
                      .then((response) {
                    setMessage("info", "Input created");

                    // add internal list
                    engines?.add(response);

                    // the new engineId
                    int newEngineId = response["id"];

                    // add created input to scene
                    loadSchemaAndModel(-newEngineId);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error creating input ${error.toString()}");
                  });
                }
                // Update input from engine
                else {
                  MultiviewerService.instance
                      ?.updateInputFromLauncher(widget.sceneId, model)
                      .then((response) {
                    setMessage("info", "Input updated");
                    fetchAvailableInputs(widget.sceneId);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error updating input ${error.toString()}");
                  });
                }
              } else if (widget.engineType == EngineType.output) {
                // Add output to engine and add output to scene
                if (jsonModel.isEmpty) {
                  MultiviewerService.instance
                      ?.createOutputToLauncher(widget.sceneId, model)
                      .then((response) {
                    setMessage("info", "Output created");

                    // add internal list
                    engines?.add(response);

                    // the new engineId
                    int newEngineId = response["id"];

                    // add created output to scene
                    loadSchemaAndModel(-newEngineId);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error creating output ${error.toString()}");
                  });
                }
                // Update output from engine
                else {
                  MultiviewerService.instance
                      ?.updateOutputFromLauncher(widget.sceneId, model)
                      .then((response) {
                    setMessage("info", "Output updated");
                    fetchAvailableOutputs(widget.sceneId);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error updating output ${error.toString()}");
                  });
                }
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

  Map<String, dynamic> dummySchema(String text) {
    var ret = {
      "title": text,
      "description": "",
      "type": "object",
      "required": [],
      "properties": {"dummy": {}}
    };

    // worarround to make "properties" and empty Map<String, dynamic>
    Map<String, dynamic> props = ret["properties"] as Map<String, dynamic>;
    props.remove("dummy");

    return ret;
  }

  selectItem(int index) {
    if (widget.engineType == EngineType.scene) {
      setState(() {
        jsonModel = jsonEncode(scenes?[index]);
        selectedItemIndex = index;
      });
    } else {
      setState(() {
        // show input / output configuration
        int engineID = engineId(index);
        var engine = engines?.firstWhere((engine) => engine["id"] == engineID,
            orElse: () => null);
        if (engine != null) {
          var type = engine["type"];
          schema = schemaEngines?[type]["schema"];
          schema?["title"] =
              "Configure ${widget.engineType == EngineType.input ? 'input' : 'output'}";
          schema?["description"] = widget.engineType == EngineType.input
              ? inputList()[index]
              : outputList()[index];
          jsonModel = jsonEncode(engine);
        }
        // input / ouput has been deleted
        else {
          schema = dummySchema(
              "Invalid ${widget.engineType == EngineType.input ? 'input' : 'output'}");
          jsonModel = "{}";
        }
        selectedItemIndex = index;
      });
    }
  }

  removeItem(int index) {
    if (widget.engineType == EngineType.scene) {
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
    } else if (widget.engineType == EngineType.input) {
      MultiviewerService.instance
          ?.deleteInputFromScene(widget.sceneId, index)
          .then((response) {
        setState(() {
          setMessage("info", "Input deleted from scene");
          removeInputByPosition(index);
          if (selectedItemIndex >= inputList().length) {
            selectedItemIndex = inputList().isNotEmpty ? 0 : -1;
          }
          if (selectedItemIndex >= 0) {
            selectItem(selectedItemIndex);
          } else {
            schema = dummySchema("");
            jsonModel = "";
          }
        });
      }).catchError((error) {
        setMessage(
            "error", "Error deleting input from scene ${error.toString()}");
      });
    } else if (widget.engineType == EngineType.output) {
      MultiviewerService.instance
          ?.deleteOutputFromScene(widget.sceneId, index)
          .then((response) {
        setState(() {
          setMessage("info", "Output deleted from scene");
          removeOutputByPosition(index);
          if (selectedItemIndex >= outputList().length) {
            selectedItemIndex = outputList().isNotEmpty ? 0 : -1;
          }
          if (selectedItemIndex >= 0) {
            selectItem(selectedItemIndex);
          } else {
            schema = dummySchema("");
            jsonModel = "";
          }
        });
      }).catchError((error) {
        setMessage(
            "error", "Error deleting input from scene ${error.toString()}");
      });
    }
  }

  removeEngine(int engineId) {
    var engine = engines?.firstWhere((engine) => engine["id"] == engineId);
    if (widget.engineType == EngineType.input) {
      MultiviewerService.instance
          ?.deleteInputFromLauncher(widget.sceneId, engine["type"], engineId)
          .then((response) {
        setState(() {
          setMessage("info", "Input deleted");
          engines?.removeWhere((engine) => engine["id"] == engineId);
          if (selectedItemIndex >= 0) {
            selectItem(selectedItemIndex);
          }
        });
      }).catchError((error) {
        setMessage("error", "Error deleting input ${error.toString()}");
      });
    } else if (widget.engineType == EngineType.output) {
      MultiviewerService.instance
          ?.deleteOutputFromLauncher(widget.sceneId, engine["type"], engineId)
          .then((response) {
        setState(() {
          setMessage("info", "Output deleted");
          engines?.removeWhere((engine) => engine["id"] == engineId);
          if (selectedItemIndex >= 0) {
            selectItem(selectedItemIndex);
          }
        });
      }).catchError((error) {
        setMessage("error", "Error deleting output ${error.toString()}");
      });
    }
  }

  buildPopupMenuItems({add = true}) {
    String titleAvailable = widget.engineType == EngineType.input
        ? "${add ? 'Add' : 'Remove'} available input"
        : "${add ? 'Add' : 'Remove'} available output";
    String titleNew = widget.engineType == EngineType.input
        ? "Create new iput"
        : "Create new output";
    String titleSelected = widget.engineType == EngineType.input
        ? "Remove selected iput from scene"
        : "Remove selected output from scene";

    // available
    List<PopupMenuItem<int>> av = [];

    if (!add && selectedItemIndex >= 0) {
      // remove selected one
      av.add(PopupMenuItem<int>(
        value: 1,
        child: Text(titleSelected),
      ));
    }

    av.add(PopupMenuItem<int>(
      value: -1,
      enabled: false,
      child: Text(titleAvailable),
    ));

    if (engines != null) {
      av.addAll(engines!.map((input) {
        return PopupMenuItem<int>(
          value: -input["id"],
          enabled: true,
          child: Text(input["name"]),
        );
      }).toList());
    }

    if (add) {
      // create new one
      av.add(PopupMenuItem<int>(
        value: 1,
        enabled: false,
        child: Text(titleNew),
      ));

      if (schemaEngines != null) {
        var keys = schemaEngines!.keys;
        for (int i = 0; i < keys.length; i++) {
          av.add(
            PopupMenuItem<int>(
              value: i,
              enabled: true,
              child: Text(
                keys.elementAt(i),
              ),
            ),
          );
        }
      }
    }

    return av;
  }

  // for input and outputs. When user select or an existing input/output or create a new one
  loadSchemaAndModel(int id) {
    // exisitn input / output
    if (id < 0) {
      id = id.abs();

      if (widget.engineType == EngineType.input) {
        MultiviewerInput input = MultiviewerInput(
            id: id,
            name: "Input #${inputList().length + 1}",
            width: 100,
            height: 100,
            x: 100,
            y: 100);

        MultiviewerService.instance!
            .addInputToScene(widget.sceneId, input)
            .then((response) {
          setState(() {
            setMessage("info", "Input added");
            selectedItemIndex = inputList().length;
            fetchScenes(resetSelected: false);
          });
        });
      } else if (widget.engineType == EngineType.output) {
        MultiviewerOutput output = MultiviewerOutput(
          id: id,
          name: "Output #${outputList().length + 1}",
        );

        MultiviewerService.instance!
            .addOutputToScene(widget.sceneId, output)
            .then((response) {
          setState(() {
            setMessage("info", "Output added");
            selectedItemIndex = outputList().length;
            fetchScenes(resetSelected: false);
          });
        });
      }
    }
    // new input / output
    else {
      if (widget.engineType == EngineType.input) {
        setState(() {
          var key = schemaEngines?.keys.elementAt(id);
          schema = schemaEngines?[key]["schema"];
          var type = schema?["properties"]["type"]["default"];
          var random = generateRandomNumber();
          schema?["properties"]["id"]["default"] = random;
          schema?["properties"]["name"]["default"] = "$type #$random";

          selectedItemIndex = -1;
          jsonModel = "";
        });
      } else if (widget.engineType == EngineType.output) {
        setState(() {
          var key = schemaEngines?.keys.elementAt(id);
          schema = schemaEngines?[key]["schema"];
          var type = schema?["properties"]["type"]["default"];
          schema?["properties"]["name"]["default"] =
              "$type #${generateRandomNumber()}";

          selectedItemIndex = -1;
          jsonModel = "";
        });
      }
    }
  }

  void _showEditDialog(int index) {
    List<String> itemList = [];
    if (widget.engineType == EngineType.input) {
      itemList = inputList();
    } else if (widget.engineType == EngineType.output) {
      itemList = outputList();
    }

    TextEditingController controller =
        TextEditingController(text: itemList[index]);

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Edit Item'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(hintText: "Enter new text"),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Save'),
              onPressed: () {
                _editItem(index, controller.text);
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  void _editItem(int index, String newText) {
    if (widget.engineType == EngineType.input) {
      MultiviewerInput input;
      if (scenes != null) {
        var scene = scenes?.firstWhere((scene) => scene.id == widget.sceneId);
        if (scene != null) {
          input = scene.inputs[index];
          input.name = newText;

          MultiviewerService.instance!
              .updateInputFromScene(widget.sceneId, index, input)
              .then((response) {
            setState(() {
              setMessage("info", "Input updated");
              fetchScenes(resetSelected: false);
            });
          });
        }
      }
    } else if (widget.engineType == EngineType.output) {
      MultiviewerOutput output;
      if (scenes != null) {
        var scene = scenes?.firstWhere((scene) => scene.id == widget.sceneId);
        if (scene != null) {
          output = scene.outputs[index];
          output.name = newText;

          MultiviewerService.instance!
              .updateOutputFromScene(widget.sceneId, index, output)
              .then((response) {
            setState(() {
              setMessage("info", "Output updated");
              fetchScenes(resetSelected: false);
            });
          });
        }
      }
    }
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
                            });
                          },
                          trailing: (widget.engineType != EngineType.scene)
                              ? IconButton(
                                  icon: const Icon(Icons.edit),
                                  onPressed: () {
                                    _showEditDialog(index);
                                  },
                                )
                              : null,
                        );
                      },
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (widget.engineType == EngineType.scene)
                        IconButton(
                          icon: const Icon(Icons.add),
                          tooltip: "Add",
                          iconSize: 20,
                          onPressed: (schema == null)
                              ? null
                              : () {
                                  setState(() {
                                    schema?["properties"]["name"]["default"] =
                                        "Scene #${generateRandomNumber()}";

                                    selectedItemIndex = -1;
                                    jsonModel = "";
                                  });
                                },
                        )
                      else
                        PopupMenuButton<int>(
                          tooltip: "Add",
                          onSelected: (value) {
                            loadSchemaAndModel(value);
                          },
                          itemBuilder: (BuildContext context) {
                            return buildPopupMenuItems();
                          },
                          enabled: ((engines != null
                                  ? engines!.isNotEmpty
                                  : false) ||
                              schemaEngines != null),
                          child: const Icon(Icons.add),
                        ),
                      const SizedBox(width: 5),
                      if (widget.engineType == EngineType.scene)
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
                          tooltip: "Remove",
                        )
                      else
                        PopupMenuButton<int>(
                          tooltip: "Remove",
                          onSelected: (value) {
                            showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return AlertDialog(
                                    title: const Text('Remove Confirmation'),
                                    content: const Text(
                                        'Are you sure you want to remove?'),
                                    actions: <Widget>[
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('Cancel'),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          // remove selected input / outut from scene
                                          if (value > 0) {
                                            removeItem(selectedItemIndex);
                                          }
                                          // remove input / output engine
                                          else {
                                            int id = value.abs();
                                            removeEngine(id);
                                          }
                                          Navigator.pop(context);
                                        },
                                        child: const Text('Remove'),
                                      ),
                                    ],
                                  );
                                });
                          },
                          itemBuilder: (BuildContext context) {
                            return buildPopupMenuItems(add: false);
                          },
                          enabled: true,
                          child: const Icon(Icons.remove),
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
