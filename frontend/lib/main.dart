import 'package:flutter/material.dart';
import 'package:neurona/services/language.service.dart';
import 'package:neurona/pages/login.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp(
          title: 'N E U R O N A',
          theme: themeProvider.currentTheme,
          home: const LoginPage(),
          debugShowCheckedModeBanner: false,
          localizationsDelegates: LanguageService.localizationsDelegates,
          supportedLocales: LanguageService.supportedLocales,
        );
      },
    );
  }
}
