#include "FFMPEG_sm_producer.h"
#include "FFMPEG_sm_element.h"

FFMPEGSharedMemoryProducer::FFMPEGSharedMemoryProducer()
:SharedMemoryProducer()
{

}

FFMPEGSharedMemoryProducer::~FFMPEGSharedMemoryProducer()
{

}

bool FFMPEGSharedMemoryProducer::init(const char *_id, int _size, int _count)
{
  bool ret = SharedMemoryProducer::init(_id, _size, _count);
  if(ret)
  {
    data_ = new unsigned char[smHandle_.rb->size];
  }
  return ret;
}

bool FFMPEGSharedMemoryProducer::deinit()
{
  bool ret = SharedMemoryProducer::deinit();
  if(data_)
  {
    delete[] data_;
  }
  return ret;
}

int getDivisorForPlane(enum AVPixelFormat pixelFormat, int planeIndex)
{
  switch (pixelFormat)
  {
    case AV_PIX_FMT_YUV420P:
      return (planeIndex == 0) ? 1 : 2;
    // Add cases for other pixel formats as needed
    default:
    return 1; // Default to no division
  }
}

bool FFMPEGSharedMemoryProducer::write(AVFrameExt *_frame)
{
  int dataSize = 0;
  FFMPEGSMElement sme;
  sme.init(_frame);
  memcpy(data_, &sme, sme.size);
  unsigned char *p = data_ + sme.size;
  dataSize = sme.size;

  if(_frame->AVFrame)
  {
    for(int i = 0; i < AV_NUM_DATA_POINTERS; i++)
    {
      int size = _frame->AVFrame->linesize[i];
      if(_frame->mediaType == AVMediaType::AVMEDIA_TYPE_VIDEO)
      {
        size = (_frame->AVFrame->linesize[i] * _frame->AVFrame->height) / getDivisorForPlane((AVPixelFormat) _frame->AVFrame->format, i);
      }
      memcpy(p, _frame->AVFrame->data[i], size);
      p += size;
      dataSize += size;
    }
  }
  if(_frame->AVPacket)
  {
    int size = _frame->AVPacket->size;
    memcpy(p, _frame->AVPacket->data, size);
    p += size;
    dataSize += size;
  }

  return SharedMemoryProducer::write(data_, dataSize);
}
