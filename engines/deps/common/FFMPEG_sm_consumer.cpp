#include "FFMPEG_sm_consumer.h"
#include "FFMPEG_sm_element.h"
#include "clock.h"
#include "notifier.h"
#include "FFMPEG_utils.h"

FFMPEGSharedMemoryConsumer::FFMPEGSharedMemoryConsumer()
:SharedMemoryConsumer()
{

}

FFMPEGSharedMemoryConsumer::~FFMPEGSharedMemoryConsumer()
{

}

bool FFMPEGSharedMemoryConsumer::init(const char *_id)
{
  bool ret = SharedMemoryConsumer::init(_id);
  if(ret)
  {
    opened_ = true;
    notifyInfo("SM client %s connected", ID_.c_str());
  }
  return ret;
}

bool FFMPEGSharedMemoryConsumer::deinit()
{
  if(!opened_) return true;
  bool ret = SharedMemoryConsumer::deinit();
  if(ret)
  {
    opened_ = false;
    notifyInfo("SM client %s disconnected", ID_.c_str());
  }
  return ret;
}

extern "C" {
#include <libavutil/imgutils.h>
}

AVFrameExt * FFMPEGSharedMemoryConsumer::read()
{
  AVFrameExt *ret = nullptr;
  unsigned char *data = nullptr;
  if(SharedMemoryConsumer::read(&data))
  {
    // check last messageID
    if(lastMessageID_ == lastAVFrameID_)
    {
      if(repeatStartTime_ < 0)
      {
        repeatStartTime_ = Clock::instance().elapsed();
      }
      else
      {
        long long elapsed = Clock::instance().elapsed() - repeatStartTime_;
        if(elapsed >= repeatTimeOut)
        {
          deinit();
        }
      }
    }
    else
    {
      repeatStartTime_ = -1;
      lastAVFrameID_ = lastMessageID_;
 
      FFMPEGSMElement *fe = (FFMPEGSMElement *) data;

      AVFrame *videoFrame = av_frame_alloc();
      if(videoFrame)
      {
        videoFrame->width = fe->width;
        videoFrame->height = fe->height;
        videoFrame->format = fe->format;
        videoFrame->duration = fe->duration;
        const unsigned char *videoBuffer = (const unsigned char *) (fe + 1);
        av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, (AVPixelFormat) videoFrame->format, videoFrame->width, videoFrame->height, 32);      

        ret = new AVFrameExt();
        ret->timeBase = fe->timebase;
        ret->AVFrame = frameDeepClone(videoFrame);
        ret->fieldOrder = fe->fieldOrder;
      }
    }
  }

  return ret;
}