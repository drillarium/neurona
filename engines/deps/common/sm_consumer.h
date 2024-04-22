#pragma once

#include <string>
#include <thread>
#include "shmhelper.h"

#define DEFAULT_SMELEM_SIZE (8 * 1024 * 1024)
#define DEFAULT_SM_SIZE 4

// SharedMemoryConsumer
class SharedMemoryConsumer
{
public:
  SharedMemoryConsumer();
  virtual ~SharedMemoryConsumer();

  virtual bool init(const char *_id, int _msTimeout);
  virtual bool deinit();
  bool read();
  bool opened() { return opened_; }

protected:
  void keepAliveThreadFunc();

protected:
  std::string ID_;
  int msTimeout_ = 5000;
  ShMHandle smHandle_ = {};
  unsigned char *data_ = nullptr;   // contains copy of last read data
  unsigned long long msgID_ = 0;    // uid last message read
  int dataSize_ = 0;                // and it's size
  bool opened_ = false;
  bool running_ = false;
  std::thread workerThread_;
};