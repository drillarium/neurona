#pragma once

#include <SDL.h>

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
