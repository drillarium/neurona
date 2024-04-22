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

SDL_PixelFormatEnum FFMPEGPixelFormat2SDLPixelFormat(AVPixelFormat _pixFmt)
{
  switch(_pixFmt)
  {
    case AV_PIX_FMT_RGB24:
      return SDL_PIXELFORMAT_RGB24;
    case AV_PIX_FMT_RGBA:
      return SDL_PIXELFORMAT_RGBA32;
    case AV_PIX_FMT_BGRA:
      return SDL_PIXELFORMAT_ABGR8888;
    default:
      return SDL_PIXELFORMAT_UNKNOWN;
  }
}

enum EViewType {
  VT__VIDEO,
  VT_GRAPHIC
};

struct SMultiviewerView
{
  EViewType type = VT__VIDEO;
  int x = 0;
  int y = 0;
  int w = 0;
  int h = 0;
  std::string UID;
  std::string name;
};

struct SMultiviewerVideoView : public SMultiviewerView
{
  bool drawVumter = false;
  bool drawMetadata = false;
};

struct SMultiviewerCongif
{
  int width = 1920;
  int height = 1080;
  AVRational timeBase = {1, 25};
  AVPixelFormat format = AV_PIX_FMT_RGB24;
  AVFieldOrder fieldOrder = AV_FIELD_PROGRESSIVE;
  std::vector<SMultiviewerView *> viewer;
};

const char WINLAY[] = "window_layout";
const char WIDTH[] = "width";
const char HEIGHT[] = "height";
const char FR[] = "frame_rate";
const char FORMAT[] = "format";
const char FIELDO[] = "field_order";
const char COMP[] = "components";
const char TYPE[] = "type";
const char POS[] = "position";
const char SIZE[] = "size";
const char SOURCE[] = "source";
const char VUMETER[] = "vumeter";
const char METADATA[] = "metadata";
const char SHOW[] = "show";
const char XPOS[] = "x";
const char YPOS[] = "y";
const char NAME[] = "name";

EViewType string2type(const char *_type)
{
  if(!_stricmp(_type, "VIDEO"))
  {
    return EViewType::VT__VIDEO;
  }
  else if(!_stricmp(_type, "GRAPHIC"))
  {
    return EViewType::VT_GRAPHIC;
  }

  return EViewType::VT__VIDEO;
}

SMultiviewerCongif * parseMultiviewerConfig(const char *_JsonConfig)
{
  rapidjson::Document d;
  d.Parse(_JsonConfig);
  if(d.HasParseError())
  {
    notifyError("Error parsing configuration: %s", _JsonConfig);
    return NULL;
  }

  if(!d.HasMember(WINLAY) || !d[WINLAY].IsObject())
  {
    notifyError("Invalid configuration: %s", _JsonConfig);
    return NULL;
  }
  
  SMultiviewerCongif *mvc = new SMultiviewerCongif;
  auto wl = d[WINLAY].GetObject();
  if(wl.HasMember(WIDTH) && wl[WIDTH].IsInt())
  {
    mvc->width = wl[WIDTH].GetInt();
  }
  if(wl.HasMember(HEIGHT) && wl[HEIGHT].IsInt())
  {
    mvc->height = wl[HEIGHT].GetInt();
  }
  if(wl.HasMember(FR) && wl[FR].IsString())
  {
    std::string fr_str = wl[FR].GetString();
    AVRational fr = parseFR(fr_str.c_str());
    mvc->timeBase.num = fr.den;
    mvc->timeBase.den = fr.num;
  }
  if(wl.HasMember(FORMAT) && wl[FORMAT].IsString())
  {
    std::string format_str = wl[FORMAT].GetString();
    mvc->format = strig2format(format_str.c_str());
  }  
  if(wl.HasMember(FIELDO) && wl[FIELDO].IsString())
  {
    std::string fieldorder_str = wl[FIELDO].GetString();
    mvc->fieldOrder = strig2fieldorder(fieldorder_str.c_str());
  }
  if(wl.HasMember(COMP) && wl[COMP].IsArray())
  {
    auto comAr = wl[COMP].GetArray();
    for(rapidjson::Value::ConstValueIterator it = comAr.Begin(); it != comAr.End(); it++)
    {
      if(it->HasMember(TYPE))
      {
        // type
        std::string type_str = (*it)[TYPE].GetString();
        EViewType type = string2type(type_str.c_str());
        SMultiviewerView *mvv = nullptr;
        switch(type)
        {
          case EViewType::VT__VIDEO: mvv = new SMultiviewerVideoView; break;
          case EViewType::VT_GRAPHIC: mvv = new SMultiviewerView; break;
          default: mvv = new SMultiviewerView; break;          
        }
        mvv->type = type;
        mvc->viewer.push_back(mvv);

        // position
        if(it->HasMember(POS))
        {
          auto pos = (*it)[POS].GetObject();
          mvv->x = pos["x"].GetInt();
          mvv->y = pos["y"].GetInt();
        }

        // source
        if(it->HasMember(SOURCE))
        {
          mvv->UID = (*it)[SOURCE].GetString();
        }
        
        // name
        if(it->HasMember(NAME))
        {
          mvv->name = (*it)[NAME].GetString();
        }

        // size
        if(it->HasMember(SIZE))
        {
          auto pos = (*it)[SIZE].GetObject();
          mvv->w = pos["width"].GetInt();
          mvv->h = pos["height"].GetInt();
        }
      }
    }
  }

  return mvc;
}

