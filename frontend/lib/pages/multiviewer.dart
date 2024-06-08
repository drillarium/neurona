import 'package:flutter/material.dart';
import 'package:neurona/components/multiviewer.canvas.dart';
import 'package:neurona/components/multiviewer.list.dart';
import 'package:neurona/dialogs/multiviewer.input.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:provider/provider.dart';

class MultiviewerPage extends StatefulWidget {
  final List<String> _listScenes = ['Scene 1', 'Scene 2', 'Scene 3'];
  final List<String> _listInputs = ['Input 1', 'Input 2', 'Input 3'];
  final List<String> _listOutputs = ['Output 1', 'Output 2', 'Output 3'];

  MultiviewerPage({super.key});

  @override
  State<MultiviewerPage> createState() => _MultiviewerPageState();
}

class _MultiviewerPageState extends State<MultiviewerPage> {
  void _showManageInputsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return const Center(
          child: MultiviewerInputDialog(),
        );
      },
    );
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(40.0),
        child: AppBar(
          title: Text(
            'Multiviewer',
            style: TextStyle(
              fontSize: 16.0,
              color: Provider.of<ThemeProvider>(context).isDarkMode
                  ? Colors.white
                  : Colors.black,
            ),
          ),
          leading: IconButton(
            icon: Icon(Icons.play_arrow),
            onPressed: () {
              // Action to be performed when the button is pressed
              print('Left button pressed');
            },
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(4.0),
        child: Column(
          children: [
            // First row with 80% height
            const Expanded(
              flex: 7,
              child: MultiviewerCanvasComponent(),
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
                      color: Provider.of<ThemeProvider>(context).isDarkMode
                          ? const Color.fromRGBO(43, 46, 56, 1)
                          : const Color.fromRGBO(219, 222, 213, 1),
                      child: MultiviewerListComponent(
                        title: "Scenes",
                        itemList: widget._listScenes,
                        onAddItem: () {
                          widget._listScenes
                              .add('Scene ${widget._listScenes.length + 1}');
                          setState(() {});
                        },
                        onRemoveItem: (int index) async {
                          String? result =
                              await _showRemoveConfirmationDialog();
                          if (result == "Ok") {
                            setState(() {
                              widget._listScenes.removeAt(index);
                            });
                          }
                        },
                        onMoveDownItem: (int index) {
                          final String temp = widget._listScenes[index];
                          widget._listScenes[index] =
                              widget._listScenes[index + 1];
                          widget._listScenes[index + 1] = temp;
                          setState(() {});
                        },
                        onMoveUpItem: (int index) {
                          final String temp = widget._listScenes[index];
                          widget._listScenes[index] =
                              widget._listScenes[index - 1];
                          widget._listScenes[index - 1] = temp;
                          setState(() {});
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  // Second cell
                  Expanded(
                    child: Container(
                      color: Provider.of<ThemeProvider>(context).isDarkMode
                          ? const Color.fromRGBO(43, 46, 56, 1)
                          : const Color.fromRGBO(219, 222, 213, 1),
                      child: MultiviewerListComponent(
                        title: "Inputs",
                        itemList: widget._listInputs,
                        onAddItem: () {
                          _showManageInputsDialog(context);

                          // widget._listInputs
                          //    .add('Input ${widget._listInputs.length + 1}');
                          // setState(() {});
                        },
                        onRemoveItem: (int index) {
                          widget._listInputs.removeAt(index);
                          setState(() {});
                        },
                        onMoveDownItem: (int index) {
                          final String temp = widget._listInputs[index];
                          widget._listInputs[index] =
                              widget._listInputs[index + 1];
                          widget._listInputs[index + 1] = temp;
                          setState(() {});
                        },
                        onMoveUpItem: (int index) {
                          final String temp = widget._listInputs[index];
                          widget._listInputs[index] =
                              widget._listInputs[index - 1];
                          widget._listInputs[index - 1] = temp;
                          setState(() {});
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  // Third cell
                  Expanded(
                    child: Container(
                      color: Provider.of<ThemeProvider>(context).isDarkMode
                          ? const Color.fromRGBO(43, 46, 56, 1)
                          : const Color.fromRGBO(219, 222, 213, 1),
                      child: MultiviewerListComponent(
                        title: "Outputs",
                        itemList: widget._listOutputs,
                        onAddItem: () {
                          widget._listOutputs
                              .add('Output ${widget._listOutputs.length + 1}');
                          setState(() {});
                        },
                        onRemoveItem: (int index) {
                          widget._listOutputs.removeAt(index);
                          setState(() {});
                        },
                        onMoveDownItem: (int index) {
                          final String temp = widget._listOutputs[index];
                          widget._listOutputs[index] =
                              widget._listOutputs[index + 1];
                          widget._listOutputs[index + 1] = temp;
                          setState(() {});
                        },
                        onMoveUpItem: (int index) {
                          final String temp = widget._listOutputs[index];
                          widget._listOutputs[index] =
                              widget._listOutputs[index - 1];
                          widget._listOutputs[index - 1] = temp;
                          setState(() {});
                        },
                      ),
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
