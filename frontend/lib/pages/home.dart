import 'package:flutter/material.dart';
import 'package:neurona/components/app_sidebar.dart';
import 'package:neurona/pages/login.dart';
import 'package:neurona/pages/multiviewer.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:provider/provider.dart';

class HomeComponent extends StatefulWidget {
  const HomeComponent({super.key});

  @override
  State<HomeComponent> createState() => _HomeComponentState();
}

class _HomeComponentState extends State<HomeComponent> {
  int _selectedApp = app1ID;

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

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 80,
        color: Provider.of<ThemeProvider>(context).isDarkMode
            ? Colors.grey[300]
            : Colors.grey[600],
        child: AppSidebar(
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
                  content: const Text('Are you sure you want to logout?'),
                  actions: <Widget>[
                    TextButton(
                      onPressed: () => Navigator.pop(context), // Cancel logout
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
    ]);
  }
}
