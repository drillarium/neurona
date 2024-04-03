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

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

#include "sdl_keyboard_utils.h"

class RenderHandler : public CefRenderHandler
{
public:
  RenderHandler(SDL_Renderer *renderer, int w, int h, CefInputEngine *_engine)
  :width(w)
  ,height(h)
  ,renderer(renderer)
  ,engine_(_engine)
  {
    resize(w, h);
  }

  ~RenderHandler()
  {
    if(texture)
    {
      SDL_DestroyTexture(texture);
    }
    if(videoFrame_)
    {
      av_frame_free(&videoFrame_);
    }
    if(videoBuffer_)
    {
      av_free(videoBuffer_);
    }
    renderer = nullptr;
  }

  void GetViewRect(CefRefPtr<CefBrowser> browser, CefRect &rect)
  {
    rect = CefRect(0, 0, width, height);
  }

  void OnPaint(CefRefPtr<CefBrowser> browser, PaintElementType type, const RectList& dirtyRects, const void* buffer, int w, int h)
  {
    int bufferSize = w * h * 4;

    if(texture)
    {
      unsigned char* texture_data = NULL;
      int texture_pitch = 0;

      SDL_LockTexture(texture, 0, (void**) &texture_data, &texture_pitch);
      memcpy(texture_data, buffer, bufferSize);
      SDL_UnlockTexture(texture);
    }

    if(videoFrame_)
    {
      memcpy(videoFrame_->data[0], buffer, bufferSize);

      // push
      AVFrameExt* frameExt = new AVFrameExt;
      frameExt->AVFrame = frameDeepClone(videoFrame_);
      frameExt->timeBase = { 1, 25 };
      frameExt->fieldOrder = AV_FIELD_PROGRESSIVE;
      engine_->push(frameExt);
    }
  }

  void resize(int w, int h)
  {
    if(texture)
    {
      SDL_DestroyTexture(texture);
    }
    if(videoFrame_)
    {
      av_frame_free(&videoFrame_);
    }
    if(videoBuffer_)
    {
      av_free(videoBuffer_);
    }

    width = w;
    height = h;

    texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_UNKNOWN, SDL_TEXTUREACCESS_STREAMING, w, h);

    videoFrame_ = av_frame_alloc();
    videoFrame_->width = w;
    videoFrame_->height = h;
    videoFrame_->format = AV_PIX_FMT_RGBA;

    int videoBufferSize = av_image_get_buffer_size((AVPixelFormat)videoFrame_->format, videoFrame_->width, videoFrame_->height, 1);
    videoBuffer_ = (uint8_t *) av_malloc(videoBufferSize);
    av_image_fill_arrays(videoFrame_->data, videoFrame_->linesize, videoBuffer_, (AVPixelFormat)videoFrame_->format, videoFrame_->width, videoFrame_->height, 1);
  }

  void render()
  {
    SDL_RenderCopy(renderer, texture, NULL, NULL);
  }

private:
  int width = 0;
  int height = 0;
  SDL_Renderer *renderer = nullptr;
  SDL_Texture *texture = nullptr;
  AVFrame *videoFrame_ = nullptr;
  uint8_t *videoBuffer_ = nullptr;
  CefInputEngine *engine_ = nullptr;

  IMPLEMENT_REFCOUNTING(RenderHandler);
};

// for manual render handler
class BrowserClient : public CefClient, public CefLifeSpanHandler, public CefLoadHandler
{
public:
  BrowserClient(CefRefPtr<CefRenderHandler> ptr)
  :handler(ptr)
  {
  }

  virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler()
  {
    return this;
  }

  virtual CefRefPtr<CefLoadHandler> GetLoadHandler()
  {
    return this;
  }

  virtual CefRefPtr<CefRenderHandler> GetRenderHandler()
  {
    return handler;
  }

  // CefLifeSpanHandler methods.
  void OnAfterCreated(CefRefPtr<CefBrowser> browser)
  {
    // Must be executed on the UI thread.
    CEF_REQUIRE_UI_THREAD();

    browser_id = browser->GetIdentifier();
  }

  bool DoClose(CefRefPtr<CefBrowser> browser)
  {
    // Must be executed on the UI thread.
    CEF_REQUIRE_UI_THREAD();

    // Closing the main window requires special handling. See the DoClose()
    // documentation in the CEF header for a detailed description of this
    // process.
    if (browser->GetIdentifier() == browser_id)
    {
      // Set a flag to indicate that the window close should be allowed.
      closing = true;
    }

    // Allow the close. For windowed browsers this will result in the OS close
    // event being sent.
    return false;
  }

  void OnBeforeClose(CefRefPtr<CefBrowser> browser)
  {
  }

