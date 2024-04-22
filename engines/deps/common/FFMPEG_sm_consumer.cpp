#include "FFMPEG_sm_consumer.h"
#include "FFMPEG_sm_element.h"
#include "clock.h"
#include "notifier.h"
#include "FFMPEG_utils.h"

using namespace std::chrono_literals;

FFMPEGSharedMemoryConsumer::FFMPEGSharedMemoryConsumer()
:SharedMemoryConsumer()
{

}

FFMPEGSharedMemoryConsumer::~FFMPEGSharedMemoryConsumer()
{

}

bool FFMPEGSharedMemoryConsumer::init(const char *_id, int _msTimeout)
{
  bool ret = SharedMemoryConsumer::init(_id, _msTimeout);
  if(ret)
  {
    notifyInfo("SM client %s connected", ID_.c_str());
  }
  return ret;
}

bool FFMPEGSharedMemoryConsumer::deinit()
{
  bool ret = SharedMemoryConsumer::deinit();
  if(ret)
  {
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
  bool timeout = false;

  long long startTime = Clock::instance().elapsed();
  long long timeoutTime = startTime + (msTimeout_ * 1000000LL);
  
  while(!timeout)
  {
    if(SharedMemoryConsumer::read())
    {
      if( (lastMsgID_ == 0) || (msgID_ != lastMsgID_) )
      {
        lastMsgID_ = msgID_;

        FFMPEGSMElement *fe = (FFMPEGSMElement *) data_;

        ret = new AVFrameExt();
        ret->timeBase = fe->timebase;
        ret->fieldOrder = fe->fieldOrder;
        ret->mediaType = fe->mediaType;
        ret->streamIndex = fe->streamIndex;

        if( (fe->mediaType == AVMediaType::AVMEDIA_TYPE_VIDEO) || (fe->mediaType == AVMediaType::AVMEDIA_TYPE_AUDIO) )
        {
          AVFrame *avFrame = av_frame_alloc();
          if(avFrame)
          {
            avFrame->width = fe->width;
            avFrame->height = fe->height;
            avFrame->format = fe->format;
            avFrame->duration = fe->duration;
            unsigned char *avBuffer = (unsigned char *) (fe + 1);
            int dataOffset = 0;
            if(fe->mediaType == AVMediaType::AVMEDIA_TYPE_VIDEO)
            {
              av_image_fill_arrays(avFrame->data, avFrame->linesize, avBuffer, (AVPixelFormat) avFrame->format, avFrame->width, avFrame->height, 1);
            }
            else if(fe->mediaType == AVMediaType::AVMEDIA_TYPE_AUDIO)
            {
              avFrame->data[0] = avBuffer;
              avFrame->linesize[0] = fe->linesize[0];
            }
            ret->AVFrame = avFrame;
          }
        }
        else if(fe->mediaType == AVMEDIA_TYPE_DATA)
        {
          AVPacket *packet = av_packet_alloc();
          if(packet)
          {
            packet->size = fe->packetSize;
            unsigned char *dataBuffer = (unsigned char*) (fe + 1);
            packet->data = dataBuffer;
            ret->AVPacket = packet;
          }
        }
        break;
      }
    }

    std::this_thread::sleep_for(1ms);
    timeout = Clock::instance().elapsed() >= timeoutTime;
  }

  return ret;
}