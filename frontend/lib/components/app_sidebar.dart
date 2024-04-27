import 'package:flutter/material.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:provider/provider.dart';

const int app1ID = 0;
const int app2ID = 1;
const int app3ID = 2;
const int app4ID = 3;

class AppSidebar extends StatelessWidget {
  final Function(int) onAppSelected;
  final Function() onLogout;
  final int selectedApp;
  final String username;

  const AppSidebar({
    super.key,
    required this.onAppSelected,
    required this.selectedApp,
    required this.onLogout,
    required this.username,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          children: [
            IconButton(
              icon: const Icon(Icons.home),
              onPressed: () => onAppSelected(app1ID),
              color: selectedApp == app1ID ? Colors.blue : Colors.black,
            ),
            IconButton(
              icon: const Icon(Icons.message),
              onPressed: () => onAppSelected(app2ID),
              color: selectedApp == app2ID ? Colors.blue : Colors.black,
            ),
            IconButton(
              icon: const Icon(Icons.notifications),
              onPressed: () => onAppSelected(app3ID),
              color: selectedApp == app3ID ? Colors.blue : Colors.black,
            ),
            IconButton(
              icon: const Icon(Icons.account_circle),
              onPressed: () => onAppSelected(app4ID),
              color: selectedApp == app4ID ? Colors.blue : Colors.black,
            ),
          ],
        ),
        Column(
          children: [
            IconButton(
              icon: Consumer<ThemeProvider>(
                builder: (context, themeProvider, child) {
                  return Icon(
                    themeProvider.isDarkMode
                        ? Icons.brightness_4
                        : Icons.brightness_7,
                    color: Colors.black,
                  );
                },
              ),
              onPressed: () =>
                  Provider.of<ThemeProvider>(context, listen: false)
                      .toggleTheme(),
            ),
            Tooltip(
              message: username,
              child: IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () => onLogout(),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
