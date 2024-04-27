import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

const Map<String, Map<String, String>> translations = {
  'en': {
    "hello": "Hello",
    "login": "Login",
  },
  'fr': {
    "hello": "Allo",
    "login": "Login",
  }
};

class LanguageService {
  late Locale _currentLocale;
  late Map<String, String> _translations;
  static LanguageService? _instance;

  LanguageService._privateConstructor() {
    _currentLocale = const Locale('en', 'US'); // Default to English
    load();
  }

  // Getter to access the singleton instance
  static LanguageService? get instance => _instance;

  void setLocale(Locale locale) {
    _currentLocale = locale;
    load();
  }

  Locale get currentLocale => _currentLocale;

  // Factory method to initialize the singleton instance with a base URL
  factory LanguageService.init(Locale locale) {
    _instance ??= LanguageService._privateConstructor();
    _instance!._currentLocale = locale;
    _instance!.load();
    return _instance!;
  }

  void load() {
    if (translations.containsKey(_currentLocale.languageCode)) {
      _translations = translations[_currentLocale.languageCode]!;
    } else {
      _translations = translations['en']!;
    }
  }

  String translate(String key) {
    return _translations[key] ?? key;
  }

  static List<Locale> get supportedLocales {
    return [
      const Locale('en', 'US'), // English
      const Locale('fr', 'FR'), // Spanish
    ];
  }

  static Iterable<LocalizationsDelegate<dynamic>> get localizationsDelegates {
    return [
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ];
  }
}
