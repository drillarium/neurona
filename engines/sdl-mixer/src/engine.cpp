#include <string>
#include <thread>
#include <vector>
#include <chrono>
#include <iostream>
#include <ctime>
#include <sstream>
#include <iomanip> 
#include <algorithm>
#include "engine.h"
#include "notifier.h"
#include "sync_clock.h"
#include "SDLRenderer.h"
#include "FFMPEG_sm_producer.h"
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
  writer.String("SDLMixerEngine");

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
  return new SDLMixerEngine();
}

// destroyEngine
bool destroyEngine(void **_engine)
{
  if(!*_engine) return false;
  
  SDLMixerEngine *engine = static_cast<SDLMixerEngine *>(*_engine);
  delete engine;
  *_engine = nullptr;

  return true;
}

// abortEngine
bool abortEngine(void *_engine)
{
  if(!_engine) return false;
  
  SDLMixerEngine *engine = static_cast<SDLMixerEngine *>(_engine);
  return engine->abort();
}

// putCommand
bool putCommand(void *_engine, const char *_JsonCommand)
{
  if(!_engine) return false;
  
  SDLMixerEngine *engine = static_cast<SDLMixerEngine *>(_engine);
  return engine->putCommand(_JsonCommand);
}

// runEngine
bool runEngine(void *_engine, const char *_JsonConfig)
{
  if(!_engine) return false;
  
  SDLMixerEngine *engine = static_cast<SDLMixerEngine *>(_engine);
  return engine->run(_JsonConfig);
}

const char DEFAULT_CONFIG[] = "{\
\"window_layout\": {\
  \"width\": 1920,\
    \"height\" : 1080,\
    \"frame_rate\" : \"25/1\",\
    \"format\" : \"ARGB\",\
    \"components\" : [\
      {\
        \"type\": \"video\",\
        \"position\" : { \"x\": 0, \"y\" : 0 },\
        \"size\" : { \"width\": 960, \"height\" : 540 },\
        \"source\" : \"video_source_1.mp4\",\
        \"vumeter\":\"\
          {\
            \"show\": \"true\",\
          },\
        \"metadata\":\"\
          {\
          },\
      },\
      {\
        \"type\": \"graphic\",\
        \"position\" : { \"x\": 960, \"y\" : 0 },\
        \"size\" : { \"width\": 960, \"height\" : 540 },\
        \"source\" : \"graphic_image.png\",\
      },\
      {\
        \"type\": \"video\",\
        \"position\" : { \"x\": 0, \"y\" : 540 },\
        \"size\" : { \"width\": 960, \"height\" : 540 },\
        \"source\" : \"video_source_2.mp4\",\
      },\
      {\
        \"type\": \"graphic\",\
        \"position\" : { \"x\": 960, \"y\" : 540 },\
        \"size\" : { \"width\": 960, \"height\" : 540 },\
        \"source\" : \"graphic_image_2.png\",\
        \"format\" : \"png\"\
      }\
    ]\
  }\
}\
";

// SDLMixerEngine
SDLMixerEngine::SDLMixerEngine()
{

}

// SDLMixerEngine
SDLMixerEngine::~SDLMixerEngine()
{

}

// abort
bool SDLMixerEngine::abort()
{
  abort_ = true;
  return true;
}

// putCommand
bool SDLMixerEngine::putCommand(const char *_JsonCommand)
{
  return true;
}

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

