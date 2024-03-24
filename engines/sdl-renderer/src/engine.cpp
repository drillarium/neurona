#include <string>
#include <thread>
#include <chrono>
#include <iostream>
#include <ctime>
#include <sstream>
#include <iomanip> 
#include "engine.h"
#include "notifier.h"
#include "sync_clock.h"
#include "SDLRenderer.h"
#include "FFMPEG_sm_producer.h"

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
  writer.String("SDLRendererEngine");

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
  return new SDLRendererEngine();
}

// destroyEngine
bool destroyEngine(void **_engine)
{
  if(!*_engine) return false;
  
  SDLRendererEngine *engine = static_cast<SDLRendererEngine *>(*_engine);
  delete engine;
  *_engine = nullptr;

  return true;
}

// abortEngine
bool abortEngine(void *_engine)
{
  if(!_engine) return false;
  
  SDLRendererEngine *engine = static_cast<SDLRendererEngine *>(_engine);
  return engine->abort();
}

// putCommand
bool putCommand(void *_engine, const char *_JsonCommand)
{
  if(!_engine) return false;
  
  SDLRendererEngine *engine = static_cast<SDLRendererEngine *>(_engine);
  return engine->putCommand(_JsonCommand);
}

// runEngine
bool runEngine(void *_engine, const char *_JsonConfig)
{
  if(!_engine) return false;
  
  SDLRendererEngine *engine = static_cast<SDLRendererEngine *>(_engine);
  return engine->run(_JsonConfig);
}

// SDLRendererEngine
SDLRendererEngine::SDLRendererEngine()
{

}

// SDLRendererEngine
SDLRendererEngine::~SDLRendererEngine()
{

}

// abort
bool SDLRendererEngine::abort()
{
  abort_ = true;
  return true;
}

// putCommand
bool SDLRendererEngine::putCommand(const char *_JsonCommand)
{
  return true;
}

const int CLOCK_WIDTH = 400;
const int CLOCK_HEIGHT = 400;
const int CLOCK_RADIUS = 150;
const int HOUR_HAND_LENGTH = 80;
const int MINUTE_HAND_LENGTH = 120;
const int SECOND_HAND_LENGTH = 140;
const int CENTER_X = CLOCK_WIDTH / 2;
const int CENTER_Y = CLOCK_HEIGHT / 2;
const int ALPHA = 255;
const int RED = 255;
const int GREEN = 255;
const int BLUE = 255;
const int NUM_FONT_SIZE = 20;
const int NUM_OFFSET = 20;

void drawPixel(SDL_Surface* surface, int x, int y, Uint32 color)
{
  if (x >= 0 && x < surface->w && y >= 0 && y < surface->h)
  {
    Uint32* pixels = static_cast<Uint32*>(surface->pixels);
    pixels[y * surface->w + x] = color;
  }
}

void drawLine(SDL_Surface *_surface, int _x1, int _y1, int _x2, int _y2, Uint32 _color)
{
  int dx = std::abs(_x2 - _x1);
  int dy = std::abs(_y2 - _y1);
  int sx = (_x1 < _x2) ? 1 : -1;
  int sy = (_y1 < _y2) ? 1 : -1;
  int err = dx - dy;

  while (_x1 != _x2 || _y1 != _y2)
  {
    drawPixel(_surface, _x1, _y1, _color);
    int e2 = 2 * err;
    if (e2 > -dy)
    {
      err -= dy;
      _x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      _y1 += sy;
    }
  }
}

