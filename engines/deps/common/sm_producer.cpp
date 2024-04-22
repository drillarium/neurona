#include <string>
#include "sm_producer.h"

using namespace std::chrono_literals;

SharedMemoryProducer::SharedMemoryProducer()
{

}

SharedMemoryProducer::~SharedMemoryProducer()
{

}

bool SharedMemoryProducer::init(const char* _id, int _size, int _count)
{
  ID_ = _id;

  // shared memory init
  smHandle_ = shm_init(_id, _size, _count);

  // keep alive
  workerThread_ = std::thread([&] {
    keepAliveThreadFunc();
  });

  return true;
}

bool SharedMemoryProducer::deinit()
{
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

bool SharedMemoryProducer::write(const unsigned char *_data, int _dataSize)
{
  Message *msg = &(smHandle_.rb->buffer[smHandle_.rb->wseq%smHandle_.rb->count]);
  unsigned char *msgData = shm_getmessagedata(smHandle_.rb, msg);
  memcpy(msgData, _data, _dataSize);
  if(smMessageID_ == 0) smMessageID_++;
  msg->id = smMessageID_++;
  return shm_write_increment(&smHandle_);
}

void SharedMemoryProducer::keepAliveThreadFunc()
{
  running_ = true;
  while(running_)
  {
    smHandle_.rb->keepAlive++;
    std::this_thread::sleep_for(1s);
  }
}