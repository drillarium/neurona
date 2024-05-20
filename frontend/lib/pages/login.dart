import 'dart:async';

import 'package:flutter/material.dart';
import 'package:neurona/pages/home.dart';
import 'package:neurona/pages/register.dart';
import 'package:neurona/services/language.service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginPage extends StatefulWidget {
  final String error;
  const LoginPage({super.key, this.error = ""});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _rememberMe = true;
  bool _isLoginButtonEnabled = false;
  bool _isErrorVisible = true;
  Timer? _errorTimer;

  @override
  void initState() {
    super.initState();
    _loadRememberMe();
    _emailController.addListener(_updateLoginButtonState);
    _passwordController.addListener(_updateLoginButtonState);
    _errorTimer = Timer(const Duration(seconds: 5), () {
      _clearError();
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _errorTimer?.cancel();
    super.dispose();
  }

  void _clearError() {
    setState(() {
      _isErrorVisible = false;
    });
  }

  void _updateLoginButtonState() {
    setState(() {
      _isLoginButtonEnabled = _emailController.text.isNotEmpty &&
          _passwordController.text.isNotEmpty;
    });
  }

  _loadRememberMe() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      _rememberMe = prefs.getBool('rememberMe') ?? false;
      if (_rememberMe) {
        _emailController.text = prefs.getString('emailorname') ?? '';
        _passwordController.text = prefs.getString('password') ?? '';
      }
    });
  }

  _saveRememberMe() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    prefs.setBool('rememberMe', _rememberMe);
    if (_rememberMe) {
      prefs.setString('emailorname', _emailController.text);
      prefs.setString('password', _passwordController.text);
    } else {
      prefs.remove('emailorname');
      prefs.remove('password');
    }
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

  Widget _loginForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(
              child: Text(
                LanguageService.instance!.translate("login"),
                style: const TextStyle(color: Colors.black, fontSize: 48.0),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _buildTextFormField(
            _emailController, 'Email or username', Icons.email, false),
        const SizedBox(height: 20),
        _buildTextFormField(
            _passwordController, 'Password', Icons.password, true),
        const SizedBox(height: 5),
        Row(
          children: [
            Checkbox(
              value: _rememberMe,
              visualDensity: const VisualDensity(
                vertical: -4,
              ),
              side: const BorderSide(
                color: Colors.black,
              ),
              fillColor: WidgetStateProperty.resolveWith<Color>(
                (Set<WidgetState> states) {
                  if (states.contains(WidgetState.selected)) {
                    return Colors.grey;
                  }
                  return Colors.transparent;
                },
              ),
              onChanged: (value) {
                setState(() {
                  _rememberMe = value!;
                });
              },
            ),
            const Text(
              'Remember me',
              style: TextStyle(color: Colors.black, fontSize: 14.0),
            ),
          ],
        ),
        const SizedBox(height: 5),
        ElevatedButton(
          onPressed: !_isLoginButtonEnabled
              ? null
              : () {
                  // save remember me
                  _saveRememberMe();

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
            'Login',
            style: TextStyle(color: Colors.white, fontSize: 18.0),
          ),
        ),
        const SizedBox(height: 5),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "Don't have and account. ",
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
                      builder: (context) => const RegisterPage(),
                    ),
                    (Route<dynamic> route) => false,
                  );
                },
                child: const Text(
                  "Register",
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
              child: Text(widget.error,
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
                    child: _loginForm(),
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
                          child: _loginForm(),
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
