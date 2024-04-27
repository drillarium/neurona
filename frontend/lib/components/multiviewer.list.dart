import 'package:flutter/material.dart';

class MultiviewerListComponent extends StatefulWidget {
  final String title;
  final List<String> itemList;
  final Function() onAddItem;
  final Function(int) onRemoveItem;
  final Function(int) onMoveUpItem;
  final Function(int) onMoveDownItem;

  const MultiviewerListComponent({
    super.key,
    required this.title,
    required this.itemList,
    required this.onAddItem,
    required this.onRemoveItem,
    required this.onMoveUpItem,
    required this.onMoveDownItem,
  });

  @override
  State<MultiviewerListComponent> createState() =>
      _MultiviewerListComponentState();
}

class _MultiviewerListComponentState extends State<MultiviewerListComponent> {
  int _selectedIndex = -1;

  @override
  Widget build(BuildContext context) {
    // case rebuild component
    if (_selectedIndex >= widget.itemList.length) _selectedIndex = -1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header with title and buttons
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          color: Colors.grey[700], // Just for demonstration
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Title aligned to the left
              Text(
                widget.title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18.0,
                ),
              ),
              // Buttons aligned to the right
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () => widget.onAddItem(),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove),
                    onPressed: _selectedIndex < 0
                        ? null
                        : () => widget.onRemoveItem(_selectedIndex),
                  ),
                  IconButton(
                      icon: const Icon(Icons.arrow_upward),
                      onPressed: _selectedIndex <= 0
                          ? null
                          : () {
                              widget.onMoveUpItem(_selectedIndex);
                              _selectedIndex--;
                            }),
                  IconButton(
                      icon: const Icon(Icons.arrow_downward),
                      onPressed: _selectedIndex < 0 ||
                              _selectedIndex >= widget.itemList.length - 1
                          ? null
                          : () {
                              widget.onMoveDownItem(_selectedIndex);
                              _selectedIndex++;
                            }),
                ],
              ),
            ],
          ),
        ),
        // List items
        // Replace this with your actual list items
        Expanded(
          child: ListView.builder(
            itemCount: widget.itemList.length,
            itemBuilder: (context, index) {
              return ListTile(
                title: Text(
                  widget.itemList[index],
                  style: TextStyle(
                    color: _selectedIndex == index
                        ? Colors.blue
                        : Colors.black, // Change font color based on selection
                  ),
                ),
                selected: index == _selectedIndex,
                onTap: () {
                  setState(() {
                    _selectedIndex = index;
                  });
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
