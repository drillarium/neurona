#pragma once

extern "C" {
#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <libavcodec/defs.h>
#include <libavcodec/packet.h>
}

#include <sstream>
#include <iostream>

__inline void drawBackground(uint8_t *_buffer, int _width, int _height, int _lineSize, AVPixelFormat _pixFmt, uint32_t _color = 0x00000000)
{
  int bitsPerPixel = av_get_bits_per_pixel(av_pix_fmt_desc_get(_pixFmt));
  int bytesPerPixel = (bitsPerPixel + 7) / 8;

  for(int y = 0; y < _height; ++y)
  {
    for(int x = 0; x < _width * bytesPerPixel; x += bytesPerPixel)
    {
      _buffer[y * _lineSize + x] = (uint8_t) (_color & 0xff);
      _buffer[y * _lineSize + x + 1] = (uint8_t) ((_color & 0xff00) >> 8);
      _buffer[y * _lineSize + x + 2] = (uint8_t) ((_color & 0xff0000) >> 16);
    }
  }
}

__inline void silenceAudio(uint8_t* _buffer, int _size)
{
  memset(_buffer, 0, _size);
}

__inline void drawLine(uint8_t *_buffer, int _x, int _y, int _width, int _height, int _lineSize, AVPixelFormat _pixFmt, int64_t _frameNum, AVRational _timeBase, int _depth = 2, int _speed = 5, uint32_t _color = 0x00ffffff)
{
  int bitsPerPixel = av_get_bits_per_pixel(av_pix_fmt_desc_get(_pixFmt));
  int bytesPerPixel = (bitsPerPixel + 7) / 8;

  double fps = (double)_timeBase.den / _timeBase.num;
  int fpw = (int) (fps * _speed);
  int fnum = (int) (_frameNum % fpw);
  int linePosition = (_width * fnum) / fpw;

  // Draw a vertical white line
  for(int y = _y; y < _y + _height; ++y)
  {
    for(int i = 0; i < _depth; i++)
    {
      _buffer[y * _lineSize + _x * bytesPerPixel + (linePosition + (i + 1)) * bytesPerPixel] = (uint8_t) (_color & 0xff);
      _buffer[y * _lineSize + _x * bytesPerPixel + (linePosition + (i + 1)) * bytesPerPixel + 1] = (uint8_t) ((_color & 0xff00) >> 8);
      _buffer[y * _lineSize + _x * bytesPerPixel + (linePosition + (i + 1)) * bytesPerPixel + 2] = (uint8_t) ((_color & 0xff0000) >> 16);
    }
  }
}

__inline void drawLine(uint8_t *_buffer, int _width, int _height, int _lineSize, AVPixelFormat _pixFmt, int64_t _frameNum, AVRational _timeBase, int _depth = 2, int _speed = 5, uint32_t _color = 0x00ffffff)
{
  drawLine(_buffer, 0, 0, _width, _height, _lineSize, _pixFmt, _frameNum, _timeBase, _depth, _speed, _color);
}

__inline AVFrame * frameConvert(AVFrame *_frame, int _width = -1, int _height = -1, AVPixelFormat _format = AV_PIX_FMT_RGB24)
{
  int width = _width < 0? _frame->width : _width;
  int height = _height < 0? _frame->height : _height;

  // create
  AVFrame *frame = av_frame_alloc();
  uint8_t *buffer = (uint8_t *) av_malloc(av_image_get_buffer_size(_format, width, height, 1));
  av_image_fill_arrays(frame->data, frame->linesize, buffer, _format, width, height, 1);

  struct SwsContext *swsContext = sws_getContext(_frame->width, _frame->height, (AVPixelFormat)_frame->format, width, height, _format, SWS_BICUBIC, nullptr, nullptr, nullptr);

  // scale
  sws_scale(swsContext, _frame->data, _frame->linesize, 0, _frame->height, frame->data, frame->linesize);

  // Free the SwsContext
  sws_freeContext(swsContext);

  frame->width = width;
  frame->height = height;

  return frame;
}

__inline void frameFree(AVFrame *_frame)
{
  av_freep(&_frame->data[0]);
  av_frame_free(&_frame);
}

__inline AVFrame * frameDeepClone(AVFrame *_frame)
{
  AVFrame *copyFrame = av_frame_alloc();
  if(copyFrame)
  {
    copyFrame->format = _frame->format;
    copyFrame->width = _frame->width;
    copyFrame->height = _frame->height;
    copyFrame->ch_layout = _frame->ch_layout;
    copyFrame->nb_samples = _frame->nb_samples;
    av_frame_get_buffer(copyFrame, 32);
    av_frame_copy(copyFrame, _frame);
    av_frame_copy_props(copyFrame, _frame);
  }

  return copyFrame;
}

__inline AVPacket* packetDeepClone(AVPacket *_packet)
{
  AVPacket *copyPacket = av_packet_alloc();
  if(copyPacket)
  {
    // Copy packet data
    if(av_packet_ref(copyPacket, _packet) < 0)
    {
      av_packet_free(&copyPacket);
    }

    // Ensure the packet is deep-copied
    if(av_packet_make_writable(copyPacket) < 0)
    {
      av_packet_free(&copyPacket);
    }
  }

  return copyPacket;
}

__inline int getBitsPerPixel(AVPixelFormat _format)
{
  const AVPixFmtDescriptor* desc = av_pix_fmt_desc_get(_format);
  if (!desc)
  {
    std::cerr << "Error: Pixel format not found" << std::endl;
    return -1;
  }

  return av_get_bits_per_pixel(desc);
}

__inline AVRational parseFR(const char *_fr)
{
  std::istringstream iss(_fr);
  std::string numerator_str, denominator_str;

  // Split the string by '/'
  std::getline(iss, numerator_str, '/');
  std::getline(iss, denominator_str);

  // Convert strings to integers
  int numerator = std::stoi(numerator_str);
  int denominator = std::stoi(denominator_str);

  return { numerator, denominator };
}

__inline AVPixelFormat strig2format(const char *_format)
{
  if(!_stricmp(_format, "RGB24"))
  {
    return AV_PIX_FMT_RGB24;
  }
  if(!_stricmp(_format, "ARGB"))
  {
    return AV_PIX_FMT_ARGB;
  }
  if(!_stricmp(_format, "ABGR"))
  {
    return AV_PIX_FMT_ABGR;
  }

  return AV_PIX_FMT_RGB24;
}

__inline AVFieldOrder strig2fieldorder(const char *_field)
{
  if(!_stricmp(_field, "PROGRESSIVE"))
  {
    return AV_FIELD_PROGRESSIVE;
  }
  if(!_stricmp(_field, "FIELD_TT"))
  {
    return AV_FIELD_TT;
  }
  if(!_stricmp(_field, "FIELD_BB"))
  {
    return AV_FIELD_BB;
  }
  if(!_stricmp(_field, "FIELD_TB"))
  {
    return AV_FIELD_TB;
  }
  if(!_stricmp(_field, "FIELD_BT"))
  {
    return AV_FIELD_BT;
  }

  return AV_FIELD_PROGRESSIVE;
}