  void OnLoadEnd(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame, int httpStatusCode)
  {
    std::cout << "OnLoadEnd(" << httpStatusCode << ")" << std::endl;
    loaded = true;
  }

  bool OnLoadError(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame, CefLoadHandler::ErrorCode errorCode, const CefString& failedUrl, CefString& errorText)
  {
    std::cout << "OnLoadError()" << std::endl;
    loaded = true;
  }

  void OnLoadingStateChange(CefRefPtr<CefBrowser> browser, bool isLoading, bool canGoBack, bool canGoForward)
  {
    std::cout << "OnLoadingStateChange()" << std::endl;
  }

  void OnLoadStart(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame)
  {
    std::cout << "OnLoadStart()" << std::endl;
  }

  bool closeAllowed() const
  {
    return closing;
  }

  bool isLoaded() const
  {
    return loaded;
  }

private:
  int browser_id;
  bool closing = false;
  bool loaded = false;
  CefRefPtr<CefRenderHandler> handler;

  IMPLEMENT_REFCOUNTING(BrowserClient);
};

CefBrowserHost::MouseButtonType translateMouseButton(SDL_MouseButtonEvent const& e)
{
  CefBrowserHost::MouseButtonType result = MBT_LEFT;
  switch (e.button)
  {
    case SDL_BUTTON_LEFT:
    case SDL_BUTTON_X1:
      result = MBT_LEFT;
    break;

    case SDL_BUTTON_MIDDLE:
      result = MBT_MIDDLE;
    break;

    case SDL_BUTTON_RIGHT:
    case SDL_BUTTON_X2:
      result = MBT_RIGHT;
    break;
    default:
      result = MBT_LEFT;
  }
  return result;
}

// run. Main thread generates black and silence while stream does not generate AVsamples
bool CefInputEngine::run(const char *_JsonConfig)
{
  // command thread
  std::thread workerThread = std::thread([&] {
    workerThreadFunc();
  });

  UID_ = "TEST_INPUT";

  int64_t frameCount = 0;
  SyncClock clock;

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
  if (!videoFrame)
  {
    notifyError("Could not allocate frame");
    return false;
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

    AVFrameExt frameExt = { videoTimeBase, videoFrame, fieldOrder };

    /* buffer consumer */
    long long frd = 0;
    {
      std::lock_guard<std::mutex> lock(frameBufferMutex_);
      AVFrameExt* frameExtInput = pop();
      if(frameExtInput)
      {
        frameExt.copy(frameExtInput);
      }

      frd = frameDuration(&frameExt);

      /* sm producer */
      sm.write(&frameExt);
    }

    // sync
    clock.sync(frd);
  }

  // join
  if (workerThread.joinable())
  {
    workerThread.join();
  }

  sm.deinit();

  av_frame_free(&videoFrame);
  av_free(videoBuffer);

  return true;
}

