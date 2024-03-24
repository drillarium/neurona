#pragma once

#include <iostream>
#include <chrono>

class Clock
{
private:
  using ClockType = std::chrono::high_resolution_clock;
  using TimePoint = std::chrono::time_point<ClockType>;
  TimePoint startTime_;

  Clock()
  {
    restart();
  }

public:
  static Clock& instance()
  {
    static Clock instance;
    return instance;
  }

  // restart
  void restart()
  {
    startTime_ = ClockType::now();
  }

  // elapsed
  long long elapsed() const
  {
    auto currentTime = ClockType::now();
    auto elapsedTime = std::chrono::duration_cast<std::chrono::nanoseconds>(currentTime - startTime_);
    return elapsedTime.count();
  }
};