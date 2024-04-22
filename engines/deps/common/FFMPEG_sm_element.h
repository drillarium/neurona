#pragma once

extern "C" {
#include <libavutil/frame.h>
#include <libavcodec/defs.h>
#include <libavcodec/packet.h>
}

struct AVFrameExt
{
  AVRational timeBase = {1, 25};  
  AVFieldOrder fieldOrder = AVFieldOrder::AV_FIELD_PROGRESSIVE;
  AVMediaType mediaType = AVMediaType::AVMEDIA_TYPE_VIDEO;
  int streamIndex = -1;
  AVFrame *AVFrame = nullptr;
  AVPacket *AVPacket = nullptr;
  void copy(AVFrameExt *_copy)
  {
    timeBase = _copy->timeBase;    
    fieldOrder = _copy->fieldOrder;
    mediaType = _copy->mediaType;
    streamIndex = _copy->streamIndex;
    AVFrame = _copy->AVFrame;
    AVPacket = _copy->AVPacket;
  }
};

__inline void free_AVFrameExt(AVFrameExt **_AVFrameExt)
{
  AVFrame *frame = (*_AVFrameExt)->AVFrame;
  av_frame_free(&frame);
  AVPacket *packet = (*_AVFrameExt)->AVPacket;
  av_packet_free(&packet);
  delete (*_AVFrameExt);
  *_AVFrameExt = nullptr;
}

__inline long long frameDuration(AVFrameExt *_frame)
{
  if(!_frame->AVFrame) return -1;
  int numFields = _frame->fieldOrder <= AVFieldOrder::AV_FIELD_PROGRESSIVE ? 1 : 2;
  return (long long) ((_frame->AVFrame->duration * (_frame->timeBase.num * 10000000LL) / _frame->timeBase.den) * numFields);
}

struct SMElement
{
  int size;                           // sizeof struct
  int type;                           // type of the object (case we need to share different objects
  int version;                        // version of the object
};

// FFMPEGSMElement: Object shared between sm producer / consumer
struct FFMPEGSMElement : public SMElement
{
  AVRational timebase = {0, 1};
  AVFieldOrder fieldOrder = AVFieldOrder::AV_FIELD_UNKNOWN;
  AVMediaType mediaType = AVMediaType::AVMEDIA_TYPE_VIDEO;
  int streamIndex = -1;
  int format = -1;
  int width = 0;
  int height = 0;
  long long duration = 0;
  int linesize[AV_NUM_DATA_POINTERS] = { 0 };
  int packetSize = 0;
  FFMPEGSMElement()
  {
    size = sizeof(FFMPEGSMElement);
    type = 1;
    version = 1;
  }
  void init(AVFrameExt *_frame)
  {
    timebase = _frame->timeBase;
    fieldOrder = _frame->fieldOrder;
    mediaType = _frame->mediaType;
    streamIndex = _frame->streamIndex;
    if(_frame->AVFrame)
    {
      format = _frame->AVFrame->format;
      width = _frame->AVFrame->width;
      height = _frame->AVFrame->height;
      duration = _frame->AVFrame->duration;
      memcpy(linesize, _frame->AVFrame->linesize, sizeof(int) * AV_NUM_DATA_POINTERS);
    }
    if(_frame->AVPacket)
    {
      packetSize = _frame->AVPacket->size;
    }
  }
};
