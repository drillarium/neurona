#pragma once

#include <list>
#include <mutex>
#include <libavutil\rational.h>
#include "FFMPEG_sm_element.h"

// CefInputEngine
class CefInputEngine
{
public:
  CefInputEngine();
  virtual ~CefInputEngine();
  bool abort();
  bool putCommand(const char *_JsonCommand);
  bool run(const char *_JsonConfig);
  bool push(AVFrameExt *_frame);

protected:
  AVFrameExt * begin();
  void workerThreadFunc();

protected:
  std::string UID_;
  bool abort_ = false;                   // abort flag
  std::list<AVFrameExt*> frameBuffer_;   // frame buffer
  std::mutex frameBufferMutex_;          // mutex
  int maxBufferSize_ = 1;                // max buffer size
};
