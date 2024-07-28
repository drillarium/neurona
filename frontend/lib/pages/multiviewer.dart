import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:neurona/components/multiviewer.canvas.dart';
import 'package:neurona/components/multiviewer.list.dart';
import 'package:neurona/dialogs/multiviewer.admin.dart';
import 'package:neurona/models/multiviewer.scene.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:provider/provider.dart';
import 'package:neurona/services/multiviewer.service.dart';
import 'package:neurona/services/ws.service.dart';

class MultiviewerPage extends StatefulWidget {
  const MultiviewerPage({super.key});

  @override
  State<MultiviewerPage> createState() => _MultiviewerPageState();
}

class _MultiviewerPageState extends State<MultiviewerPage> {
  List<MultiviewerScene> _listScenes = [];
  final WebSocketClient? _webSocketClient = WebSocketClient.instance;
  late StreamSubscription<String> _wsMessage;
  int _sceneIndex = -1;

  void _showManageInputsDialog(BuildContext context, EngineType engineType) {
    int sceneId = _sceneIndex >= 0 ? _listScenes[_sceneIndex].id : -1;
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Center(
          child: MultiviewerAdminDialog(engineType: engineType, sceneId: sceneId),
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    fetchScenes();
    // connection to server status
    _wsMessage = _webSocketClient!.messages.listen((message) {
      Map<String, dynamic> backendMessage = jsonDecode(message);
      if (backendMessage["message"] == "scene_list_change") {
        setState(() {
          fetchScenes();
        });
      }
    });
  }

  @override
  void dispose() {
    _wsMessage.cancel();
    super.dispose();
  }

  fetchScenes() {
    setState(() {
      MultiviewerService.instance!.fetchScenes().then((response) {
        setState(() {
          _listScenes = response;
          if (_sceneIndex >= _listScenes.length) {
            _sceneIndex = -1;
          }
        });
      }).catchError((error) {
        setState(() {
          _listScenes = [];
          if (_sceneIndex >= _listScenes.length) {
            _sceneIndex = -1;
          }
        });
      });
    });
  }

  onSceneIndexChange(int index) {
    setState(() {
      _sceneIndex = index;
    });
  }

  Future<String?> _showRemoveConfirmationDialog() async {
    return showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Confirm Remove'),
          content: const Text('Are you sure you want to remove the item?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop('Cancel');
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop('Ok');
              },
              child: const Text('Ok'),
            ),
          ],
        );
      },
    );
  }

  // input list
  List<MultiviewerInput> inputList(int index) {
    if ((index < 0) || (index >= _listScenes.length)) return [];
    return _listScenes[index].inputs;
  }

  // output list
  List<MultiviewerOutput> outputList(int index) {
    if ((index < 0) || (index >= _listScenes.length)) return [];
    return _listScenes[index].outputs;
  }

  String captionText() {
    String text = _sceneIndex >= 0 ? _listScenes[_sceneIndex].name : "No scene selected";
    return "Multiviewer - $text";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(40.0),
        child: AppBar(
          title: Text(
            captionText(),
            style: TextStyle(
              fontSize: 16.0,
              color: Provider.of<ThemeProvider>(context).isDarkMode ? Colors.white : Colors.black,
            ),
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(4.0),
        child: Column(
          children: [
            // First row with 80% height
            Expanded(
              flex: 7,
              child: MultiviewerCanvasComponent(
                scene: _sceneIndex >= 0 ? _listScenes[_sceneIndex] : null,
                onSaveScene: () {
                  if (_sceneIndex >= 0) {
                    MultiviewerService.instance!.updateScene(_listScenes[_sceneIndex]);
                  }
                },
              ),
            ),
            const SizedBox(height: 4),
            // Second row with three cells
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  // First cell
                  Expanded(
                    child: Container(
                      color: Provider.of<ThemeProvider>(context).isDarkMode ? const Color.fromRGBO(43, 46, 56, 1) : const Color.fromRGBO(219, 222, 213, 1),
                      child: MultiviewerListComponent(
                          title: "Scenes",
                          itemList: _listScenes.map((item) => item.name).toList(),
                          onAddItem: () {
                            _showManageInputsDialog(context, EngineType.scene);
                          },
                          onRemoveItem: (int index) async {
                            String? result = await _showRemoveConfirmationDialog();
                            if (result == "Ok") {
                              setState(() {});
                            }
                          },
                          onMoveDownItem: (int index) {
                            var temp = _listScenes[index];
                            _listScenes[index] = _listScenes[index + 1];
                            _listScenes[index + 1] = temp;
                            setState(() {});
                          },
                          onMoveUpItem: (int index) {
                            var temp = _listScenes[index];
                            _listScenes[index] = _listScenes[index - 1];
                            _listScenes[index - 1] = temp;
                            setState(() {});
                          },
                          onSelectedItemChange: (int index) {
                            onSceneIndexChange(index);
                          }),
                    ),
                  ),
                  const SizedBox(width: 4),
                  // Second cell
                  Expanded(
                    child: Container(
                      color: Provider.of<ThemeProvider>(context).isDarkMode ? const Color.fromRGBO(43, 46, 56, 1) : const Color.fromRGBO(219, 222, 213, 1),
                      child: MultiviewerListComponent(
                          title: "Inputs",
                          itemList: inputList(_sceneIndex).map((item) => item.name).toList(),
                          onAddItem: _sceneIndex < 0
                              ? null
                              : () {
                                  _showManageInputsDialog(context, EngineType.input);

                                  // widget._listInputs
                                  //    .add('Input ${widget._listInputs.length + 1}');
                                  // setState(() {});
                                },
                          onRemoveItem: (int index) {
                            // widget._listInputs.removeAt(index);
                            setState(() {});
                          },
                          onMoveDownItem: (int index) {
                            /* final String temp = widget._listInputs[index];
                            widget._listInputs[index] =
                                widget._listInputs[index + 1];
                            widget._listInputs[index + 1] = temp; */
                            setState(() {});
                          },
                          onMoveUpItem: (int index) {
                            /* final String temp = widget._listInputs[index];
                            widget._listInputs[index] =
                                widget._listInputs[index - 1];
                            widget._listInputs[index - 1] = temp; */
                            setState(() {});
                          },
                          onSelectedItemChange: (int index) {}),
                    ),
                  ),
                  const SizedBox(width: 4),
                  // Third cell
                  Expanded(
                    child: Container(
                      color: Provider.of<ThemeProvider>(context).isDarkMode ? const Color.fromRGBO(43, 46, 56, 1) : const Color.fromRGBO(219, 222, 213, 1),
                      child: MultiviewerListComponent(
                          title: "Outputs",
                          itemList: outputList(_sceneIndex).map((item) => item.name).toList(),
                          onAddItem: _sceneIndex < 0
                              ? null
                              : () {
                                  _showManageInputsDialog(context, EngineType.output);

                                  /* widget._listOutputs
                              .add('Output ${widget._listOutputs.length + 1}');
                          setState(() {}); */
                                },
                          onRemoveItem: (int index) {
                            // widget._listOutputs.removeAt(index);
                            setState(() {});
                          },
                          onMoveDownItem: (int index) {
                            /* final String temp = widget._listOutputs[index];
                            widget._listOutputs[index] =
                                widget._listOutputs[index + 1];
                            widget._listOutputs[index + 1] = temp; */
                            setState(() {});
                          },
                          onMoveUpItem: (int index) {
                            /* final String temp = widget._listOutputs[index];
                            widget._listOutputs[index] =
                                widget._listOutputs[index - 1];
                            widget._listOutputs[index - 1] = temp; */
                            setState(() {});
                          },
                          onSelectedItemChange: (int index) {}),
                    ),
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