void CefInputEngine::workerThreadFunc()
{
  // Initialize CEF
  CefMainArgs args;
  if(CefExecuteProcess(args, nullptr, nullptr) >= 0)
  {
    return;
  }

  CefSettings settings;
  if(!CefInitialize(args, settings, nullptr, nullptr))
  {
    return;
  }

  // Initialize SDL
  if(SDL_Init(SDL_INIT_VIDEO) < 0)
  {
    std::cerr << "SDL could not initialize! SDL_Error: " << SDL_GetError() << std::endl;
    return;
  }

  int width = 800;
  int height = 600;
  SDL_Window *window = SDL_CreateWindow("Render CEF with SDL", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, width, height, SDL_WINDOW_HIDDEN); // SDL_WINDOW_RESIZABLE );
  if(window)
  {
    SDL_Renderer *renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if(renderer)
    {
      SDL_Event e;
      CefRefPtr<RenderHandler> renderHandler = new RenderHandler(renderer, width, height, this);

      // create browser-window
      CefRefPtr<CefBrowser> browser;
      CefRefPtr<BrowserClient> browserClient;

      CefWindowInfo window_info;
      CefBrowserSettings browserSettings;
      // browserSettings.windowless_frame_rate = 60; // 30 is default
      window_info.SetAsWindowless(NULL); // false means no transparency (site background colour)
      browserClient = new BrowserClient(renderHandler);
      browser = CefBrowserHost::CreateBrowserSync(window_info, browserClient.get(), "http://www.google.com", browserSettings, nullptr, nullptr);

      bool shutdown = false;
      bool js_executed = false;
      while(!browserClient->closeAllowed() && !abort_)
      {
        // send events to browser
        while(!shutdown && SDL_PollEvent(&e) != 0)
        {
          switch(e.type)
          {
            case SDL_QUIT:
              shutdown = true;
              browser->GetHost()->CloseBrowser(false);
            break;
            case SDL_KEYDOWN:
            {
              CefKeyEvent event;
              event.modifiers = getKeyboardModifiers(e.key.keysym.mod);
              event.windows_key_code = getWindowsKeyCode(e.key.keysym);

              event.type = KEYEVENT_RAWKEYDOWN;
              browser->GetHost()->SendKeyEvent(event);

              event.type = KEYEVENT_CHAR;
              browser->GetHost()->SendKeyEvent(event);
            }
            break;
            case SDL_KEYUP:
            {
              CefKeyEvent event;
              event.modifiers = getKeyboardModifiers(e.key.keysym.mod);
              event.windows_key_code = getWindowsKeyCode(e.key.keysym);
              event.type = KEYEVENT_KEYUP;
              browser->GetHost()->SendKeyEvent(event);
            }
            break;
            case SDL_WINDOWEVENT:
              switch (e.window.event)
              {
                case SDL_WINDOWEVENT_SIZE_CHANGED:
                  renderHandler->resize(e.window.data1, e.window.data2);
                  browser->GetHost()->WasResized();
                break;
                case SDL_WINDOWEVENT_FOCUS_GAINED:
                  browser->GetHost()->SetFocus(true);
                break;
                case SDL_WINDOWEVENT_FOCUS_LOST:
                  browser->GetHost()->SetFocus(false);
                break;
                case SDL_WINDOWEVENT_HIDDEN:
                case SDL_WINDOWEVENT_MINIMIZED:
                  // browser->GetHost()->SetWindowVisibility(false);
                  browser->GetHost()->WasHidden(true);
                break;
                case SDL_WINDOWEVENT_SHOWN:
                case SDL_WINDOWEVENT_RESTORED:
                  // browser->GetHost()->SetWindowVisibility(true);
                  browser->GetHost()->WasHidden(false);
                break;
                case SDL_WINDOWEVENT_CLOSE:
                  e.type = SDL_QUIT;
                  SDL_PushEvent(&e);
                break;
              }
            break;
            case SDL_MOUSEMOTION:
            {
              CefMouseEvent event;
              event.x = e.motion.x;
              event.y = e.motion.y;
              browser->GetHost()->SendMouseMoveEvent(event, false);
            }
            break;
            case SDL_MOUSEBUTTONUP:
            {
              CefMouseEvent event;
              event.x = e.button.x;
              event.y = e.button.y;
              browser->GetHost()->SendMouseClickEvent(event, translateMouseButton(e.button), true, 1);
            }
            break;
            case SDL_MOUSEBUTTONDOWN:
            {
              CefMouseEvent event;
              event.x = e.button.x;
              event.y = e.button.y;
              browser->GetHost()->SendMouseClickEvent(event, translateMouseButton(e.button), false, 1);
            }
            break;
            case SDL_MOUSEWHEEL:
            {
              int delta_x = e.wheel.x;
              int delta_y = e.wheel.y;
              if(SDL_MOUSEWHEEL_FLIPPED == e.wheel.direction)
              {
                delta_y *= -1;
              }
              else
              {
                delta_x *= -1;
              }
              CefMouseEvent event;
              // browser->GetHost()->SendMouseWheelEvent(event, delta_x, delta_y); // crashes
            }
            break;
          }
        }

        if(!js_executed && browserClient->isLoaded())
        {
          js_executed = true;

          CefRefPtr<CefFrame> frame = browser->GetMainFrame();
          frame->ExecuteJavaScript("alert('ExecuteJavaScript works!');", frame->GetURL(), 0);
        }

        // let browser process events
        CefDoMessageLoopWork();

        // render
        SDL_RenderClear(renderer);

        renderHandler->render();

        // Update screen
        SDL_RenderPresent(renderer);
      }

      browser = nullptr;
      browserClient = nullptr;
      renderHandler = nullptr;

      CefShutdown();

      SDL_DestroyRenderer(renderer);
    }
  }

  SDL_DestroyWindow(window);
  SDL_Quit();
}

bool CefInputEngine::push(AVFrameExt *_frame)
{
  std::lock_guard<std::mutex> lock(frameBufferMutex_);
  frameBuffer_.push_back(_frame);
  if(frameBuffer_.size() > maxBufferSize_)
  {
    AVFrameExt *frame = *frameBuffer_.begin();
    free_AVFrameExt(&frame);
    frameBuffer_.pop_front();
  }
  return true;
}

AVFrameExt * CefInputEngine::pop()
{
  AVFrameExt *frame = nullptr;  
  if(frameBuffer_.size() > 0)
  {
    frame = *frameBuffer_.begin();
  }

  return frame;
}