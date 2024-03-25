#include <string>
#include <thread>
#include <chrono>
#include "engine.h"
#include "notifier.h"
#include "sync_clock.h"
#include "SDLRenderer.h"
#include "FFMPEG_sm_consumer.h"
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
  writer.String("FFMPEGOutputEngine");

  writer.Key("type");
  writer.String("output");

  writer.Key("version");
  writer.String(APP_VERSION_STR);

  writer.EndObject(); // }

  return buffer.GetString();
}

// createEngine
void * createEngine()
{
  return new FFMPEGOutputEngine();
}

// destroyEngine
bool destroyEngine(void **_engine)
{
  if(!*_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(*_engine);
  delete engine;
  *_engine = nullptr;

  return true;
}

// abortEngine
bool abortEngine(void *_engine)
{
  if(!_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(_engine);
  return engine->abort();
}

// putCommand
bool putCommand(void *_engine, const char *_JsonCommand)
{
  if(!_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(_engine);
  return engine->putCommand(_JsonCommand);
}

// runEngine
bool runEngine(void *_engine, const char *_JsonConfig)
{
  if(!_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(_engine);
  return engine->run(_JsonConfig);
}

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

// FFMPEGOutputEngine
FFMPEGOutputEngine::FFMPEGOutputEngine()
{

}

// FFMPEGOutputEngine
FFMPEGOutputEngine::~FFMPEGOutputEngine()
{

}

// abort
bool FFMPEGOutputEngine::abort()
{
  abort_ = true;
  return true;
}

// putCommand
bool FFMPEGOutputEngine::putCommand(const char *_JsonCommand)
{
  return true;
}

// run. Main thread generates black and silence while stream does not generate AVsamples
bool FFMPEGOutputEngine::run(const char *_JsonConfig)
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

  UID_ = "TEST_OUTPUT";

  int64_t frameCount = 0;
  SyncClock clock;

  // renderer
  SDLRenderer renderer;
  renderer.init(UID_.c_str());

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

  // worker thread
  if(workerThread.joinable())
  {
    workerThread.join();
  }

  return true;
}

void FFMPEGOutputEngine::workerThreadFunc()
{
  FFMPEGSharedMemoryConsumer smc;

  srcUID_ = "TEST_INPUT";

  while(!abort_)
  {
    if(!smc.opened())
    {
      smc.init(srcUID_.c_str());
    }
    if(smc.opened())
    {
      AVFrameExt *frame = smc.read();
      if(frame)
      {
        // push frame
        push(frame);
      }
      else
      {
        std::this_thread::sleep_for(1ms);
      }
    }
    else
    {
      std::this_thread::sleep_for(1ms);
    }
  }

  smc.deinit();
}

bool FFMPEGOutputEngine::push(AVFrameExt *_frame)
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

AVFrameExt * FFMPEGOutputEngine::pop(long long timeout)
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
