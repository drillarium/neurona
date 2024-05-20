import 'dart:async';

import 'package:flutter/material.dart';
import 'package:neurona/pages/home.dart';
import 'package:neurona/pages/login.dart';
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
  bool _isRegisterButtonEnabled = false;
  bool _isErrorVisible = false;
  Timer? _errorTimer;

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_updateRegisterButtonState);
    _emailController.addListener(_updateRegisterButtonState);
    _passwordController.addListener(_updateRegisterButtonState);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _errorTimer?.cancel();
    super.dispose();
  }

  void setError(String e) {
    setState(() {
      error = e;
      _isErrorVisible = true;
      _errorTimer?.cancel();
      _errorTimer = Timer(const Duration(seconds: 5), () {
        _clearError();
      });
    });
  }

  void _clearError() {
    setState(() {
      _isErrorVisible = false;
    });
  }

  void _updateRegisterButtonState() {
    setState(() {
      _isRegisterButtonEnabled = _nameController.text.isNotEmpty &&
          _emailController.text.isNotEmpty &&
          _passwordController.text.isNotEmpty;
    });
  }

  TextFormField _buildTextFormField(TextEditingController controller,
      String labelText, IconData icon, bool obscure) {
    return TextFormField(
      controller: controller,
      cursorColor: Colors.black,
      decoration: InputDecoration(
        labelText: labelText,
        labelStyle: const TextStyle(color: Colors.grey),
        border: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.transparent),
        ),
        focusedBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.black, width: 1.0),
        ),
        prefixIcon: Icon(
          icon,
          color: Colors.grey,
        ),
      ),
      style: const TextStyle(color: Colors.black, fontSize: 18.0),
      obscureText: obscure,
    );
  }

  Widget _registerForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(
              child: Text(
                LanguageService.instance!.translate("register"),
                style: const TextStyle(color: Colors.black, fontSize: 48.0),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _buildTextFormField(_nameController, 'Name', Icons.person, false),
        const SizedBox(height: 20),
        _buildTextFormField(_emailController, 'Email', Icons.email, false),
        const SizedBox(height: 20),
        _buildTextFormField(
            _passwordController, 'Password', Icons.password, true),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: !_isRegisterButtonEnabled
              ? null
              : () {
                  // save new user
                  ApiService.instance
                      ?.registerUser(_nameController.text,
                          _emailController.text, _passwordController.text)
                      .then(
                    (response) {
                      if (!response) {
                        setError("Error registering user");
                      } else {
                        // navigate to home
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(
                            builder: (context) => HomePage(
                              emailorname: _emailController.text,
                              password: _passwordController.text,
                            ),
                          ),
                          (Route<dynamic> route) => false,
                        );
                      }
                    },
                  ).catchError((error) {
                    setError(error.toString());
                  });
                },
          style: ButtonStyle(
            backgroundColor: WidgetStateProperty.resolveWith<Color>(
              (Set<WidgetState> states) {
                if (states.contains(WidgetState.disabled)) {
                  return Colors.grey;
                }
                return Colors.black;
              },
            ),
            shape: WidgetStateProperty.all<RoundedRectangleBorder>(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20.0),
              ),
            ),
          ),
          child: const Text(
            'Register',
            style: TextStyle(color: Colors.white, fontSize: 18.0),
          ),
        ),
        const SizedBox(height: 5),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "Already registered. ",
              style: TextStyle(color: Colors.black, fontSize: 12.0),
            ),
            MouseRegion(
              cursor: SystemMouseCursors.click,
              child: GestureDetector(
                onTap: () {
                  // navigate to home
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const LoginPage(),
                    ),
                    (Route<dynamic> route) => false,
                  );
                },
                child: const Text(
                  "Login",
                  style: TextStyle(color: Colors.blue, fontSize: 12.0),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Visibility(
              visible: _isErrorVisible,
              replacement: const Text("", style: TextStyle(fontSize: 12.0)),
              child: Text(error,
                  style: const TextStyle(color: Colors.red, fontSize: 12.0)),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth < 800) {
            return Container(
              color: Colors.white,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 100),
                    child: _registerForm(),
                  ),
                ],
              ),
            );
          } else {
            return Row(
              children: [
                Expanded(
                  flex: 5,
                  child: Container(
                      color: Colors.blue,
                      child: Stack(
                        children: [
                          Image.asset(
                            'images/background.jpg',
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                          ),
                          Container(
                            padding: const EdgeInsets.all(20),
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.end,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Neurona ver 1.0',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      decoration: TextDecoration.none),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )),
                ),
                Expanded(
                  flex: 5,
                  child: Container(
                    color: Colors.white,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 100),
                          child: _registerForm(),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }
        },
      ),
    );
  }
}
