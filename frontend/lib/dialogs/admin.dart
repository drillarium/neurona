import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:neurona/common/json_schema_form.dart';
import 'package:neurona/models/launchers.dart';
import 'package:neurona/models/schema.dart';
import 'package:neurona/models/users.dart';
import 'package:neurona/provider/theme_provider.dart';
import 'package:neurona/schema/json_schema_bloc.dart';
import 'package:neurona/services/api.service.dart';
import 'package:neurona/services/launcher.service.dart';
import 'package:neurona/services/ws.service.dart';
import 'package:provider/provider.dart';

class AdminDialog extends StatefulWidget {
  const AdminDialog({super.key});

  @override
  State<AdminDialog> createState() => _AdminDialogState();
}

const int userAdmin = 0;
const int launcherAdmin = 1;
const int backednAdmin = 2;

class _AdminDialogState extends State<AdminDialog> {
  int selectedItemIndex = 0;
  JsonSchemaBloc jsonSchemaBloc = JsonSchemaBloc();
  int selectedAdmin = backednAdmin;
  List<User>? users;
  List<Launcher>? launchers;
  String jsonModel = "";
  String message = "";
  String severity = "info";
  Timer? _timer;
  bool _showMessage = false;
  final WebSocketClient? _webSocketClient = WebSocketClient.instance;
  late StreamSubscription<String> _wsMessage;
  bool showLauncherConfig = false;

