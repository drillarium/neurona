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
  AVFrameExt * pop(int _index, long long timeout = 0);
  void workerThreadFunc(int _index);
  bool loadConfiguration(const char* _JsonConfig);

protected:
  std::string UID_;
  bool abort_ = false;                                // abort flag  
  std::vector<std::string> nextConfiguration_;
  std::mutex nextConfigurationMutex_;
  std::string currentConfiguration_;
  std::vector<bool> configureProducer_;
  std::vector<std::list<AVFrameExt *>> frameBuffer_;  // frame buffer per producer
  std::vector<std::mutex> frameBufferMutex_;          // mutex per producer
  int maxBufferSize_ = 2;                             // max buffer size
};
