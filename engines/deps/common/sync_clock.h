#pragma once

#include <thread>
#include "clock.h"

class SyncClock
{
public:
  SyncClock() {};

  void testSleepDuration()
  {
    constexpr int initialSleepDurationMs = 1;
    int sleepDurationMs = initialSleepDurationMs;

    // Loop until the observed sleep duration stops decreasing
    while (true) {
      auto start = std::chrono::high_resolution_clock::now();
      std::this_thread::sleep_for(std::chrono::milliseconds(sleepDurationMs));
      auto end = std::chrono::high_resolution_clock::now();

      // Calculate the observed sleep duration
      auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
      std::cout << "Slept for approximately " << elapsed << " microseconds for " << sleepDurationMs << " milliseconds sleep duration." << std::endl;

      // If sleep duration is already 1 microsecond, break the loop
      if (sleepDurationMs == 1)
        break;

      // Decrease sleep duration for next iteration
      --sleepDurationMs;
    }
  }

  void sync(long long _frameDurationIn100ns)
  {
    if(startTime_ != -1)
    {
      // elapsed
      long long endTime = startTime_ + (_frameDurationIn100ns * 100);  
      long long now = Clock::instance().elapsed();
      long long sleepPrec = 5000000LL;
      while(endTime > now)
      {
        if((endTime - now) > sleepPrec)
        {
          std::this_thread::sleep_for(std::chrono::milliseconds(1));
        }
        now = Clock::instance().elapsed();
      }          
    }
      
    ticks();

    startTime_ = Clock::instance().elapsed();
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
      // 2 decimals precission
      ticksPerSecond_ = std::round(ticksPerSecond_ * 100.0) / 100.0;
    }

    ticks_++;

    // reset every 5 seconds 
    long long resetTime = 5000000000LL;
    if(elapsed > resetTime)
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
