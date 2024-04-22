#pragma once

#include <string>
#include <thread>
#include "shmhelper.h"

#define DEFAULT_SMELEM_SIZE (8 * 1024 * 1024)
#define DEFAULT_SM_SIZE 4

// SharedMemoryProducer
class SharedMemoryProducer
{
public:
  SharedMemoryProducer();
  virtual ~SharedMemoryProducer();

  virtual bool init(const char *_id, int _size = DEFAULT_SMELEM_SIZE, int _count = DEFAULT_SM_SIZE);
  virtual bool deinit();
  bool write(const unsigned char *_data, int _dataSize);

protected:
  void keepAliveThreadFunc();

protected:
  std::string ID_;
  ShMHandle smHandle_ = {};
  unsigned long long smMessageID_ = 0;
  bool running_ = false;
  std::thread workerThread_;
};