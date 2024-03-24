#pragma once

#include <list>
#include <mutex>
#include <libavutil\rational.h>
#include "FFMPEG_sm_element.h"

// SDLMixerEngine
class SDLMixerEngine
{
public:
  SDLMixerEngine();
  virtual ~SDLMixerEngine();
  bool abort();
  bool putCommand(const char *_JsonCommand);
  bool run(const char *_JsonConfig);

protected:
  bool push(int _index, AVFrameExt *_frame);
  AVFrameExt * pop(int _index, long long timeout = -1);
  void workerThreadFunc(int _index);

protected:
  bool abort_ = false;                   // abort flag
  bool configure_ = false;
  std::string nextConfiguration_;
  std::string currentConfiguration_;
  std::vector<bool> configureProducer_;
  std::vector<std::list<AVFrameExt *>> frameBuffer_;  // frame buffer
  std::vector<std::mutex> frameBufferMutex_;          // mutex
  int maxBufferSize_ = 2;                             // max buffer size
  int timeoutOpen_ = 5;                               // in seconds
};
