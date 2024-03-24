#pragma once

#include "sm_consumer.h"
#include "FFMPEG_sm_element.h"

class FFMPEGSharedMemoryConsumer : public SharedMemoryConsumer
{
public:
  FFMPEGSharedMemoryConsumer();
  virtual ~FFMPEGSharedMemoryConsumer();
  bool init(const char *_id);
  bool deinit();
  AVFrameExt * read();
  bool opened() { return opened_; }

protected:
  long long lastAVFrameID_ = -1;
  bool opened_ = false;
  long long repeatStartTime_ = -1;
  long long repeatTimeOut = 2000000000LL;
};
