#pragma once

#include <thread>
#include "clock.h"

class SyncClock
{
public:
  SyncClock() {};

  void sync(long long _frameDurationIn100ns)
  {
    long long frameDuration = _frameDurationIn100ns * 100;
    long long remainingTime = frameDuration;
    if(startTime_ != -1)
    {
      long long now = Clock::instance().elapsed();
      long long elapsedTime = now - startTime_;
      remainingTime = elapsedTime < frameDuration ? frameDuration - elapsedTime : 0;
    }

    if(remainingTime > 0)
    {
      long long start = Clock::instance().elapsed();
      long long elapsed = 0;
      do
      {
        std::this_thread::sleep_for(std::chrono::nanoseconds(1));
        long long now = Clock::instance().elapsed();
        elapsed = now - start;
      } while (elapsed <= remainingTime);
    }

    startTime_ = Clock::instance().elapsed();
    ticks();
  }

  void ticks()
  {
    long long elapsed = 0;
    long long now = Clock::instance().elapsed();
    if(ticks_ == 0)
    {
      lastTickTime_ = now;
    }
    else
    {
      elapsed = now - lastTickTime_;
    }

    if(elapsed > 0)
    {
      ticksPerSecond_ = ((double) (ticks_ * 1000000000LL) / elapsed);
    }

    ticks_++;
    if(elapsed > 2000000000LL)
    {
      ticks_ = 0;
    }
  }

  double ticksPerSecond() { return ticksPerSecond_; }

protected:
  int ticks_ = 0;
  long long lastTickTime_ = -1;
  double ticksPerSecond_ = 0.;
  long long startTime_ = -1;
};
