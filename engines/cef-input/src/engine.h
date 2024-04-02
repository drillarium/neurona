#pragma once

// CefInputEngine
class CefInputEngine
{
public:
  CefInputEngine();
  virtual ~CefInputEngine();
  bool abort();
  bool putCommand(const char *_JsonCommand);
  bool run(const char *_JsonConfig);

protected:
  std::string UID_;
  bool abort_ = false;                   // abort flag
};
