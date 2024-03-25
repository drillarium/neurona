#pragma once

#include <list>
#include <mutex>
#include <libavutil\rational.h>
#include "FFMPEG_sm_element.h"

// FFMPEGOutputEngine
class FFMPEGOutputEngine
{
public:
  FFMPEGOutputEngine();
  virtual ~FFMPEGOutputEngine();
  bool abort();
  bool putCommand(const char *_JsonCommand);
  bool run(const char *_JsonConfig);

protected:
  bool push(AVFrameExt *_frame);
  AVFrameExt * pop(long long timeout = 20000000LL);
  void workerThreadFunc();

protected:
  std::string UID_;
  std::string srcUID_;
  bool abort_ = false;                   // abort flag
  std::list<AVFrameExt *> frameBuffer_;  // frame buffer
  std::mutex frameBufferMutex_;          // mutex
  int maxBufferSize_ = 2;                // max buffer size
  int timeoutOpen_ = 5;                  // in seconds
};
