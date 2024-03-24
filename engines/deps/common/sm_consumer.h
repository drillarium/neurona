#pragma once

#include <string>
#include "shmhelper.h"

#define DEFAULT_SMELEM_SIZE (8 * 1024 * 1024)
#define DEFAULT_SM_SIZE 4

// SharedMemoryConsumer
class SharedMemoryConsumer
{
public:
  SharedMemoryConsumer();
  virtual ~SharedMemoryConsumer();

  virtual bool init(const char *_id);
  virtual bool deinit();
  bool read(unsigned char **_data);

protected:
  std::string ID_;
  ShMHandle smHandle_ = {};
  long long lastMessageID_ = -1;
};