  @override
  void initState() {
    super.initState();
    selectAdmin(selectedAdmin);

    // websocket for launcher connected status
    _wsMessage = _webSocketClient!.messages.listen((message) {
      Map<String, dynamic> backendMessage = jsonDecode(message);
      if (backendMessage["message"] == "launcher_status_change") {
        if (selectedAdmin == launcherAdmin) {
          int launcherUID = backendMessage["uid"];
          bool connected = backendMessage["connected"];
          Map<String, dynamic>? config;
          if (connected) {
            config = backendMessage["status"]["config"];
          }
          setState(() {
            Launcher launcher =
                launchers!.firstWhere((item) => item.id == launcherUID);
            launcher.connected = connected;
            launcher.config = connected ? config : null;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _wsMessage.cancel();
    super.dispose();
  }

  void setMessage(String messageSeverity, String messageText) {
    setState(() {
      message = messageText;
      severity = messageSeverity;
      _showMessage = true;
    });
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel(); // Cancel any existing timer
    _timer = Timer(const Duration(seconds: 3), () {
      setState(() {
        _showMessage = false;
      });
    });
  }

  severityToColor(String severity) {
    if (severity == "error") {
      return Colors.red;
    } else if (severity == "warning") {
      return Colors.orange;
    }
    return Colors.blue;
  }

  buildSchema() {
    if (selectedAdmin == userAdmin) {
      return Expanded(
        child: buildSchemaInternal("assets/json/users.json", jsonModel),
      );
    } else if (selectedAdmin == launcherAdmin) {
      if (!showLauncherConfig) {
        return Expanded(
          child: buildSchemaInternal("assets/json/launchers.json", jsonModel),
        );
      } else {
        return Expanded(
          child: buildSchemaInternal("assets/json/launcher.json", jsonModel),
        );
      }
    } else if (selectedAdmin == backednAdmin) {
      return Expanded(
        child: buildSchemaInternal("assets/json/backend.json", jsonModel),
      );
    }
  }

  buildSchemaInternal(String schema, String model) {
    jsonSchemaBloc.getSchema(schema, model);
    return StreamBuilder<Schema>(
      stream: jsonSchemaBloc.jsonSchema,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return JsonSchemaForm(
            schema: snapshot.data!,
            jsonSchemaBloc: jsonSchemaBloc,
            onSubmit: (model) {
              if (selectedAdmin == launcherAdmin ||
                  selectedAdmin == backednAdmin) {
                setMessage("error", "Not supported");
                return;
              }

              // update or add
              if (jsonModel.isEmpty) {
                if (selectedAdmin == userAdmin) {
                  User user = User.fromJson(model);
                  ApiService.instance?.createUser(user).then((response) {
                    setMessage("info", "User created");
                    selectedItemIndex = users!.length;
                    selectAdmin(selectedAdmin);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error creating user ${error.toString()}");
                  });
                } else if (selectedAdmin == launcherAdmin) {
                  Launcher launcher = Launcher.fromJson(model);
                  ApiLauncherService.instance
                      ?.createLauncher(launcher)
                      .then((response) {
                    setMessage("info", "Host created");
                    selectedItemIndex = launchers!.length;
                    selectAdmin(selectedAdmin);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error creating launcher ${error.toString()}");
                  });
                }
              } else {
                if (selectedAdmin == userAdmin) {
                  User user = User.fromJson(model);
                  ApiService.instance?.updateUser(user).then((response) {
                    setMessage("info", "User updated");
                    selectAdmin(selectedAdmin);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error updating user ${error.toString()}");
                  });
                } else if (selectedAdmin == launcherAdmin) {
                  Launcher launcher = Launcher.fromJson(model);
                  ApiLauncherService.instance
                      ?.updateLauncher(launcher)
                      .then((response) {
                    setMessage("info", "Host updated");
                    selectAdmin(selectedAdmin);
                  }).catchError((error) {
                    setMessage(
                        "error", "Error updating launcher ${error.toString()}");
                  });
                }
              }
            },
          );
        } else {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
      },
    );
  }

  selectAdmin(int index) {
    setState(() {
      if (index == userAdmin) {
        ApiService.instance!.fetchUsers().then((response) {
          setState(() {
            selectedAdmin = userAdmin;
            users = response;
            jsonModel =
                selectedItemIndex >= 0 && selectedItemIndex < users!.length
                    ? jsonEncode(users![selectedItemIndex])
                    : "";
          });
        }).catchError((error) {
          setState(() {
            setMessage("error", "Error fetching users");
            selectedAdmin = userAdmin;
            users = null;
            jsonModel = "";
          });
        });
      } else if (index == launcherAdmin) {
        ApiLauncherService.instance!.fetchLaunchers().then((response) {
          setState(() {
            selectedAdmin = launcherAdmin;
            launchers = response;
            jsonModel =
                selectedItemIndex >= 0 && selectedItemIndex < launchers!.length
                    ? jsonEncode(launchers![selectedItemIndex])
                    : "";
          });

          // for each launcher, get check if it's running and it's configuration
          launchers?.forEach((launcher) {
            ApiLauncherService.instance!
                .getLauncherStatus(launcher.id)
                .then((response) {
              launcher.connected = response["connected"];
              if (launcher.connected) {
                launcher.config = response["config"];
              }
              setState(() {});
            }).catchError((error) {
              launcher.connected = false;
            });
          });
        }).catchError((error) {
          setState(() {
            setMessage("error", "Error fetching launchers");
            selectedAdmin = launcherAdmin;
            launchers = null;
            jsonModel = "";
          });
        });
      }
      if (index == backednAdmin) {
        ApiService.instance!.fetchConfig().then((response) {
          setState(() {
            selectedAdmin = backednAdmin;
            jsonModel = jsonEncode(response);
          });
        }).catchError((error) {
          setState(() {
            setMessage("error", "Error fetching backend");
            selectedAdmin = backednAdmin;
            jsonModel = "";
          });
        });
      }
    });
  }

  selectItem(int index, {bool config = false}) {
    setState(() {
      showLauncherConfig = config;
      if (selectedAdmin == userAdmin) {
        jsonModel = jsonEncode(users![index]);
      } else if (selectedAdmin == launcherAdmin) {
        if (!config) {
          jsonModel = jsonEncode(launchers![index]);
        } else {
          jsonModel = jsonEncode(launchers![index].config);
        }
      }
      selectedItemIndex = index;
    });
  }

  itemCount() {
    if (selectedAdmin == userAdmin) {
      return users != null ? users?.length : 0;
    } else if (selectedAdmin == launcherAdmin) {
      return launchers != null ? launchers?.length : 0;
    }
    return 0;
  }

  itemText(int index) {
    if (selectedAdmin == userAdmin) {
      return users?[index].username;
    } else if (selectedAdmin == launcherAdmin) {
      return launchers?[index].address;
    }
    return "";
  }

  itemSubtitle(int index) {
    if (selectedAdmin == userAdmin) {
      return users?[index].email;
    } else if (selectedAdmin == launcherAdmin) {
      return launchers![index].connected ? "Connected" : "";
    }
    return "";
  }

  removeItem(int index) {
    // do not remove admin users
    if (selectedAdmin == userAdmin) {
      if (users![index].isAdmin != 1) {
        ApiService.instance?.deleteUser(users![index].id).then((response) {
          setState(() {
            setMessage("info", "User deleted");
            users?.removeAt(index);
            if (selectedItemIndex >= users!.length) {
              selectedItemIndex = users!.isNotEmpty ? 0 : -1;
            }
            if (selectedItemIndex >= 0) {
              jsonModel = jsonEncode(users![selectedItemIndex]);
            } else {
              jsonModel = "";
            }
          });
        }).catchError((error) {
          setMessage("error", "Error deleting user ${error.toString()}");
        });
      } else {
        setMessage("error", "Admin users cannot be deleted");
      }
    }
    // at least one launcher
    else if (selectedAdmin == launcherAdmin) {
      if (launchers!.length > 1) {
        ApiLauncherService.instance
            ?.deleteLauncher(launchers![index].id)
            .then((response) {
          setState(() {
            setMessage("info", "Host deleted");
            launchers?.removeAt(index);
            if (selectedItemIndex >= launchers!.length) {
              selectedItemIndex = launchers!.isNotEmpty ? 0 : -1;
            }
            if (selectedItemIndex >= 0) {
              jsonModel = jsonEncode(launchers![selectedItemIndex]);
            } else {
              jsonModel = "";
            }
          });
        }).catchError((error) {
          setMessage("error", "Error deleting launcher ${error.toString()}");
        });
      } else {
        setMessage("error", "Last launcher cannot be deleted");
      }
    }
    return "";
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final dialogWidth = screenWidth * 2 / 3;
    final dialogHeight = screenHeight * 2 / 3;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0.0)),
      child: Container(
        width: dialogWidth,
        height: dialogHeight,
        decoration: BoxDecoration(
          border: Border.all(
            color: Colors.white,
            width: 1.0,
          ),
        ),
        padding: const EdgeInsets.all(10.0),
        child: Row(
          children: [
            // Left Side: sections
            SizedBox(
              width: 40,
              child: Column(
                children: [
                  IconButton(
                    icon: Icon(Icons.computer,
                        color: selectedAdmin == backednAdmin
                            ? Colors.blue
                            : Provider.of<ThemeProvider>(context).isDarkMode
                                ? Colors.white
                                : Colors.black),
                    onPressed: () {
                      selectAdmin(backednAdmin);
                    },
                    tooltip: "Server",
                  ),
                  IconButton(
                    icon: Icon(Icons.person,
                        color: selectedAdmin == userAdmin
                            ? Colors.blue
                            : Provider.of<ThemeProvider>(context).isDarkMode
                                ? Colors.white
                                : Colors.black),
                    onPressed: () {
                      selectAdmin(userAdmin);
                    },
                    tooltip: "Users",
                  ),
                  IconButton(
                    icon: Icon(Icons.settings,
                        color: selectedAdmin == launcherAdmin
                            ? Colors.blue
                            : Provider.of<ThemeProvider>(context).isDarkMode
                                ? Colors.white
                                : Colors.black),
                    onPressed: () {
                      selectAdmin(launcherAdmin);
                    },
                    tooltip: "Hosts",
                  ),
                ],
              ),
            ),
            // List and buttons
            if (selectedAdmin == userAdmin || selectedAdmin == launcherAdmin)
              Expanded(
                flex: 2,
                child: Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        itemCount: itemCount(),
                        itemBuilder: (context, index) {
                          return ListTile(
                            title: Text(
                              itemText(index),
                              style: TextStyle(
                                color: selectedItemIndex == index
                                    ? Colors.blue
                                    : Provider.of<ThemeProvider>(context)
                                            .isDarkMode
                                        ? Colors.white
                                        : Colors.black,
                                fontSize: 14.0,
                              ),
                            ),
                            subtitle: Text(
                              itemSubtitle(index),
                              style: TextStyle(
                                color: selectedItemIndex == index
                                    ? Colors.blue
                                    : Provider.of<ThemeProvider>(context)
                                            .isDarkMode
                                        ? Colors.white
                                        : Colors.black,
                                fontSize: 12.0,
                              ),
                            ),
                            trailing: selectedAdmin == launcherAdmin &&
                                    launchers![index].connected
                                ? IconButton(
                                    icon: const Icon(Icons.settings),
                                    iconSize: 20,
                                    color: selectedItemIndex == index
                                        ? Colors.blue
                                        : Provider.of<ThemeProvider>(context)
                                                .isDarkMode
                                            ? Colors.white
                                            : Colors.black,
                                    onPressed: () {
                                      selectItem(index, config: true);
                                    },
                                  )
                                : null,
                            selected: selectedItemIndex == index,
                            onTap: () {
                              selectItem(index);
                            },
                          );
                        },
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        IconButton(
                          onPressed: () {
                            setState(() {
                              selectedItemIndex = -1;
                              jsonModel = "";
                            });
                          },
                          iconSize: 20,
                          icon: const Icon(Icons.add),
                        ),
                        const SizedBox(width: 5),
                        IconButton(
                          onPressed: selectedItemIndex >= 0
                              ? () {
                                  showDialog(
                                      context: context,
                                      builder: (BuildContext context) {
                                        return AlertDialog(
                                          title:
                                              const Text('Remove Confirmation'),
                                          content: const Text(
                                              'Are you sure you want to remove?'),
                                          actions: <Widget>[
                                            TextButton(
                                              onPressed: () =>
                                                  Navigator.pop(context),
                                              child: const Text('Cancel'),
                                            ),
                                            TextButton(
                                              onPressed: () {
                                                removeItem(selectedItemIndex);
                                                Navigator.pop(context);
                                              },
                                              child: const Text('Remove'),
                                            ),
                                          ],
                                        );
                                      });
                                }
                              : null,
                          iconSize: 20,
                          icon: const Icon(Icons.remove),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            const VerticalDivider(),
            // Right Side: Details
            Expanded(
              flex: 3,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _showMessage
                            ? Text(
                                message,
                                style: TextStyle(
                                  color: severityToColor(severity),
                                  fontSize: 14.0,
                                ),
                              )
                            : Container(),
                      ),
                      IconButton(
                        iconSize: 16,
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          Navigator.of(context).pop();
                        },
                      ),
                    ],
                  ),
                  buildSchema()
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
