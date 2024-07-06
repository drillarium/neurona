import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';

enum ConnectionStatus { connecting, connected, disconnected, reconnecting }

class WebSocketClient {
  late WebSocketChannel channel;
  final _messageController = StreamController<String>.broadcast();
  final _statusController = StreamController<ConnectionStatus>.broadcast();
  final String url;
  bool _isManuallyDisconnected = false;
  int _reconnectAttempts = 0;
  final int _maxReconnectAttempts = -1;
  final Duration _reconnectDelay = const Duration(seconds: 2);
  ConnectionStatus _lastStatus = ConnectionStatus.disconnected;

  Stream<String> get messages => _messageController.stream;
  Stream<ConnectionStatus> get status => _statusController.stream;
  ConnectionStatus get lastStatus => _lastStatus;

// Private constructor
  WebSocketClient._privateConstructor(this.url);

  // Instance of ApiService
  static WebSocketClient? _instance;

  // Factory method to initialize the singleton instance with a base URL
  factory WebSocketClient.init(String url) {
    _instance ??= WebSocketClient._privateConstructor(url);
    _instance!.connect();
    return _instance!;
  }

  // Getter to access the singleton instance
  static WebSocketClient? get instance => _instance;

  static String connectionStatusToText(ConnectionStatus status) {
    String url = WebSocketClient.instance!.url;
    if (status == ConnectionStatus.connected) {
      return "Connected to server ($url)";
    }
    if (status == ConnectionStatus.connecting) {
      return "Connecting to server ($url)";
    }
    if (status == ConnectionStatus.disconnected) {
      return "Disconnected from server ($url)";
    }
    if (status == ConnectionStatus.reconnecting) {
      return "Reconnecting to server ($url)";
    }
    return "Unknown status";
  }

  Future<void> connect() async {
    _isManuallyDisconnected = false;
    _lastStatus = ConnectionStatus.connecting;
    _statusController.add(_lastStatus);
    await _connectToServer();
  }

  String convertHttpToWebSocket(String url) {
    if (url.startsWith('https://')) {
      return url.replaceFirst('https://', 'wss://');
    } else if (url.startsWith('http://')) {
      return url.replaceFirst('http://', 'ws://');
    } else {
      throw ArgumentError('URL must start with http:// or https://');
    }
  }

  Future<void> _connectToServer() async {
    try {
      String wsUrl = convertHttpToWebSocket(url);
      channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      await channel.ready;
      _reconnectAttempts = 0;
      _lastStatus = ConnectionStatus.connected;
      _statusController.add(_lastStatus);

      channel.stream.listen(
        (message) {
          _messageController.add(message);
        },
        onError: (error) {
          _handleDisconnection();
        },
        onDone: () {
          _handleDisconnection();
        },
      );
    } catch (e) {
      _handleDisconnection();
    }
  }

  void _handleDisconnection() {
    _lastStatus = ConnectionStatus.disconnected;
    _statusController.add(_lastStatus);
    if (!_isManuallyDisconnected &&
            (_reconnectAttempts < _maxReconnectAttempts) ||
        (_maxReconnectAttempts < 0)) {
      _reconnectAttempts++;
      Future.delayed(_reconnectDelay, _connectToServer);
    } else {
      _messageController.close();
      _statusController.close();
    }
  }

  void sendMessage(String message) {
    channel.sink.add(message);
  }

  void disconnect() {
    _isManuallyDisconnected = true;
    channel.sink.close();
    _lastStatus = ConnectionStatus.disconnected;
    _statusController.add(_lastStatus);
    _messageController.close();
    _statusController.close();
  }
}
