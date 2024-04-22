#pragma once

#include <list>
#include <mutex>
#include <map>
#include <libavutil\rational.h>
#include "FFMPEG_sm_element.h"
#include "FFMPEG_sm_consumer.h"

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
  bool loadConfiguration(const char *_JsonConfig);

protected:
  std::string UID_;
  std::string srcUID_;                                           // source
  bool abort_ = false;                                           // abort flag
  int width_ = 1920;                                             // default width
  int height_ = 1080;                                            // default height
  AVRational frameRate_ = { 25, 1 };                             // default framerate
  AVPixelFormat pixelFormat_ = AVPixelFormat::AV_PIX_FMT_RGB24;  // default pixel format
  AVFieldOrder fieldOrder_ = AVFieldOrder::AV_FIELD_PROGRESSIVE; // default scan mode
  bool previewWindow_ = false;                                   // show preview window
  FFMPEGSharedMemoryConsumer smc_;                               // shared memory surfaces
  std::map<std::string, std::string> extraParams_;               // extra params (timeout='5')
  int timeoutOpen_ = 5;                                          // in seconds
};
