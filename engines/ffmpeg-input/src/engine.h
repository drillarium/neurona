#pragma once

#include <list>
#include <mutex>
#include <libavutil\rational.h>
#include "FFMPEG_sm_element.h"

// FFMPEGInputEngine
class FFMPEGInputEngine
{
public:
  FFMPEGInputEngine();
  virtual ~FFMPEGInputEngine();
  bool abort();
  bool putCommand(const char *_JsonCommand);
  bool run(const char *_JsonConfig);

protected:
  bool push(AVFrameExt* _frame);
  AVFrameExt* pop(long long timeout = 20000000LL);
  void workerThreadFunc();

protected:
  std::string UID_;
  bool abort_ = false;                   // abort flag
  std::list<AVFrameExt *> frameBuffer_;  // frame buffer
  std::mutex frameBufferMutex_;          // mutex
  int maxBufferSize_ = 2;                // max buffer size
  int timeoutOpen_ = 5;                  // in seconds
};
