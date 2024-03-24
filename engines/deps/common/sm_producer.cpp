#include <string>
#include "sm_producer.h"

SharedMemoryProducer::SharedMemoryProducer()
{

}

SharedMemoryProducer::~SharedMemoryProducer()
{

}

bool SharedMemoryProducer::init(const char *_id, int _size, int _count)
{
  ID_ = _id;

  // shared memory init
  smHandle_ = shm_init(_id, _size, _count);

  return true;
}

bool SharedMemoryProducer::deinit()
{
  /* sm close */
  shm_close(&smHandle_);

  return true;
}

bool SharedMemoryProducer::write(const unsigned char *_data, int _dataSize)
{
  Message *msg = &(smHandle_.rb->buffer[smHandle_.rb->wseq%smHandle_.rb->count]);
  unsigned char *msgData = shm_getmessagedata(smHandle_.rb, msg);
  memcpy(msgData, _data, _dataSize);
  msg->id = smMessageID_++;
  return shm_write_increment(&smHandle_);
}