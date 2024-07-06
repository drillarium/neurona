// Launcher model
class Launcher {
  final int id;
  final String address;
  bool connected = false;
  Map<String, dynamic>? config;

  Launcher({required this.id, required this.address});

  factory Launcher.fromJson(Map<String, dynamic> json) {
    return Launcher(id: json['id'], address: json['address']);
  }

  factory Launcher.fromData(String address) {
    return Launcher(id: -1, address: address);
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'address': address};
  }
}
