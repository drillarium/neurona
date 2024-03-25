#include <string>
#include <thread>
#include <chrono>
#include "engine.h"
#include "notifier.h"
#include "sync_clock.h"
#include "SDLRenderer.h"
#include "FFMPEG_sm_producer.h"
#include "FFMPEG_utils.h"

using namespace std::chrono_literals;

const char APP_VERSION_STR[] = "0.0.1";

// getJsonSchema
std::string getJsonSchema()
{
  return "{}";
}

// getVersion
std::string getVersion()
{
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
  writer.StartObject();  // {

  writer.Key("engine");
  writer.String("FFMPEGInputEngine");

  writer.Key("type");
  writer.String("input");

  writer.Key("version");
  writer.String(APP_VERSION_STR);

  writer.EndObject(); // }

  return buffer.GetString();
}

// createEngine
void * createEngine()
{
  return new FFMPEGInputEngine();
}

// destroyEngine
bool destroyEngine(void **_engine)
{
  if(!*_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(*_engine);
  delete engine;
  *_engine = nullptr;

  return true;
}

// abortEngine
bool abortEngine(void *_engine)
{
  if(!_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(_engine);
  return engine->abort();
}

// putCommand
bool putCommand(void *_engine, const char *_JsonCommand)
{
  if(!_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(_engine);
  return engine->putCommand(_JsonCommand);
}

// runEngine
bool runEngine(void *_engine, const char *_JsonConfig)
{
  if(!_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(_engine);
  return engine->run(_JsonConfig);
}

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

// FFMPEGInputEngine
FFMPEGInputEngine::FFMPEGInputEngine()
{

}

// FFMPEGInputEngine
FFMPEGInputEngine::~FFMPEGInputEngine()
{

}

// abort
bool FFMPEGInputEngine::abort()
{
  abort_ = true;
  return true;
}

// putCommand
bool FFMPEGInputEngine::putCommand(const char *_JsonCommand)
{
  return true;
}

// run. Main thread generates black and silence while stream does not generate AVsamples
bool FFMPEGInputEngine::run(const char *_JsonConfig)
{
  // command thread
  std::thread workerThread = std::thread([&] {
    workerThreadFunc();
  });

  // video
  int width = 640;
  int height = 480;
  AVRational videoTimeBase = { 1, 25 };
  AVCodecID videoCodecID = AV_CODEC_ID_RAWVIDEO;
  AVPixelFormat pixFmt = AV_PIX_FMT_RGB24;
  AVFieldOrder fieldOrder = AV_FIELD_PROGRESSIVE;

  // audio
  // int audioSampleRate = 44100;
  // AVCodecID audioCodecID = AV_CODEC_ID_PCM_S16LE;
  // int channels = 2;
  // AVSampleFormat sampleFmt = AV_SAMPLE_FMT_S16;
  // int audioSamplesPerFrame = (int) (audioSampleRate / (double) (videoTimeBase.den / videoTimeBase.num));
  // AVRational audioTimeBase = { 1, audioSampleRate };

  // AVFrame
  AVFrame *videoFrame = av_frame_alloc();
  if(!videoFrame)
  {
    notifyError("Could not allocate frame");
    return false;
  }

  videoFrame->width = width;
  videoFrame->height = height;
  videoFrame->format = pixFmt;

  // AVFrame *audioFrame = av_frame_alloc();
  // if(!audioFrame)
  // {
    // av_frame_free(&videoFrame);
    // notifyError("Could not allocate frame");
    // return false;
  // }

  int videoBufferSize = av_image_get_buffer_size(pixFmt, width, height, 1);
  uint8_t *videoBuffer = (uint8_t *) av_malloc(videoBufferSize);
  av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, pixFmt, width, height, 1);

  // int audioBufferSize = av_samples_get_buffer_size(nullptr, channels, audioSamplesPerFrame, sampleFmt, 0);
  // uint8_t *audioBuffer = (uint8_t *) av_malloc(audioBufferSize);
  // av_samples_fill_arrays(audioFrame->data, audioFrame->linesize, audioBuffer, channels, audioSamplesPerFrame, sampleFmt, 0);

  UID_ = "TEST_INPUT";
  std::string url = "udp://127.0.0.1:8090";

  int64_t frameCount = 0;
  SyncClock clock;

  // renderer
  SDLRenderer renderer;
  std::string title = UID_ + " " + url.c_str();
  renderer.init(title.c_str());  

  // sm protocol
  FFMPEGSharedMemoryProducer sm;
  sm.init(UID_.c_str());

  while(!abort_)
  {
    // draw video
    drawBackground(videoBuffer, width, height, videoFrame->linesize[0], pixFmt);
    drawLine(videoBuffer, width, height, videoFrame->linesize[0], pixFmt, frameCount, videoTimeBase);

    videoFrame->pts = frameCount;
    videoFrame->duration = av_rescale_q(1, videoTimeBase, videoTimeBase);

    // audioFrame->pts = frameCount * audioTimeBase.num;
    // audioFrame->duration = av_rescale_q(1024, audioTimeBase, audioTimeBase);

    frameCount++;

    AVFrameExt frameExt = { videoTimeBase, videoFrame, fieldOrder };

    /* buffer consumer */
    AVFrameExt *frameExtInput = pop();
    if(frameExtInput)
    {
      frameExt.copy(frameExtInput);
    }

    /* sm producer */
    sm.write(&frameExt);

    renderer.render(frameExt.AVFrame);

    // sync
    long long frd = frameDuration(&frameExt);
    clock.sync(frd);

    if(frameExtInput)
    {
      free_AVFrameExt(&frameExtInput);
    }
  }

  renderer.cleanUp();

  av_frame_free(&videoFrame);
  av_free(videoBuffer);
  // av_frame_free(&audioFrame);
  // av_free(audioBuffer);

  sm.deinit();

  // worker thread
  if(workerThread.joinable())
  {
    workerThread.join();
  }

  return true;
}

void FFMPEGInputEngine::workerThreadFunc()
{
  // load Json configuration
  std::string inputFile = "udp://127.0.0.1:8090";
  bool open = true;
  
  // Allocate frame and packet
  AVFormatContext *formatCtx = nullptr;
  AVCodecContext *codecCtx = nullptr;
  AVFrame *frame = av_frame_alloc();
  AVPacket *packet = av_packet_alloc();
  int videoStreamIndex = -1;

  while(!abort_)
  {
    if(open)
    {
      // Open input file and allocate format context
      AVDictionary *dict = nullptr;
      std::string timeout = std::to_string(timeoutOpen_ * 1000000);
      av_dict_set(&dict, "timeout", timeout.c_str(), 0);      
      if(avformat_open_input(&formatCtx, inputFile.c_str(), nullptr, &dict) < 0)
      {
        av_dict_free(&dict);
        notifyError("Could not open input file: %s", inputFile.c_str());
      }
      else
      {
        // Retrieve stream information
        if(avformat_find_stream_info(formatCtx, nullptr) < 0)
        {
          av_dict_free(&dict);
          avformat_close_input(&formatCtx);
          notifyError("Could not find stream information: %s", inputFile.c_str());
        }
        else
        {
          // Find video stream      
          for(unsigned int i = 0; i < formatCtx->nb_streams; i++)
          {
            if(formatCtx->streams[i]->codecpar->codec_type == AVMEDIA_TYPE_VIDEO)
            {
              videoStreamIndex = i;
              break;
            }
          }

          if(videoStreamIndex == -1)
          {
            av_dict_free(&dict);
            avformat_close_input(&formatCtx);
            notifyError("Could not find video stream: %s", inputFile.c_str());
          }
          else
          {
            // Get codec parameters and codec context
            AVCodecParameters *codecPar = formatCtx->streams[videoStreamIndex]->codecpar;
            const AVCodec *codec = avcodec_find_decoder(codecPar->codec_id);
            codecCtx = avcodec_alloc_context3(codec);
            avcodec_parameters_to_context(codecCtx, codecPar);

            // Open codec
            if(avcodec_open2(codecCtx, codec, nullptr) < 0)
            {
              av_dict_free(&dict);
              avcodec_free_context(&codecCtx);
              avformat_close_input(&formatCtx);
              notifyError("Could not open codec: %s", inputFile.c_str());
            }
            else
            {
              av_dict_free(&dict);
              open = false;
              notifyInfo("Stream opened: %s", inputFile.c_str());
            }
          }
        }
      }
    }

    if(!open)
    {
      while(av_read_frame(formatCtx, packet) >= 0 && !abort_)
      {
        if(packet->stream_index == videoStreamIndex)
        {
          // Decode video frame
          int ret = avcodec_send_packet(codecCtx, packet);
          if(ret < 0)
          {
            notifyError("Error sending packet for decoding: %s", inputFile.c_str());
            break;
          }

          while(ret >= 0)
          {
            ret = avcodec_receive_frame(codecCtx, frame);
            if(ret == AVERROR(EAGAIN) || ret == AVERROR_EOF)
            {
              break;
            }
            else if(ret < 0)
            {
              notifyError("Error during decoding: %s", inputFile.c_str());
              break;
            }

            // push frame
            AVFrameExt *frameExt = new AVFrameExt;
            frameExt->AVFrame = frameDeepClone(frame);
            frameExt->timeBase = formatCtx->streams[videoStreamIndex]->time_base;
            frameExt->fieldOrder = formatCtx->streams[videoStreamIndex]->codecpar->field_order;
            push(frameExt);

            // Print basic frame properties
            /* std::cout << "Frame " << codecCtx->frame_num
              << " (type=" << av_get_picture_type_char(frame->pict_type)
              // << ", size=" << frame->pkt_size
              << " bytes) pts " << frame->pts
              << " key_frame " << (bool)((frame->flags & AV_FRAME_FLAG_KEY) == AV_FRAME_FLAG_KEY)
              << std::endl; */
          }
        }
        av_packet_unref(packet);
      }
      avcodec_free_context(&codecCtx);
      avformat_close_input(&formatCtx);
      open = true;     
      notifyWarning("Stream closed: %s", inputFile.c_str());
    }    
  }

  av_packet_free(&packet);
  av_frame_free(&frame);
}

bool FFMPEGInputEngine::push(AVFrameExt *_frame)
{
  std::lock_guard<std::mutex> lock(frameBufferMutex_);
  frameBuffer_.push_back(_frame);
  if(frameBuffer_.size() > maxBufferSize_)
  {
    AVFrameExt *frame = *frameBuffer_.begin();
    free_AVFrameExt(&frame);
    frameBuffer_.pop_front();
  }
  return true;
}

AVFrameExt * FFMPEGInputEngine::pop(long long timeout)
{
  long long elapsed = Clock::instance().elapsed() + timeout;
  long long remaining = timeout;
  AVFrameExt *frame = nullptr;
  while(!frame && remaining >= 0)
  {
    {
    std::lock_guard<std::mutex> lock(frameBufferMutex_);
    if(frameBuffer_.size() > 0)
    {
      frame = *frameBuffer_.begin();
      frameBuffer_.pop_front();
    }
    }
    if(!frame)
    {
      remaining = elapsed - Clock::instance().elapsed();
      if(remaining >= 0)
      {
        std::this_thread::sleep_for(1ms);
      }
    }
  }

  return frame;
}
