// user model
class User {
  final int id;
  final String username;
  final String email;
  final String password;
  final int isAdmin;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.password,
    required this.isAdmin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      password: json['password'],
      isAdmin: json['isAdmin'],
    );
  }

  factory User.fromData(String username, String email, String password) {
    return User(
      id: -1,
      username: username,
      email: email,
      password: password,
      isAdmin: 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'password': password,
      'isAdmin': isAdmin,
    };
  }
}