void free_config(SMultiviewerCongif *_config)
{
  for(int i = 0; _config->viewer.size(); i++)
  {
    delete _config->viewer[i];
  }
  _config->viewer.clear();

  delete _config;
}

const char DEFAULT_CONFIG[] = "{\
\"window_layout\": {\
  \"width\": 1920,\
  \"height\" : 1080,\
  \"frame_rate\" : \"25/1\",\
  \"field_order\" : \"PROGRESSIVE\",\
  \"format\" : \"RGB24\",\
  \"components\" : [\
      {\
        \"type\": \"video\",\
        \"position\" : { \"x\": 0, \"y\" : 0 },\
        \"size\" : { \"width\": 960, \"height\" : 1080 },\
        \"source\" : \"FFMPEG_INPUT\",\
        \"name\" : \"BACKGROUND\"\
      },\
      {\
        \"type\": \"graphic\",\
        \"position\" : { \"x\": 960, \"y\" : 0 },\
        \"size\" : { \"width\": 960, \"height\" : 1080 },\
        \"source\" : \"FFMPEG_INPUT\",\
        \"format\" : \"png\",\
        \"name\" : \"OVERLAY\"\
      }\
    ]\
  }\
}\
";

const char DEFAULT_CONFIG_[] = "{\
\"window_layout\": {\
  \"width\": 1920,\
  \"height\" : 1080,\
  \"frame_rate\" : \"25/1\",\
  \"field_order\" : \"PROGRESSIVE\",\
  \"format\" : \"ARGB\",\
  \"components\" : [\
      {\
        \"type\": \"video\",\
        \"position\" : { \"x\": 0, \"y\" : 0 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"FFMPEG_INPUT\",\
        \"name\" : \"Input#1\"\
      },\
      {\
        \"type\": \"graphic\",\
        \"position\" : { \"x\": 480, \"y\" : 0 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"FFMPEG_INPUT\",\
        \"name\" : \"Input#2\"\
      },\
      {\
        \"type\": \"video\",\
        \"position\" : { \"x\": 960, \"y\" : 0 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"FFMPEG_INPUT\",\
        \"name\" : \"Input#3\"\
      },\
      {\
        \"type\": \"graphic\",\
        \"position\" : { \"x\": 1200, \"y\" : 0 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"FFMPEG_INPUT\",\
        \"format\" : \"png\",\
        \"name\" : \"Input#4\"\
      },\
      {\
        \"type\": \"video\",\
        \"position\" : { \"x\": 0, \"y\" : 540 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"CEF_INPUT\",\
        \"name\" : \"Input#5\"\
      },\
      {\
        \"type\": \"graphic\",\
        \"position\" : { \"x\": 480, \"y\" : 540 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"CEF_INPUT\",\
        \"name\" : \"Input#6\"\
      },\
      {\
        \"type\": \"video\",\
        \"position\" : { \"x\": 960, \"y\" : 540 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"CEF_INPUT\",\
        \"name\" : \"Input#7\"\
      },\
      {\
        \"type\": \"graphic\",\
        \"position\" : { \"x\": 1440, \"y\" : 540 },\
        \"size\" : { \"width\": 480, \"height\" : 540 },\
        \"source\" : \"CEF_INPUT\",\
        \"format\" : \"png\",\
        \"name\" : \"Input#8\"\
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

  TTF_Font *font = TTF_OpenFont("../deps/common/Montserrat-Regular.ttf", 50);
  if(!font)
  {
    notifyError("Font loading failed: %s", TTF_GetError());
    SDL_Quit();
    return false;
  }

  // surface
  SDL_Surface *surface = nullptr;
  AVFrame *videoFrame = nullptr;
  int videoBufferSize = 0;
  uint8_t *videoBuffer = NULL;

  // 
  int64_t frameCount = 0;
  SyncClock clock;

  UID_ = "MIXER";

  // renderer
  SDLRenderer renderer;
  renderer.init(UID_.c_str(), 720, 576);

  // sm protocol
  FFMPEGSharedMemoryProducer sm;
  sm.init(UID_.c_str());

  // producer threads
  std::vector<std::thread> producerThread;

  // initialize configuration
  nextConfiguration_ = DEFAULT_CONFIG;
  configure_ = true;
  SMultiviewerCongif *config = NULL;

  while(!abort_)
  {
    if(configure_)
    {     
      SMultiviewerCongif *nextConfig = parseMultiviewerConfig(nextConfiguration_.c_str());
      if(nextConfig)
      {
        // FFMPEG
        if(videoFrame)
        {
          av_frame_free(&videoFrame);
        }
        videoFrame = av_frame_alloc();
        videoFrame->width = nextConfig->width;
        videoFrame->height = nextConfig->height;
        videoFrame->format = nextConfig->format;
        videoBufferSize = av_image_get_buffer_size(nextConfig->format, nextConfig->width, nextConfig->height, 1);
        if(videoBuffer)
        {
          av_free(videoBuffer);
        }
        videoBuffer = (uint8_t *) av_malloc(videoBufferSize);
        av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, nextConfig->format, nextConfig->width, nextConfig->height, 1);

        // Create surface
        if(surface)
        {
          SDL_FreeSurface(surface);
        }

        int bpp = getBitsPerPixel((AVPixelFormat) nextConfig->format);
        SDL_PixelFormatEnum sdlPixForm = FFMPEGPixelFormat2SDLPixelFormat((AVPixelFormat)nextConfig->format);      
        surface = SDL_CreateRGBSurfaceWithFormatFrom(videoFrame->data[0], videoFrame->width, videoFrame->height, bpp, videoFrame->linesize[0], sdlPixForm);

        // threads
        std::vector<std::mutex> list(std::max(producerThread.size(), nextConfig->viewer.size()));
        frameBufferMutex_.swap(list);
        for(size_t i = producerThread.size(); i < nextConfig->viewer.size(); i++)
        {
          configureProducer_.push_back(false);
          frameBuffer_.push_back(std::list<AVFrameExt *>());        
          producerThread.push_back(std::thread([&, i] {
            workerThreadFunc((int) i);
          }));       
        }

        // already configured
        if(config)
        {
          free_config(config);
        }
        config = nextConfig;
        currentConfiguration_ = nextConfiguration_;
        nextConfiguration_.clear();
        configure_ = false;

        // 
        for(size_t i = 0; i < producerThread.size(); i++)
        {
          configureProducer_[i] = true;
        }
      }
    }

    // clear surface
    SDL_FillRect(surface, NULL, 0x00000000);

    // draw lines
    for(int i = 0; i < config->viewer.size(); i++)
    {
      // Set the position where surface2 will be drawn on surface1
      int w = config->viewer[i]->w;
      int h = config->viewer[i]->h;
      int x = config->viewer[i]->x;
      int y = config->viewer[i]->y;

      drawLine(videoBuffer, x, y, w, h, videoFrame->linesize[0], config->format, frameCount, config->timeBase);
    }

    // check inputs
    for(int i = 0; i < config->viewer.size(); i++)
    {
      // Set the position where surface2 will be drawn on surface1
      int w = config->viewer[i]->w;
      int h = config->viewer[i]->h;
      int x = config->viewer[i]->x;
      int y = config->viewer[i]->y;

      AVFrameExt *frameExtInput = pop(i);
      bool validInput = !!frameExtInput;
      if(frameExtInput)
      {         
        // convert and scale
        AVFrame *frame = frameConvert(frameExtInput->AVFrame, w, h, (AVPixelFormat) frameExtInput->AVFrame->format);

        // 0xff000000, 0x00ff0000, 0x0000ff00, 0x000000ff // transparent verde
        // 0x0000ff00, 0x00ff0000, 0xff000000, 0x000000ff // transparent amarillo
        // 0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000 // no transparente rojo OK
        // https://github.com/bminor/SDL/blob/master/src/video/SDL_pixels.c#L294

        // to surface
        int bpp = getBitsPerPixel((AVPixelFormat) frameExtInput->AVFrame->format);
        SDL_PixelFormatEnum sdlPixForm = FFMPEGPixelFormat2SDLPixelFormat((AVPixelFormat)frameExtInput->AVFrame->format);
        SDL_Surface *inputSurface = SDL_CreateRGBSurfaceWithFormatFrom(frame->data[0], frame->width, frame->height, bpp, frame->linesize[0], sdlPixForm);

        // Blit surface2 onto surface1 at the specified position
        SDL_Rect srcRect = { 0, 0, inputSurface->w, inputSurface->h };
        SDL_Rect destRect = { x, y, inputSurface->w, inputSurface->h };
        SDL_BlitSurface(inputSurface, &srcRect, surface, &destRect);

        // release
        SDL_FreeSurface(inputSurface);

        // release converted frame
        frameFree(frame);

        // release frame from input
        free_AVFrameExt(&frameExtInput);
      }

      // title
      std::string title = config->viewer[i]->name.length() > 0? config->viewer[i]->name :  "???";
      title += validInput ? "" : " *";
      SDL_Color textColor = { 0xff, 0xff, 0xff, 0xff };
      SDL_Surface *textSurface = TTF_RenderText_Solid(font, title.c_str(), textColor);      
      SDL_Rect textRect = { x + (w >> 1) - (textSurface->w >> 1), y, textSurface->w, textSurface->h };
      SDL_BlitSurface(textSurface, NULL, surface, &textRect);

      SDL_FreeSurface(textSurface);

      // vumeter

      // metadata

      // clock
    }

    videoFrame->pts = frameCount;
    videoFrame->duration = av_rescale_q(1, config->timeBase, config->timeBase);
    frameCount++;

    AVFrameExt frameExt = { config->timeBase, config->fieldOrder, AVMEDIA_TYPE_VIDEO, 0, videoFrame };

    // render
    renderer.render(frameExt.AVFrame);

    // sync
    long long frd = frameDuration(&frameExt);
    clock.sync(frd);
  }

  if(config)
  {
    free_config(config);
  }

  renderer.cleanUp();
  sm.deinit();

  av_frame_free(&videoFrame);
  av_free(videoBuffer);

  TTF_CloseFont(font);
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
      smc.init(_index % 2? "CEF_INPUT" : "FFMPEG_INPUT");

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
