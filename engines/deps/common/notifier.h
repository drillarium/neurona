#pragma once

#include <iostream>
#include <stdarg.h>
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

#define MAX_LOG_MESSAGE_SIZE 1024

__inline void notifyLog(const char *_severity, const char *_message)
{
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
  writer.StartObject();  // {

  writer.Key("type");
  writer.String("log");

  writer.Key("message");
  writer.String(_message);

  writer.Key("severity");
  writer.String(_severity);

  writer.EndObject(); // }

  std::cout << buffer.GetString() << std::flush;
}

__inline void notifyError(const char *_format, ...)
{
  char message[MAX_LOG_MESSAGE_SIZE];
  va_list argptr;
  va_start(argptr, _format);
  vsnprintf(message, MAX_LOG_MESSAGE_SIZE - 1, _format, argptr);
  va_end(argptr);

  notifyLog("error", message);
}

__inline void notifyWarning(const char *_format, ...)
{
  char message[MAX_LOG_MESSAGE_SIZE];
  va_list argptr;
  va_start(argptr, _format);
  vsnprintf(message, MAX_LOG_MESSAGE_SIZE - 1, _format, argptr);
  va_end(argptr);

  notifyLog("warning", message);
}

__inline void notifyInfo(const char *_format, ...)
{
  char message[MAX_LOG_MESSAGE_SIZE];
  va_list argptr;
  va_start(argptr, _format);
  vsnprintf(message, MAX_LOG_MESSAGE_SIZE - 1, _format, argptr);
  va_end(argptr);

  notifyLog("info", message);
}

__inline void notifyDebug(const char *_format, ...)
{
  char message[MAX_LOG_MESSAGE_SIZE];
  va_list argptr;
  va_start(argptr, _format);
  vsnprintf(message, MAX_LOG_MESSAGE_SIZE - 1, _format, argptr);
  va_end(argptr);

  notifyLog("debug", message);
}

__inline void notifyStatus(const char *_status)
{
  std::cout << _status << std::flush;
}

__inline void notifyEvent(const char *_event)
{
  std::cout << _event << std::flush;
}

__inline void notifyReply(const char *_reply)
{
  std::cout << _reply << std::flush;
}