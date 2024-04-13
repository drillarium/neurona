#include <string>
#include "SDLRenderer.h"
#include "notifier.h"
#include "FFMPEG_utils.h"

SDLRenderer::SDLRenderer()
{

}

SDLRenderer::~SDLRenderer()
{

}

bool SDLRenderer::init(const char *_title, int _width, int _height, int _fontSize)
{
  title_ = _title;
  width_ = _width;
  height_ = _height;
  fontSize_ = _fontSize;

  // Initialize SDL
  if(SDL_Init(SDL_INIT_VIDEO) < 0)
  {
    notifyError("SDL initialization failed: %s", SDL_GetError());
    cleanUp();
    return false;
  }

  // Create SDL window
  window_ = SDL_CreateWindow("Video Player", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, width_, height_, SDL_WINDOW_SHOWN);
  if(!window_)
  {
    notifyError("Failed to create SDL window: %s", SDL_GetError());
    cleanUp();
    return false;
  }

  // Create SDL renderer
  renderer_ = SDL_CreateRenderer(window_, -1, SDL_RENDERER_ACCELERATED);
  if(!renderer_)
  {
    notifyError("Failed to create SDL renderer: %s", SDL_GetError());
    cleanUp();
    return false;
  }

  texture_ = SDL_CreateTexture(renderer_, SDL_PIXELFORMAT_RGB24, SDL_TEXTUREACCESS_STREAMING, width_, height_);
  if(!texture_)
  {
    notifyError("Failed to create SDL texture: %s", SDL_GetError());
    cleanUp();
    return false;
  }

  if(TTF_Init() == -1)
  {
    notifyError("SDL_ttf initialization failed: %s", TTF_GetError());
    cleanUp();
    return false;
  }

  font_ = TTF_OpenFont("../deps/common/Montserrat-Regular.ttf", _fontSize);
  if(!font_)
  {
    font_ = TTF_OpenFont("./Montserrat-Regular.ttf", _fontSize);
  }
  if(!font_)
  {
    notifyError("Font loading failed: %s", TTF_GetError());
  }

  return true;
}

bool SDLRenderer::cleanUp()
{
  if(texture_)
  {
    SDL_DestroyTexture(texture_);
  }
  if(font_)
  {
    TTF_CloseFont(font_);
  }
  if(renderer_)
  {
    SDL_DestroyRenderer(renderer_);
  }
  if(window_)
  {
    SDL_DestroyWindow(window_);
  }
  SDL_Quit();
  TTF_Quit();

  return true;
}

extern "C" {
#include <libswscale/swscale.h>
#include <libavutil/imgutils.h>
}

bool SDLRenderer::render(AVFrame *_frame, SDL_Color _textColor)
{
  // fps
  syncClock_.ticks();
  double fps = syncClock_.ticksPerSecond();

  // convert to RGB
  AVFrame *rgbFrame = frameConvert(_frame, width_, height_);

  // pool event
  SDL_Event e;
  while(SDL_PollEvent(&e) != 0) { }

  // Lock SDL texture
  void *pixels = nullptr;
  int pitch = 0;
  SDL_LockTexture(texture_, nullptr, &pixels, &pitch);

  // Copy RGB frame to SDL texture
  memcpy(pixels, rgbFrame->data[0], height_ * rgbFrame->linesize[0]);

  // Unlock SDL texture
  SDL_UnlockTexture(texture_);

  // Clear the renderer
  SDL_RenderClear(renderer_);

  // Copy SDL texture to renderer
  SDL_RenderCopy(renderer_, texture_, nullptr, nullptr);

  // text
  if(font_)
  {
    renderText(renderer_, font_, title_.c_str(), 0, 0, _textColor);
    std::string stats = "fps: " + std::to_string(fps);
    renderText(renderer_, font_, stats.c_str(), 0, fontSize_, _textColor);
    std::string size = "size: " + std::to_string(_frame->width) + "x" + std::to_string(_frame->height);
    renderText(renderer_, font_, size.c_str(), 0, fontSize_ << 1, _textColor);
  }

  // Render the frame
  SDL_RenderPresent(renderer_);

  // free
  frameFree(rgbFrame);

  return true;
}

// Function to render and display text
void SDLRenderer::renderText(SDL_Renderer *_renderer, TTF_Font *_font, const char *_text, int _x, int _y, SDL_Color _textColor)
{
  SDL_Surface *textSurface = TTF_RenderText_Solid(_font, _text, _textColor);
  SDL_Texture *textTexture = SDL_CreateTextureFromSurface(_renderer, textSurface);

  int textWidth = textSurface->w;
  int textHeight = textSurface->h;

  SDL_Rect destRect = { _x, _y, textWidth, textHeight };

  SDL_RenderCopy(_renderer, textTexture, NULL, &destRect);

  SDL_FreeSurface(textSurface);
  SDL_DestroyTexture(textTexture);
}