#pragma once

extern "C" {
#include <libavutil/frame.h>
#include <libavcodec/defs.h>
}

struct AVFrameExt
{
  AVRational timeBase;
  AVFrame *AVFrame;
  AVFieldOrder fieldOrder;
  void copy(AVFrameExt *_copy)
  {
    timeBase = _copy->timeBase;
    AVFrame = _copy->AVFrame;
    fieldOrder = _copy->fieldOrder;
  }
};

__inline void free_AVFrameExt(AVFrameExt **_AVFrameExt)
{
  AVFrame *frame = (*_AVFrameExt)->AVFrame;
  av_frame_free(&frame);
  delete (*_AVFrameExt);
  *_AVFrameExt = nullptr;
}

__inline long long frameDuration(AVFrameExt *_frame)
{
  int numFields = _frame->fieldOrder <= AV_FIELD_PROGRESSIVE ? 1 : 2;
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
  AVFieldOrder fieldOrder = AV_FIELD_UNKNOWN;
  int format = -1;
  int width = 0;
  int height = 0;
  long long duration = 0;
  int linesize[AV_NUM_DATA_POINTERS] = { 0 };
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
    format = _frame->AVFrame->format;
    width = _frame->AVFrame->width;
    height = _frame->AVFrame->height;
    duration = _frame->AVFrame->duration;
    memcpy(linesize, _frame->AVFrame->linesize, sizeof(int) * AV_NUM_DATA_POINTERS);
  }
};