// run. Main thread generates black and silence while stream does not generate AVsamples
bool SDLMixerEngine::run(const char *_JsonConfig)
{
  // Initialize SDL
  if(SDL_Init(SDL_INIT_VIDEO) < 0)
  {
    notifyError("SDL could not initialize! SDL_Error: %s", SDL_GetError());
    return false;
  }

  // Fonts
  if(TTF_Init() == -1)
  {
    notifyError("SDL_ttf initialization failed: %s", TTF_GetError());
    SDL_Quit();
    return false;
  }

  // surfaces
  int width = 1920;
  int height = 1080;
  AVRational videoTimeBase = { 1, 25 };
  AVFieldOrder fieldOrder = AV_FIELD_PROGRESSIVE;
  AVPixelFormat pixFmt = AV_PIX_FMT_RGB24;
  SDL_Surface *surface = nullptr;
  AVFrame *videoFrame = nullptr;
  int videoBufferSize = 0;
  uint8_t *videoBuffer = NULL;

  int64_t frameCount = 0;
  SyncClock clock;

  UID_ = "MIXER";

  // renderer
  SDLRenderer renderer;
  renderer.init(UID_.c_str());

  // sm protocol
  FFMPEGSharedMemoryProducer sm;
  sm.init(UID_.c_str());

  // producer threads
  int numInputs = 4;
  std::vector<std::thread> producerThread;

  // FOR TESTING
  nextConfiguration_ = DEFAULT_CONFIG;
  configure_ = true;

  while(!abort_)
  {
    if(configure_)
    {
      // TODO: read parameters
      width;
      height;
      videoTimeBase;
      numInputs;

      // FFMPEG
      if(videoFrame)
      {
        av_frame_free(&videoFrame);
      }
      videoFrame = av_frame_alloc();
      videoFrame->width = width;
      videoFrame->height = height;
      videoFrame->format = pixFmt;
      videoBufferSize = av_image_get_buffer_size(pixFmt, width, height, 1);
      if(videoBuffer)
      {
        av_free(videoBuffer);
      }
      videoBuffer = (uint8_t *) av_malloc(videoBufferSize);
      av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, pixFmt, width, height, 1);

      // Create surface
      if(surface)
      {
        SDL_FreeSurface(surface);
      }
      surface = SDL_CreateRGBSurfaceFrom(videoFrame->data[0], videoFrame->width, videoFrame->height, 24, videoFrame->linesize[0], 0, 0, 0, 0);

      // threads
      std::vector<std::mutex> list(std::max(producerThread.size(), (size_t) numInputs));
      frameBufferMutex_.swap(list);
      for(size_t i = producerThread.size(); i < numInputs; i++)
      {
        configureProducer_.push_back(true);
        frameBuffer_.push_back(std::list<AVFrameExt *>());        
        producerThread.push_back(std::thread([&, i] {
          workerThreadFunc((int) i);
        }));       
      }
      // 
      for(size_t i = 0; i < producerThread.size(); i++)
      {
        configureProducer_[i] = true;
      }

      // already configured
      currentConfiguration_ = nextConfiguration_;
      nextConfiguration_.clear();
      configure_ = false;
    }

    // clear surface

    //
    int w = 1920 >> 1;
    int h = 1080 >> 1;

    // check inputs
    for(int i = 0; i < numInputs; i++)
    {
      AVFrameExt *frameExtInput = pop(i);
      if(frameExtInput)
      {        
        AVFrame *frame = frameConvert(frameExtInput->AVFrame, w, h, AV_PIX_FMT_RGB24);

        // compose 
        // SDL_Surface *inputSurface = SDL_CreateRGBSurface(0, frame->width, frame->height, 24, 0, 0, 0, 0);

        // uint32_t *pixels = static_cast<uint32_t *>(inputSurface->pixels);
        // memcpy(pixels, frame->data[0], frame->linesize[0] * frame->height);
        SDL_Surface *inputSurface = SDL_CreateRGBSurfaceFrom(frame->data[0], frame->width, frame->height, 24, frame->linesize[0] , 0, 0, 0, 0);

        // Set the position where surface2 will be drawn on surface1
        int x = 0; if(i==1 || i==3) x = w;
        int y = 0; if(i==2 || i==3) y = h;

        // Blit surface2 onto surface1 at the specified position
        SDL_Rect srcRect = { 0, 0, inputSurface->w, inputSurface->h };
        SDL_Rect destRect = { x, y, inputSurface->w, inputSurface->h };
        SDL_BlitSurface(inputSurface, &srcRect, surface, &destRect);

        // release
        SDL_FreeSurface(inputSurface);

        // release
        frameFree(frame);

        // release
        free_AVFrameExt(&frameExtInput);
      }
    }

    videoFrame->pts = frameCount;
    videoFrame->duration = av_rescale_q(1, videoTimeBase, videoTimeBase);
    frameCount++;

    AVFrameExt frameExt = { videoTimeBase, videoFrame, fieldOrder };

    // render
    renderer.render(frameExt.AVFrame);

    // sync
    long long frd = frameDuration(&frameExt);
    clock.sync(frd);
  }

  renderer.cleanUp();
  sm.deinit();

  av_frame_free(&videoFrame);
  av_free(videoBuffer);

  SDL_FreeSurface(surface);
  TTF_Quit();
  SDL_Quit();

  return true;
}

void SDLMixerEngine::workerThreadFunc(int _index)
{
  FFMPEGSharedMemoryConsumer smc;

  while(!abort_)
  {
    if(configureProducer_[_index])
    {
      // deinit previous one
      smc.deinit();

      // open 
      smc.init("TEST_INPUT");

      // configured
      configureProducer_[_index] = false;
    }

    if(smc.opened())
    {
      AVFrameExt *frame = smc.read();
      if(frame)
      {
        // push frame
        push(_index, frame);
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
}

bool SDLMixerEngine::push(int _index, AVFrameExt *_frame)
{
  std::lock_guard<std::mutex> lock(frameBufferMutex_[_index]);
  frameBuffer_[_index].push_back(_frame);
  if(frameBuffer_[_index].size() > maxBufferSize_)
  {
    AVFrameExt *frame = *frameBuffer_[_index].begin();
    free_AVFrameExt(&frame);
    frameBuffer_[_index].pop_front();
  }
  return true;
}

AVFrameExt * SDLMixerEngine::pop(int _index, long long timeout)
{
  long long elapsed = Clock::instance().elapsed() + timeout;
  long long remaining = timeout;
  AVFrameExt *frame = nullptr;
  do
  {
    {
    std::lock_guard<std::mutex> lock(frameBufferMutex_[_index]);
    if(frameBuffer_[_index].size() > 0)
    {
      frame = *frameBuffer_[_index].begin();
      frameBuffer_[_index].pop_front();
    }
    }
    if(!frame && (remaining > 0))
    {
      remaining = elapsed - Clock::instance().elapsed();
      if(remaining > 0)
      {
        std::this_thread::sleep_for(1ms);
      }
    }
  }
  while(!frame && remaining > 0);

  return frame;
}
