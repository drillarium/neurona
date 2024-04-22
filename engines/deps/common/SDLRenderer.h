#pragma once

#include <SDL.h>
#include <SDL_ttf.h>
#include "sync_clock.h"

struct AVFrame;

class SDLRenderer
{
public:
  SDLRenderer();
  ~SDLRenderer();

  bool init(const char *_title, int _width = 320, int _height = 180, int _fontSize = 10, bool _visible = true);
  bool cleanUp();
  bool render(AVFrame *_frame, SDL_Color _textColor = { 0, 0, 255 });

protected:
  void renderText(SDL_Renderer *_renderer, TTF_Font *_font, const char *_text, int _x, int _y, SDL_Color _textColor);

protected:
  SDL_Renderer *renderer_ = nullptr;
  SDL_Window *window_ = nullptr;
  SDL_Texture* texture_ = nullptr;
  std::string title_;
  int width_ = 0;
  int height_ = 0;
  int fontSize_ = 10;
  TTF_Font *font_ = nullptr;
  SyncClock syncClock_;
};
