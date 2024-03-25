#pragma once

#include <list>
#include <mutex>
#include <libavutil\rational.h>
#include "FFMPEG_sm_element.h"

// SDLRendererEngine
class SDLRendererEngine
{
public:
  SDLRendererEngine();
  virtual ~SDLRendererEngine();
  bool abort();
  bool putCommand(const char *_JsonCommand);
  bool run(const char *_JsonConfig);

protected:
  std::string UID_;
  bool abort_ = false;                   // abort flag
};
