#include <string>
#include <thread>
#include <chrono>
#include "engine.h"
#include "notifier.h"
#include "sync_clock.h"
#include "SDLRenderer.h"
#include "FFMPEG_sm_producer.h"
#include "FFMPEG_utils.h"

using namespace std::chrono_literals;

const char APP_VERSION_STR[] = "0.0.1";

// getJsonSchema
std::string getJsonSchema()
{
  return "{}";
}

// getVersion
std::string getVersion()
{
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
  writer.StartObject();  // {

  writer.Key("engine");
  writer.String("CefInputEngine");

  writer.Key("type");
  writer.String("input");

  writer.Key("version");
  writer.String(APP_VERSION_STR);

  writer.EndObject(); // }

  return buffer.GetString();
}

// createEngine
void * createEngine()
{
  return new CefInputEngine();
}

// destroyEngine
bool destroyEngine(void **_engine)
{
  if(!*_engine) return false;
  
  CefInputEngine *engine = static_cast<CefInputEngine *>(*_engine);
  delete engine;
  *_engine = nullptr;

  return true;
}

// abortEngine
bool abortEngine(void *_engine)
{
  if(!_engine) return false;
  
  CefInputEngine *engine = static_cast<CefInputEngine *>(_engine);
  return engine->abort();
}

// putCommand
bool putCommand(void *_engine, const char *_JsonCommand)
{
  if(!_engine) return false;
  
  CefInputEngine *engine = static_cast<CefInputEngine *>(_engine);
  return engine->putCommand(_JsonCommand);
}

// runEngine
bool runEngine(void *_engine, const char *_JsonConfig)
{
  if(!_engine) return false;
  
  CefInputEngine *engine = static_cast<CefInputEngine *>(_engine);
  return engine->run(_JsonConfig);
}

// CefInputEngine
CefInputEngine::CefInputEngine()
{

}

// CefInputEngine
CefInputEngine::~CefInputEngine()
{

}

// abort
bool CefInputEngine::abort()
{
  abort_ = true;
  return true;
}

// putCommand
bool CefInputEngine::putCommand(const char *_JsonCommand)
{
  return true;
}

// run. Main thread generates black and silence while stream does not generate AVsamples
bool CefInputEngine::run(const char *_JsonConfig)
{
  UID_ = "TEST_CEF_INPUT";

  int64_t frameCount = 0;
  SyncClock clock;

  // renderer
  SDLRenderer renderer;
  std::string title = UID_;
  renderer.init(title.c_str());  

  // sm protocol
  FFMPEGSharedMemoryProducer sm;
  sm.init(UID_.c_str());

  return true;
}
