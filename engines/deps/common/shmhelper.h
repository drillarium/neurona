#ifndef SM_HELPER_INCLUDE
#define SM_HELPER_INCLUDE

/*
 * Based on https://stackoverflow.com/questions/16283517/single-producer-consumer-ring-buffer-in-shared-memory
 * gcc -I./ -o shmringbuffer shmringbuffer.cpp shmhelper.linux.cpp -lrt
 */

struct Message
{
  unsigned long long id;
  unsigned long offset;	            // offset from RingBuffer start
};

#pragma warning(disable:4200)

struct RingBuffer
{
  unsigned int size = 0;
  unsigned int count = 0;
  long long wseq = -1;
  long long keepAlive = -1;   // producer increment counter every second. Consumer use this counter as keepAlive

  /* always last member */
  Message buffer[];
};

#pragma warning(default:4200)

struct ShMHandle
{
  unsigned long long shm_handle = 0;  // shared memory handle  
  RingBuffer *rb = nullptr;           // ring buffer
};

ShMHandle shm_init(const char *_shmname, int _messageSize, int _messageCount);
ShMHandle shm_connect(const char *_shmname);
bool shm_write_increment(ShMHandle *_handle);
bool shm_close(ShMHandle *_handle);
unsigned char * shm_getmessagedata(RingBuffer *_ringBuffer, Message *_message);

#endif // SM_HELPER_INCLUDE
