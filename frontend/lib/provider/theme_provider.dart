import 'package:flutter/material.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isDarkMode = true;

  // Light theme colors
  final ThemeData _lightTheme = ThemeData.light().copyWith(
    primaryColor: Colors.blue,

    // Set button shape to RoundedRectangleBorder with no rounded corners
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
        backgroundColor: Colors.red,
      ),
    ),
  );

  // Dark theme colors
  final ThemeData _darkTheme = ThemeData.dark().copyWith(
    primaryColor: Colors.indigo,

    // Set button shape to RoundedRectangleBorder with no rounded corners
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
        backgroundColor: Colors.blue,
      ),
    ),
  );

  // is dark
  bool get isDarkMode => _isDarkMode;

  // current theme
  ThemeData get lightTheme => _lightTheme;
  ThemeData get darkTheme => _darkTheme;
  ThemeData get currentTheme => _isDarkMode ? _darkTheme : _lightTheme;

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }
}
