import 'package:flutter/material.dart';
import 'package:neurona/components/app_sidebar.dart';
import 'package:neurona/dialogs/admin.dart';
import 'package:neurona/pages/login.dart';
import 'package:neurona/pages/multiviewer.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:neurona/services/api.service.dart';
import 'package:neurona/services/language.service.dart';
import 'package:provider/provider.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';

class HomePage extends StatefulWidget {
  final String emailorname;
  final String password;
  const HomePage({super.key, this.emailorname = "", this.password = ""});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedApp = multiviewerAPP;
  bool isSignedIn = false;
  String username = "";
  bool isAdmin = false;

  Widget _getCenterApp() {
    switch (_selectedApp) {
      case multiviewerAPP:
        return MultiviewerPage();
      case videoMixerAPP:
        return const Center(child: Text('Messages Page'));
      case studioApp:
        return const Center(child: Text('Notifications Page'));
      default:
        return const Center(child: Text('Unknown Page'));
    }
  }

  getUserData() async {
    ApiService.instance?.getUser(widget.emailorname).then((response) {
      if (response != null) {
        setState(() {
          if (response.containsKey('username')) {
            username = response['username'];
            isAdmin = (response['isAdmin'] == 1);
          }
          isSignedIn = true;
        });
      }
    });
  }

  checkAuthentication() async {
    ApiService.instance
        ?.validateUser(widget.emailorname, widget.password)
        .then((response) {
      if (!response) {
        String error = widget.emailorname.isEmpty && widget.password.isEmpty
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

  void _showAdminDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return const Center(
          child: AdminDialog(),
        );
      },
    );
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
          ? Container(
              color: Provider.of<ThemeProvider>(context).isDarkMode
                  ? Colors.black
                  : Colors.white,
              child: Center(
                child: LoadingAnimationWidget.discreteCircle(
                  color: const Color(0xFF1A1A3F),
                  size: 200,
                ),
              ),
            )
          : Row(children: [
              Container(
                width: 50,
                color: Provider.of<ThemeProvider>(context).isDarkMode
                    ? Colors.black
                    : Colors.white,
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
                  onAdmin: isAdmin
                      ? () {
                          _showAdminDialog(context);
                        }
                      : null,
                ),
              ),
              Expanded(
                child: _getCenterApp(),
              ),
            ]),
    );
  }
}
