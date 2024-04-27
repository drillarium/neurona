import 'package:flutter/material.dart';
import 'package:neurona/components/multiviewer.canvas.dart';
import 'package:neurona/components/multiviewer.list.dart';

class MultiviewerPage extends StatefulWidget {
  final List<String> _listLayouts = ['Layout 1', 'Layout 2', 'Layout 3'];
  final List<String> _listInputs = ['Input 1', 'Input 2', 'Input 3'];
  final List<String> _listOutputs = ['Output 1', 'Output 2', 'Output 3'];

  MultiviewerPage({super.key});

  @override
  State<MultiviewerPage> createState() => _MultiviewerPageState();
}

class _MultiviewerPageState extends State<MultiviewerPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Custom Component'),
      ),
      body: Column(
        children: [
          // First row with 80% height
          const Expanded(
            flex: 8,
            child: MultiviewerCanvasComponent(),
          ),
          // Second row with three cells
          Expanded(
            flex: 2,
            child: Row(
              children: [
                // First cell
                Expanded(
                  child: Container(
                    color: Colors.green, // Just for demonstration
                    child: MultiviewerListComponent(
                      title: "Layouts",
                      itemList: widget._listLayouts,
                      onAddItem: () {
                        widget._listLayouts
                            .add('Layout ${widget._listLayouts.length + 1}');
                        setState(() {});
                      },
                      onRemoveItem: (int index) {
                        widget._listLayouts.removeAt(index);
                        setState(() {});
                      },
                      onMoveDownItem: (int index) {
                        final String temp = widget._listLayouts[index];
                        widget._listLayouts[index] =
                            widget._listLayouts[index + 1];
                        widget._listLayouts[index + 1] = temp;
                        setState(() {});
                      },
                      onMoveUpItem: (int index) {
                        final String temp = widget._listLayouts[index];
                        widget._listLayouts[index] =
                            widget._listLayouts[index - 1];
                        widget._listLayouts[index - 1] = temp;
                        setState(() {});
                      },
                    ),
                  ),
                ),
                // Second cell
                Expanded(
                  child: Container(
                    color: Colors.orange, // Just for demonstration
                    child: MultiviewerListComponent(
                      title: "Inputs",
                      itemList: widget._listInputs,
                      onAddItem: () {
                        widget._listInputs
                            .add('Input ${widget._listInputs.length + 1}');
                        setState(() {});
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
                // Third cell
                Expanded(
                  child: Container(
                    color: Colors.red, // Just for demonstration
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
    );
  }
}