void drawCircle(SDL_Surface *_surface, int _centerX, int _centerY, int _radius, Uint32 _color)
{
  int x = _radius;
  int y = 0;
  int err = 0;

  while (x >= y)
  {
    drawPixel(_surface, _centerX + x, _centerY + y, _color);
    drawPixel(_surface, _centerX - x, _centerY + y, _color);
    drawPixel(_surface, _centerX + x, _centerY - y, _color);
    drawPixel(_surface, _centerX - x, _centerY - y, _color);
    drawPixel(_surface, _centerX + y, _centerY + x, _color);
    drawPixel(_surface, _centerX - y, _centerY + x, _color);
    drawPixel(_surface, _centerX + y, _centerY - x, _color);
    drawPixel(_surface, _centerX - y, _centerY - x, _color);

    if (err <= 0) {
      y += 1;
      err += 2 * y + 1;
    }
    if (err > 0) {
      x -= 1;
      err -= 2 * x + 1;
    }
  }
}

void drawClock(SDL_Surface *_surface, TTF_Font *_font, int _hour, int _minute, int _second)
{
  // Clear screen
  SDL_FillRect(_surface, nullptr, SDL_MapRGBA(_surface->format, 0, 0, 0, 0));

  // Draw circle outline
  drawCircle(_surface, CENTER_X, CENTER_Y, CLOCK_RADIUS, SDL_MapRGBA(_surface->format, 255, 0, 255, ALPHA));

  // Draw numbers
  for(int i = 1; i <= 12; ++i)
  {
    double angle = i * 30.0 * (M_PI / 180.0);
    int numX = static_cast<int>(CENTER_X + (CLOCK_RADIUS - NUM_OFFSET) * std::sin(angle));
    int numY = static_cast<int>(CENTER_Y - (CLOCK_RADIUS - NUM_OFFSET) * std::cos(angle));

    // Convert integer hour to string
    std::stringstream ss;
    ss << std::setw(2) << std::setfill('0') << i;
    std::string numString = ss.str();

    // Render text
    SDL_Color color = { RED, GREEN, BLUE, ALPHA };
    SDL_Surface* textSurface = TTF_RenderText_Solid(_font, numString.c_str(), color);

    // Calculate position to blit the text
    SDL_Rect textRect;
    textRect.x = numX - textSurface->w / 2; // Center the text horizontally
    textRect.y = numY - textSurface->h / 2; // Center the text vertically

    // Blit the text onto the surface
    SDL_BlitSurface(textSurface, nullptr, _surface, &textRect);

    // Cleanup
    SDL_FreeSurface(textSurface);
  }

  // Calculate angles for hour, minute, and second hands
  float hourAngle = (float) ((_hour % 12 + _minute / 60.0f) * 30.0f * (M_PI / 180.0f));
  float minuteAngle = (float) ((_minute + _second / 60.0f) * 6.0f * (M_PI / 180.0f));
  float secondAngle = (float) (_second * 6.0f * (M_PI / 180.0f));

  // Draw hour hand
  int hourX = CENTER_X + static_cast<int>(HOUR_HAND_LENGTH * std::sin(hourAngle));
  int hourY = CENTER_Y - static_cast<int>(HOUR_HAND_LENGTH * std::cos(hourAngle));
  drawLine(_surface, CENTER_X, CENTER_Y, hourX, hourY, SDL_MapRGBA(_surface->format, 0, 255, 0, ALPHA));

  // Draw minute hand
  int minuteX = CENTER_X + static_cast<int>(MINUTE_HAND_LENGTH * std::sin(minuteAngle));
  int minuteY = CENTER_Y - static_cast<int>(MINUTE_HAND_LENGTH * std::cos(minuteAngle));
  drawLine(_surface, CENTER_X, CENTER_Y, minuteX, minuteY, SDL_MapRGBA(_surface->format, 0, 255, 0, ALPHA));

  // Draw second hand
  int secondX = CENTER_X + static_cast<int>(SECOND_HAND_LENGTH * std::sin(secondAngle));
  int secondY = CENTER_Y - static_cast<int>(SECOND_HAND_LENGTH * std::cos(secondAngle));
  drawLine(_surface, CENTER_X, CENTER_Y, secondX, secondY, SDL_MapRGBA(_surface->format, 0, 255, 0, ALPHA));
}

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

