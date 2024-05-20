import 'package:flutter/material.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:provider/provider.dart';

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
          padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 0.0),
          color: Colors.grey[700],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Title aligned to the left
              Text(
                widget.title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14.0,
                  color: Colors.white,
                ),
              ),
              // Buttons aligned to the right
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.add),
                    color: Colors.white,
                    onPressed: () => widget.onAddItem(),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove),
                    color: _selectedIndex < 0 ? Colors.grey : Colors.white,
                    onPressed: _selectedIndex < 0
                        ? null
                        : () => widget.onRemoveItem(_selectedIndex),
                  ),
                  IconButton(
                      icon: const Icon(Icons.arrow_upward),
                      color: _selectedIndex <= 0 ? Colors.grey : Colors.white,
                      onPressed: _selectedIndex <= 0
                          ? null
                          : () {
                              widget.onMoveUpItem(_selectedIndex);
                              _selectedIndex--;
                            }),
                  IconButton(
                    icon: const Icon(Icons.arrow_downward),
                    color: _selectedIndex < 0 ||
                            _selectedIndex >= widget.itemList.length - 1
                        ? Colors.grey
                        : Colors.white,
                    onPressed: _selectedIndex < 0 ||
                            _selectedIndex >= widget.itemList.length - 1
                        ? null
                        : () {
                            widget.onMoveDownItem(_selectedIndex);
                            _selectedIndex++;
                          },
                  ),
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
              return SizedBox(
                height: 40,
                child: Container(
                  color: _selectedIndex == index
                      ? Colors.blue.withOpacity(0.5)
                      : Colors.transparent,
                  child: ListTile(
                    title: Text(
                      widget.itemList[index],
                      style: TextStyle(
                        fontSize: 14.0,
                        color: Provider.of<ThemeProvider>(context).isDarkMode
                            ? Colors.white
                            : Colors.black,
                      ),
                    ),
                    selected: index == _selectedIndex,
                    onTap: () {
                      setState(() {
                        _selectedIndex = index;
                      });
                    },
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
