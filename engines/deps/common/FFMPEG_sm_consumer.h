#pragma once

#include "sm_consumer.h"
#include "FFMPEG_sm_element.h"

class FFMPEGSharedMemoryConsumer : public SharedMemoryConsumer
{
public:
  FFMPEGSharedMemoryConsumer();
  virtual ~FFMPEGSharedMemoryConsumer();
  bool init(const char *_id, int _msTimeout);
  bool deinit();
  AVFrameExt * read();

protected:
  unsigned long long lastMsgID_ = 0;
};