// run. Main thread generates black and silence while stream does not generate AVsamples
bool SDLRendererEngine::run(const char *_JsonConfig)
{
  // Initialize SDL
  if(SDL_Init(SDL_INIT_VIDEO) < 0)
  {
    notifyError("SDL could not initialize! SDL_Error: %s", SDL_GetError());
    return false;
  }

  // Create surface
  SDL_Surface *surface = SDL_CreateRGBSurface(0, CLOCK_WIDTH, CLOCK_HEIGHT, 32, 0xff000000, 0x00ff0000, 0x0000ff00, 0x000000ff);
  if(!surface)
  {
    notifyError("Surface could not be created! SDL_Error: %s", SDL_GetError());
    SDL_Quit();
    return 1;
  }

  if(TTF_Init() == -1)
  {
    notifyError("SDL_ttf initialization failed: %s", TTF_GetError());
    SDL_Quit();
    return false;
  }

  TTF_Font *font = TTF_OpenFont("./Montserrat-Regular.ttf", 10);
  if(!font)
  {
    notifyError("Font loading failed: %s", TTF_GetError());
    TTF_Quit();
    SDL_Quit();
    return false;
  }

  AVRational videoTimeBase = { 1, 25 };
  AVCodecID videoCodecID = AV_CODEC_ID_RAWVIDEO;
  AVPixelFormat pixFmt = AV_PIX_FMT_ABGR;
  AVFieldOrder fieldOrder = AV_FIELD_PROGRESSIVE;

  // AVFrame
  AVFrame *videoFrame = av_frame_alloc();
  if(!videoFrame)
  {
    notifyError("Could not allocate frame");
    return false;
  }

  videoFrame->width = CLOCK_WIDTH;
  videoFrame->height = CLOCK_HEIGHT;
  videoFrame->format = pixFmt;

  int videoBufferSize = av_image_get_buffer_size(pixFmt, CLOCK_WIDTH, CLOCK_HEIGHT, 1);
  uint8_t *videoBuffer = (uint8_t *) av_malloc(videoBufferSize);
  av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, pixFmt, CLOCK_WIDTH, CLOCK_HEIGHT, 1);

  int64_t frameCount = 0;
  SyncClock clock;

  // renderer
  SDLRenderer renderer;
  renderer.init("clock", CLOCK_WIDTH, CLOCK_HEIGHT);

  // sm protocol
  FFMPEGSharedMemoryProducer sm;
  sm.init("TEST");

  while(!abort_)
  {
    // Get current time
    std::time_t timer = std::time(0);
    std::tm bt{};
    localtime_s(&bt, &timer);
    int hour = bt.tm_hour;
    int minute = bt.tm_min;
    int second = bt.tm_sec;

    // Draw clock
    drawClock(surface, font, hour, minute, second);

    // Access pixel data from the surface
    uint32_t *pixels = static_cast<uint32_t *>(surface->pixels);
    memcpy(videoBuffer, pixels, videoBufferSize);

    videoFrame->pts = frameCount;
    videoFrame->duration = av_rescale_q(1, videoTimeBase, videoTimeBase);
    frameCount++;

    AVFrameExt frameExt = { videoTimeBase, videoFrame, fieldOrder };

    // shared memory
    sm.write(&frameExt);

    // render
    renderer.render(frameExt.AVFrame);

    // sync
    int numFields = frameExt.fieldOrder <= AV_FIELD_PROGRESSIVE ? 1 : 2;
    long long frameDuration = (frameExt.AVFrame->duration * (frameExt.timeBase.num * 10000000LL) / frameExt.timeBase.den) * numFields;
    clock.sync(frameDuration);
  }

  renderer.cleanUp();
  sm.deinit();

  av_frame_free(&videoFrame);
  av_free(videoBuffer);

  // Clean up
  TTF_CloseFont(font);
  TTF_Quit();
  SDL_Quit();

  return true;
}
