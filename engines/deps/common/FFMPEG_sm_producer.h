#pragma once

#include "sm_producer.h"
#include "FFMPEG_sm_element.h"

class FFMPEGSharedMemoryProducer : public SharedMemoryProducer
{
public:
  FFMPEGSharedMemoryProducer();
  virtual ~FFMPEGSharedMemoryProducer();
  bool init(const char *_id, int _size = DEFAULT_SMELEM_SIZE, int _count = DEFAULT_SM_SIZE);
  bool deinit();
  bool write(AVFrameExt *_frame);

protected:
  unsigned char *data_ = nullptr;
};
