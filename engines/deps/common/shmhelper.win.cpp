#ifdef _WIN32

#include <windows.h>
#include "shmhelper.h"

ShMHandle shm_init(const char *_shmname, int _messageSize, int _messageCount)
{
  ShMHandle ret = { };
  
  int shmlen = sizeof(RingBuffer) + (_messageCount * sizeof(Message)) + (_messageSize * _messageCount);
  ret.shm_handle = (unsigned long long) CreateFileMappingA(INVALID_HANDLE_VALUE, NULL, PAGE_READWRITE, 0, shmlen, _shmname);
  if(!ret.shm_handle)
  {
    return ret;
  }

  ret.rb = (RingBuffer *) MapViewOfFile((HANDLE) ret.shm_handle, FILE_MAP_ALL_ACCESS, 0, 0, shmlen);
  if(!ret.rb)
  {
    CloseHandle((HANDLE) ret.shm_handle);
	  ret.shm_handle = 0;
    return ret;
  }

  ret.rb->size = _messageSize;
  ret.rb->count = _messageCount;
  ret.rb->wseq = 0;

  /* data offsets */
  unsigned long p = sizeof(RingBuffer) + (_messageCount * sizeof(Message));
  for(unsigned int i = 0; i < ret.rb->count; i++)
  {
	  ret.rb->buffer[i].offset = p;
	  p += ret.rb->size;
  }

  return ret;
}

ShMHandle shm_connect(const char *_shmname)
{
  ShMHandle ret = { };

  ret.shm_handle = (unsigned long long) OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, _shmname);
  if(ret.shm_handle == 0)
  {
    return ret;
  }

  ret.rb = (RingBuffer *) MapViewOfFile((HANDLE) ret.shm_handle, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(RingBuffer));
  if(!ret.rb)
  {
    CloseHandle((HANDLE) ret.shm_handle);
	  ret.shm_handle = 0;
	  return ret;
  }

  int shmlen = sizeof(RingBuffer) + (ret.rb->count * sizeof(Message)) + (ret.rb->size * ret.rb->count);
  UnmapViewOfFile(ret.rb);
  ret.rb = (RingBuffer *) MapViewOfFile((HANDLE) ret.shm_handle, FILE_MAP_ALL_ACCESS, 0, 0, shmlen);
  if(!ret.rb)
  {
	  CloseHandle((HANDLE )ret.shm_handle);
	  ret.shm_handle = 0;
	  return ret;
  }

  return ret;
}

bool shm_write_increment(ShMHandle *_handle)
{
  return InterlockedIncrement64(&_handle->rb->wseq);
}

bool shm_close(ShMHandle *_handle)
{
  if(!_handle)
  {
    return false;
  }

  if(_handle->rb)
  {
    UnmapViewOfFile(_handle->rb);
  }
  _handle->rb = nullptr;

  if(_handle->shm_handle)
  {
    CloseHandle((HANDLE)_handle->shm_handle);
  }
  _handle->shm_handle = 0;
 
  return true;
}

unsigned char * shm_getmessagedata(RingBuffer *_ringBuffer, Message *_message)
{
  if(!_ringBuffer)
  {
    return nullptr;
  }

  unsigned long long addr = (unsigned long long) _ringBuffer;
  return (unsigned char *) (addr + _message->offset);
}

#endif // _WIN32
