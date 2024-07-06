import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:neurona/config.dart';
import 'package:neurona/pages/home.dart';
import 'package:neurona/services/api.service.dart';
import 'package:neurona/services/language.service.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:neurona/services/launcher.service.dart';
import 'package:neurona/services/multiviewer.service.dart';
import 'package:neurona/services/ws.service.dart';
import 'package:provider/provider.dart';
import 'package:window_manager/window_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!kIsWeb) {
    await windowManager.ensureInitialized();

    WindowOptions windowOptions = const WindowOptions(
      size: Size(800, 600),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden,
    );
    windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.maximize();
      await windowManager.focus();
      await windowManager.setPreventClose(false);
    });
  }

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
    return FutureBuilder(
      future: AppConfig.loadConfig(),
      builder: (BuildContext context, AsyncSnapshot<void> snapshot) {
        if (snapshot.connectionState == ConnectionState.done) {
          // init api service
          ApiService.init(AppConfig.backendAddress);
          ApiLauncherService.init(AppConfig.backendAddress);
          WebSocketClient.init(AppConfig.backendAddress);
          MultiviewerService.init(AppConfig.backendAddress);

          // HomePage
          return Consumer<ThemeProvider>(
            builder: (context, themeProvider, child) {
              return MaterialApp(
                title: 'N E U R O N A',
                theme: themeProvider.currentTheme,
                home: const HomePage(),
                debugShowCheckedModeBanner: false,
                localizationsDelegates: LanguageService.localizationsDelegates,
                supportedLocales: LanguageService.supportedLocales,
              );
            },
          );
        } else {
          return const CircularProgressIndicator();
        }
      },
    );
  }
}
