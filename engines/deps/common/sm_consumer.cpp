#include <string>
#include "sm_consumer.h"

SharedMemoryConsumer::SharedMemoryConsumer()
{

}

SharedMemoryConsumer::~SharedMemoryConsumer()
{

}

bool SharedMemoryConsumer::init(const char *_id)
{
  ID_ = _id;

  // shared memory init
  smHandle_ = shm_connect(_id);

  return (smHandle_.shm_handle != 0);
}

bool SharedMemoryConsumer::deinit()
{
  /* sm close */
  shm_close(&smHandle_);

  return true;
}

bool SharedMemoryConsumer::read(unsigned char **_data)
{
  // nothing to read
  if(smHandle_.rb->wseq <= 0)
  {
    return false;
  }

  Message *msg = &(smHandle_.rb->buffer[(smHandle_.rb->wseq - 1) % smHandle_.rb->count]);
  *_data = shm_getmessagedata(smHandle_.rb, msg);
  lastMessageID_ = msg->id;

  return true;
}
