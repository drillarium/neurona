import 'package:flutter/material.dart';
import 'package:neurona/pages/home.dart';
import 'package:neurona/services/api.service.dart';
import 'package:neurona/services/language.service.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  String error = "";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(LanguageService.instance!.translate("register")),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 20.0),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 20.0),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: 20.0),
              ElevatedButton(
                onPressed: () {
                  // save new user
                  ApiService.instance
                      ?.registerUser(_nameController.text,
                          _emailController.text, _passwordController.text)
                      .then((response) {
                    if (!response) {
                      setState(() {
                        error = "Error registering user";
                      });
                    } else {
                      // navigate to home
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (context) => HomePage(
                            email: _emailController.text,
                            password: _passwordController.text,
                          ),
                        ),
                        (Route<dynamic> route) => false,
                      );
                    }
                  });
                },
                child: const Text('Register'),
              ),
              if (error.isNotEmpty) Text(error),
            ],
          ),
        ),
      ),
    );
  }
}
