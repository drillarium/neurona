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

// based on
// https://github.com/gotnospirit/cef3-sdl2/tree/master

#include "include/cef_app.h"
#include "include/cef_client.h"
#include "include/cef_render_handler.h"
#include "include/wrapper/cef_helpers.h"
#include "include/cef_sandbox_win.h"

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

// 
// based on cefsimple_win.cc
// 

#include "simple_app.h"

#if defined(CEF_USE_SANDBOX)
// The cef_sandbox.lib static library may not link successfully with all VS
// versions.
#pragma comment(lib, "cef_sandbox.lib")
#endif

// run. Main thread generates black and silence while stream does not generate AVsamples
bool CefInputEngine::run(const char *_JsonConfig)
{
  UID_ = "CEF_INPUT";

void *sandbox_info = nullptr;

#if defined(CEF_USE_SANDBOX)
  // Manage the life span of the sandbox information object. This is necessary
  // for sandbox support on Windows. See cef_sandbox_win.h for complete details.
  CefScopedSandboxInfo scoped_sandbox;
  sandbox_info = scoped_sandbox.sandbox_info();
#endif

  // Provide CEF with command-line arguments.
  CefMainArgs main_args;

  // CEF applications have multiple sub-processes (render, GPU, etc) that share
  // the same executable. This function checks the command-line and, if this is
  // a sub-process, executes the appropriate logic.
  int exit_code = CefExecuteProcess(main_args, nullptr, sandbox_info);
  if(exit_code >= 0)
  {
    // The sub-process has completed so return here.
    return false;
  }

  // Parse command-line arguments for use in this method.
  CefRefPtr<CefCommandLine> command_line = CefCommandLine::CreateCommandLine();
  command_line->InitFromString(::GetCommandLineW());

  // Specify CEF global settings here.
  CefSettings settings;

  // Use the CEF Chrome runtime if "--enable-chrome-runtime" is specified via
  // the command-line. Otherwise, use the CEF Alloy runtime. For more
  // information about CEF runtimes see
  // https://bitbucket.org/chromiumembedded/cef/wiki/Architecture.md#markdown-header-cef3
  if(command_line->HasSwitch("enable-chrome-runtime"))
  {
    settings.chrome_runtime = true;
  }

#if !defined(CEF_USE_SANDBOX)
  settings.no_sandbox = true;
#endif

  AVFrame *videoFrame = nullptr;
  videoFrame = av_frame_alloc();
  videoFrame->width = 800;
  videoFrame->height = 600;
  videoFrame->format = AV_PIX_FMT_BGRA;

  int videoBufferSize = av_image_get_buffer_size((AVPixelFormat) videoFrame->format, videoFrame->width, videoFrame->height, 1);
  uint8_t *videoBuffer = (uint8_t*) av_malloc(videoBufferSize);
  av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, (AVPixelFormat) videoFrame->format, videoFrame->width, videoFrame->height, 1);

  // SimpleApp implements application-level callbacks for the browser process.
  // It will create the first browser instance in OnContextInitialized() after
  // CEF has initialized.
  CefRefPtr<SimpleApp> app(new SimpleApp([&] (const void* buffer, int w, int h) {
        int bufferSize = w * h * 4;
        memcpy(videoBuffer, buffer, bufferSize);

        // push
        AVFrameExt* frameExt = new AVFrameExt;
        frameExt->timeBase = { 1, 25 };
        videoFrame->duration = av_rescale_q(1, frameExt->timeBase, frameExt->timeBase);
        frameExt->AVFrame = frameDeepClone(videoFrame);
        frameExt->timeBase = { 1, 25 };
        frameExt->fieldOrder = AV_FIELD_PROGRESSIVE;      
        push(frameExt);
  }));

  // Initialize the CEF browser process. May return false if initialization
  // fails or if early exit is desired (for example, due to process singleton
  // relaunch behavior).
  if(!CefInitialize(main_args, settings, app.get(), sandbox_info))
  {
    return false;
  }

  // command thread
  std::thread workerThread = std::thread([&] {
    workerThreadFunc();
  });

  // Run the CEF message loop. This will block until CefQuitMessageLoop() is
  // called.
  CefRunMessageLoop();

  // join
  if(workerThread.joinable())
  {
    workerThread.join();
  }

  // Shut down CEF.
  CefShutdown();

  if(videoFrame)
  {
    av_frame_free(&videoFrame);
  }
  if(videoBuffer)
  {
    av_free(videoBuffer);
  }

  return true;
}

void CefInputEngine::workerThreadFunc()
{
  int64_t frameCount = 0;
  SyncClock clock;

  // renderer
  SDLRenderer renderer;
  std::string title = UID_;
  renderer.init(title.c_str());

  // sm protocol
  FFMPEGSharedMemoryProducer sm;
  sm.init(UID_.c_str());

  // video
  int width = 800;
  int height = 600;
  AVRational videoTimeBase = { 1, 25 };
  AVPixelFormat pixFmt = AV_PIX_FMT_RGBA;
  AVFieldOrder fieldOrder = AV_FIELD_PROGRESSIVE;

  // AVFrame
  AVFrame* videoFrame = av_frame_alloc();
  if(!videoFrame)
  {
    notifyError("Could not allocate frame");
    return;
  }

  videoFrame->width = width;
  videoFrame->height = height;
  videoFrame->format = pixFmt;

  int videoBufferSize = av_image_get_buffer_size(pixFmt, width, height, 1);
  uint8_t* videoBuffer = (uint8_t*)av_malloc(videoBufferSize);
  av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, pixFmt, width, height, 1);

  while(!abort_)
  {
    // draw video
    drawBackground(videoBuffer, width, height, videoFrame->linesize[0], pixFmt);
    drawLine(videoBuffer, width, height, videoFrame->linesize[0], pixFmt, frameCount, videoTimeBase);

    videoFrame->pts = frameCount;
    videoFrame->duration = av_rescale_q(1, videoTimeBase, videoTimeBase);

    // audioFrame->pts = frameCount * audioTimeBase.num;
    // audioFrame->duration = av_rescale_q(1024, audioTimeBase, audioTimeBase);

    frameCount++;

    AVFrameExt frameExt = { videoTimeBase, fieldOrder, AVMEDIA_TYPE_VIDEO, 0, videoFrame };

    /* buffer consumer */
    long long frd = frameDuration(&frameExt);
    {
      std::lock_guard<std::mutex> lock(frameBufferMutex_);
      AVFrameExt* frameExtInput = begin();
      if(frameExtInput)
      {
        frameExt.copy(frameExtInput);
        frd = frameDuration(&frameExt);
      }

      /* sm producer */
      sm.write(&frameExt);

      renderer.render(frameExt.AVFrame);
    }

    // sync
    clock.sync(frd);
  }
  
  // clean up
  renderer.cleanUp();
  sm.deinit();

  av_frame_free(&videoFrame);
  av_free(videoBuffer);
}

bool CefInputEngine::push(AVFrameExt *_frame)
{
  std::lock_guard<std::mutex> lock(frameBufferMutex_);

  frameBuffer_.push_back(_frame);
  if (frameBuffer_.size() > maxBufferSize_)
  {
    AVFrameExt *frame = *frameBuffer_.begin();
    free_AVFrameExt(&frame);
    frameBuffer_.pop_front();
  }

  return true;
}

AVFrameExt * CefInputEngine::begin()
{
  AVFrameExt* frame = nullptr;
  if(frameBuffer_.size() > 0)
  {
    frame = *frameBuffer_.begin();
  }

  return frame;
}