import 'package:flutter/material.dart';
import 'package:neurona/components/app_sidebar.dart';
import 'package:neurona/pages/login.dart';
import 'package:neurona/pages/multiviewer.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:neurona/services/api.service.dart';
import 'package:neurona/services/language.service.dart';
import 'package:provider/provider.dart';

class HomePage extends StatefulWidget {
  final String email;
  final String password;
  const HomePage({super.key, this.email = "", this.password = ""});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedApp = app1ID;
  bool isSignedIn = false;
  String username = "";

  Widget _getCenterApp() {
    switch (_selectedApp) {
      case app1ID:
        return MultiviewerPage();
      case app2ID:
        return const Center(child: Text('Messages Page'));
      case app3ID:
        return const Center(child: Text('Notifications Page'));
      case app4ID:
        return const Center(child: Text('Profile Page'));
      default:
        return const Center(child: Text('Unknown Page'));
    }
  }

  getUserData() async {
    ApiService.instance?.getUser(widget.email).then((response) {
      if (response != null) {
        setState(() {
          if (response.containsKey('username')) {
            username = response['username'];
          }
          isSignedIn = true;
        });
      }
    });
  }

  checkAuthentication() async {
    ApiService.instance
        ?.validateUser(widget.email, widget.password)
        .then((response) {
      if (!response) {
        String error = widget.email.isEmpty && widget.password.isEmpty
            ? ""
            : "Invalid email or wrong password";

        // Navigate back to the login page
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => LoginPage(error: error)),
          (Route<dynamic> route) => false,
        );
      } else {
        getUserData();
      }
    }).catchError((error) {
      // Navigate back to the login page
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => LoginPage(error: error)),
        (Route<dynamic> route) => false,
      );
    });
  }

  @override
  void initState() {
    super.initState();
    checkAuthentication();
  }

  @override
  Widget build(BuildContext context) {
    // Detect system language. Do not move to main.dart.
    // Context does not includes localization information
    Locale systemLocale = Localizations.localeOf(context);
    LanguageService.init(systemLocale);

    return Center(
      child: !isSignedIn
          ? const CircularProgressIndicator()
          : Row(children: [
              Container(
                width: 80,
                color: Provider.of<ThemeProvider>(context).isDarkMode
                    ? Colors.grey[300]
                    : Colors.grey[600],
                child: AppSidebar(
                  username: username,
                  selectedApp: _selectedApp,
                  onAppSelected: (index) {
                    setState(() {
                      _selectedApp = index;
                    });
                  },
                  onLogout: () {
                    // Show confirmation dialog before logging out
                    showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return AlertDialog(
                          title: const Text('Logout Confirmation'),
                          content:
                              const Text('Are you sure you want to logout?'),
                          actions: <Widget>[
                            TextButton(
                              onPressed: () =>
                                  Navigator.pop(context), // Cancel logout
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () {
                                // Navigate back to the login page
                                Navigator.pushAndRemoveUntil(
                                  context,
                                  MaterialPageRoute(
                                      builder: (context) => const LoginPage()),
                                  (Route<dynamic> route) => false,
                                );
                              },
                              child: const Text('Logout'),
                            ),
                          ],
                        );
                      },
                    );
                  },
                ),
              ),
              Expanded(
                child: _getCenterApp(),
              ),
            ]),
    );
  }
}
