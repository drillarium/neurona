#pragma once

#include <list>
#include <mutex>
#include <map>
#include <vector>
#include "FFMPEG_sm_element.h"

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

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
  bool loadConfiguration(const char *_JsonConfig);
  void workerThreadFunc();

protected:
  std::string UID_;                                              // uid
  bool abort_ = false;                                           // abort flag
  int width_ = 1920;                                             // default width
  int height_ = 1080;                                            // default height
  AVRational frameRate_ = { 25, 1 };                             // default framerate
  AVPixelFormat pixelFormat_ = AVPixelFormat::AV_PIX_FMT_RGB24;  // default pixel format
  AVFieldOrder fieldOrder_ = AVFieldOrder::AV_FIELD_PROGRESSIVE; // default scan mode
  bool previewWindow_ = false;                                   // show preview window
  std::string url_;                                              // url to open
  std::map<std::string, std::string> extraParams_;               // extra params (timeout='5')
  int maxBufferSize_ = 1;                                        // max buffer size
  int timeoutOpen_ = 5;                                          // in seconds
  bool openReader_ = true;                                       // open reader flag
  AVFormatContext *formatCtx_ = nullptr;                         // reader open vars
  std::vector<AVCodecContext *> codecCtxs_;                       // reader decode vars
}; 
