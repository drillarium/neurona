#include <string>
#include <clock.h>
#include "sm_consumer.h"

using namespace std::chrono_literals;

SharedMemoryConsumer::SharedMemoryConsumer()
{

}

SharedMemoryConsumer::~SharedMemoryConsumer()
{

}

bool SharedMemoryConsumer::init(const char *_id, int _msTimeout)
{
  ID_ = _id;

  // shared memory init
  smHandle_ = shm_connect(_id);
  bool ok = (smHandle_.shm_handle != 0);
  if(ok)
  {
    dataSize_ = smHandle_.rb->size;
    data_ = new unsigned char[dataSize_];
    opened_ = true;

    // keep alive
    workerThread_ = std::thread([&] {
      keepAliveThreadFunc();
    });
  }

  return ok;
}

bool SharedMemoryConsumer::deinit()
{
  if(data_)
  {
    delete[] data_;
  }
  data_ = NULL;

  // keep alive
  if(workerThread_.joinable())
  {
    running_ = false;
    workerThread_.join();
  }

  /* sm close */
  shm_close(&smHandle_);

  return true;
}

bool SharedMemoryConsumer::read()
{
  // nothing to read
  if(smHandle_.rb->wseq <= 0) return false;
  Message *msg = &(smHandle_.rb->buffer[(smHandle_.rb->wseq - 1) % smHandle_.rb->count]);
  msgID_ = msg->id;
  memcpy(data_, shm_getmessagedata(smHandle_.rb, msg), dataSize_);
  return true;
}

void SharedMemoryConsumer::keepAliveThreadFunc()
{
  running_ = true;
  unsigned long long lastKeepAlive = 0;
  long long startTime = 0, timeoutTime = 0;
  
  while(running_)
  {
    if(opened_)
    {
      if(startTime == 0)
      {
        startTime = Clock::instance().elapsed();
        timeoutTime = startTime + (msTimeout_ * 1000000LL);
      }

      bool timeout = Clock::instance().elapsed() >= timeoutTime;
      if(timeout)
      {        
        if(smHandle_.rb->keepAlive == lastKeepAlive)
        {
          opened_ = false;
        }

        startTime = 0;
        lastKeepAlive = smHandle_.rb->keepAlive;
      }    
    }
    else
    {
      startTime = 0;
    }
    std::this_thread::sleep_for(1ms);    
  }
}