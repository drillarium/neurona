import 'package:flutter/material.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:provider/provider.dart';
import 'package:flutter_svg/flutter_svg.dart';

const int multiviewerAPP = 0;
const int videoMixerAPP = 1;
const int studioApp = 2;

class AppSidebar extends StatelessWidget {
  final Function(int) onAppSelected;
  final Function() onLogout;
  final Function()? onAdmin;
  final int selectedApp;
  final String username;

  const AppSidebar({
    super.key,
    required this.onAppSelected,
    required this.selectedApp,
    required this.onLogout,
    required this.username,
    required this.onAdmin,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          children: [
            IconButton(
              icon: SvgPicture.asset(
                'assets/images/multiviewer.svg',
                width: 24,
                height: 24,
                colorFilter: ColorFilter.mode(
                    selectedApp == multiviewerAPP
                        ? Colors.blue
                        : Provider.of<ThemeProvider>(context).isDarkMode
                            ? Colors.white
                            : Colors.black,
                    BlendMode.srcIn),
              ),
              tooltip: "Multiviewer",
              onPressed: () => onAppSelected(multiviewerAPP),
            ),
            IconButton(
              icon: SvgPicture.asset(
                'assets/images/videomixer.svg',
                width: 24,
                height: 24,
                colorFilter: ColorFilter.mode(
                    selectedApp == videoMixerAPP
                        ? Colors.blue
                        : Provider.of<ThemeProvider>(context).isDarkMode
                            ? Colors.white
                            : Colors.black,
                    BlendMode.srcIn),
              ),
              tooltip: "Videomixer",
              onPressed: () => onAppSelected(videoMixerAPP),
            ),
            IconButton(
              icon: SvgPicture.asset(
                'assets/images/studio.svg',
                width: 24,
                height: 24,
                colorFilter: ColorFilter.mode(
                    selectedApp == studioApp
                        ? Colors.blue
                        : Provider.of<ThemeProvider>(context).isDarkMode
                            ? Colors.white
                            : Colors.black,
                    BlendMode.srcIn),
              ),
              tooltip: "Studio",
              onPressed: () => onAppSelected(studioApp),
            ),
          ],
        ),
        Column(
          children: [
            IconButton(
              icon: const Icon(Icons.engineering),
              onPressed: onAdmin,
              tooltip: "Admin tools",
            ),
            IconButton(
              icon: Consumer<ThemeProvider>(
                builder: (context, themeProvider, child) {
                  return Icon(
                    themeProvider.isDarkMode
                        ? Icons.brightness_7
                        : Icons.brightness_1,
                    color:
                        themeProvider.isDarkMode ? Colors.white : Colors.black,
                  );
                },
              ),
              onPressed: () =>
                  Provider.of<ThemeProvider>(context, listen: false)
                      .toggleTheme(),
              tooltip: Provider.of<ThemeProvider>(context).isDarkMode
                  ? "Light"
                  : "Dark",
            ),
            Tooltip(
              message: username,
              child: IconButton(
                icon: const Icon(Icons.person),
                onPressed: onLogout,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
