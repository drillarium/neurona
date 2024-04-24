import 'package:flutter/material.dart';
import 'package:neurona/pages/home.dart';
import 'package:neurona/services/language.service.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    // Detect system language. Do not move to main.dart.
    // Context does not includes localization information
    Locale systemLocale = Localizations.localeOf(context);
    LanguageService.init(systemLocale);

    return Scaffold(
      appBar: AppBar(
        title: Text(LanguageService.instance!.translate("login")),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                decoration: const InputDecoration(labelText: 'Username'),
              ),
              const SizedBox(height: 20.0),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: 20.0),
              ElevatedButton(
                onPressed: () {
                  // Simulate login success
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const HomeComponent(),
                    ),
                  );
                },
                child: const Text('Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
