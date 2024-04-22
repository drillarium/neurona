#include <string>
#include <thread>
#include <chrono>
#include "engine.h"
#include "notifier.h"
#include "sync_clock.h"
#include "SDLRenderer.h"
#include "FFMPEG_utils.h"

using namespace std::chrono_literals;

const char APP_VERSION_STR[] = "0.0.1";

const char UID[] = "uid";
const char SRCUID[] = "src_uid";
const char NAME[] = "name";
const char AUTOSTART[] = "autostart";
const char PREVIEW[] = "preview";
const char WIDTH[] = "width";
const char HEIGHT[] = "height";
const char FR[] = "frame_rate";
const char FORMAT[] = "format";
const char FIELDO[] = "field_order";
const char EXTRA[] = "extra";

// getJsonSchema
std::string getJsonSchema()
{
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);

  writer.StartObject();  // {

  writer.Key("type");
  writer.String("object");

  // required
  writer.Key("required");
  writer.StartArray(); // [
  writer.String("uid");
  writer.String("name");
  writer.EndArray(); // ] // required

  writer.Key("properties");
  writer.StartObject(); // {

  // uid
  writer.Key(UID);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("UID");
  writer.Key("type");
  writer.String("string");
  writer.Key("readOnly");
  writer.Bool(true);
  writer.EndObject(); // } // uid

  // srcuid
  writer.Key(SRCUID);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("SOURCE UID");
  writer.Key("type");
  writer.String("string");
  writer.Key("readOnly");
  writer.Bool(true);
  writer.EndObject(); // } // srcuid

  // name
  writer.Key(NAME);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Name");
  writer.Key("type");
  writer.String("string");
  writer.EndObject(); // } // name

  // autostart
  writer.Key(AUTOSTART);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("AutoStart");
  writer.Key("type");
  writer.String("boolean");
  writer.Key("default");
  writer.Bool(true);
  writer.EndObject(); // } // autostart

  // preview
  writer.Key(PREVIEW);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Preview");
  writer.Key("type");
  writer.String("boolean");
  writer.Key("default");
  writer.Bool(false);
  writer.EndObject(); // } // preview

  // width
  writer.Key(WIDTH);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Width");
  writer.Key("type");
  writer.String("integer");
  writer.Key("default");
  writer.Int(1920);
  writer.EndObject(); // } // width

  // height
  writer.Key(HEIGHT);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Height");
  writer.Key("type");
  writer.String("integer");
  writer.Key("default");
  writer.Int(1080);
  writer.EndObject(); // } // height

  // format
  writer.Key(FORMAT);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Format");
  writer.Key("type");
  writer.String("string");
  writer.Key("default");
  writer.String("RGB24");
  writer.EndObject(); // } // format

  // framerate
  writer.Key(FR);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Frame Rate");
  writer.Key("type");
  writer.String("string");
  writer.Key("default");
  writer.String("25/1");
  writer.EndObject(); // } // framerate

  // fieldorder
  writer.Key(FIELDO);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Field Order");
  writer.Key("type");
  writer.String("enum");
  writer.Key("default");
  writer.StartArray(); // [
  std::list<std::string> l = { "Progressive", "Field_TT", "Field_BB", "Field_TB", "Field_BT"};
  for(auto it = l.begin(); it != l.end(); it++)
  {
    writer.String(it->c_str());
  }
  writer.EndArray();
  writer.EndObject(); // } // fieldorder

  // extra
  writer.Key(EXTRA);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Extra Params");
  writer.Key("description");
  writer.String("param1='value' param2='value' ... <space> separated params");
  writer.Key("type");
  writer.String("string");
  writer.EndObject(); // } // extra

  writer.EndObject(); // } // properties

  writer.EndObject(); // }

  return buffer.GetString();
}

// getVersion
std::string getVersion()
{
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
  writer.StartObject();  // {

  writer.Key("engine");
  writer.String("FFMPEGOutputEngine");

  writer.Key("type");
  writer.String("input");

  writer.Key("version");
  writer.String(APP_VERSION_STR);

  writer.Key("FFMPEGVersion");
  unsigned verInt = avutil_version();
  std::ostringstream versionComponents;
  versionComponents << AV_VERSION_MAJOR(verInt) << "." << AV_VERSION_MINOR(verInt) << "." << AV_VERSION_MICRO(verInt);
  writer.String(versionComponents.str().c_str());

  writer.Key("FFMPEGCompiledVersion");
  std::ostringstream compiledVersionComponents;
  compiledVersionComponents << LIBAVUTIL_VERSION_MAJOR << "." << LIBAVUTIL_VERSION_MINOR << "." << LIBAVUTIL_VERSION_MICRO;
  writer.String(compiledVersionComponents.str().c_str());

  writer.Key("FFMPEGLicense");
  writer.String(avutil_license());

  writer.EndObject(); // }

  return buffer.GetString();
}

// createEngine
void * createEngine()
{
  return new FFMPEGOutputEngine();
}

// destroyEngine
bool destroyEngine(void **_engine)
{
  if(!*_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(*_engine);
  delete engine;
  *_engine = nullptr;

  return true;
}

// abortEngine
bool abortEngine(void *_engine)
{
  if(!_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(_engine);
  return engine->abort();
}

// putCommand
bool putCommand(void *_engine, const char *_JsonCommand)
{
  if(!_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(_engine);
  return engine->putCommand(_JsonCommand);
}

// runEngine
bool runEngine(void *_engine, const char *_JsonConfig)
{
  if(!_engine) return false;
  
  FFMPEGOutputEngine *engine = static_cast<FFMPEGOutputEngine *>(_engine);
  return engine->run(_JsonConfig);
}

extern "C" {
#include <libavutil/imgutils.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
#include <libavutil/time.h>
}

// FFMPEGOutputEngine
FFMPEGOutputEngine::FFMPEGOutputEngine()
{

}

// FFMPEGOutputEngine
FFMPEGOutputEngine::~FFMPEGOutputEngine()
{

}

// abort
bool FFMPEGOutputEngine::abort()
{
  abort_ = true;
  return true;
}

// putCommand
bool FFMPEGOutputEngine::putCommand(const char *_JsonCommand)
{
  return true;
}


bool FFMPEGOutputEngine::loadConfiguration(const char *_JsonConfig)
{
  rapidjson::Document d;
  d.Parse(_JsonConfig);
  if(d.HasParseError())
  {
    notifyError("Error parsing configuration: %s", _JsonConfig);
    return false;
  }

  if(!d.IsObject())
  {
    notifyError("Invalid configuration: %s", _JsonConfig);
    return false;
  }

  if(d.HasMember(UID) && d[UID].IsString())
  {
    UID_ = d[UID].GetString();
  }

  if(d.HasMember(SRCUID) && d[SRCUID].IsString())
  {
    srcUID_ = d[SRCUID].GetString();
  }

  if(d.HasMember(WIDTH) && d[WIDTH].IsInt())
  {
    width_ = d[WIDTH].GetInt();
  }

  if(d.HasMember(HEIGHT) && d[HEIGHT].IsInt())
  {
    height_ = d[HEIGHT].GetInt();
  }

  if(d.HasMember(FR) && d[FR].IsString())
  {
    std::string fr_str = d[FR].GetString();
    frameRate_ = parseFR(fr_str.c_str());
  }

  if(d.HasMember(FORMAT) && d[FORMAT].IsString())
  {
    std::string format_str = d[FORMAT].GetString();
    pixelFormat_ = strig2format(format_str.c_str());
  }  

  if(d.HasMember(FIELDO) && d[FIELDO].IsString())
  {
    std::string fieldorder_str = d[FIELDO].GetString();
    fieldOrder_ = strig2fieldorder(fieldorder_str.c_str());
  }

  if(d.HasMember(PREVIEW) && d[PREVIEW].IsBool())
  {
    previewWindow_ = d[PREVIEW].GetBool();
  }

  if(d.HasMember(EXTRA) && d[EXTRA].IsString())
  {
    std::string extraParams = d[EXTRA].GetString();
    std::istringstream iss(extraParams);
    std::string token;
    while(iss >> token)
    {
      size_t equalsPos = token.find('=');
      if(equalsPos != std::string::npos)
      {
        std::string key = token.substr(0, equalsPos);
        std::string value = token.substr(equalsPos + 2, token.size() - equalsPos - 3);
        extraParams_[key] = value;
      }
    }

    if(extraParams_.find("timeout") != extraParams_.end())
    {
      timeoutOpen_ = std::stoi(extraParams_["timeout"]);
    }
  }

  return true;
}

// run. Main thread generates black and silence while stream does not generate AVsamples
bool FFMPEGOutputEngine::run(const char *_JsonConfig)
{
  // print version info
  notifyInfo("Version: %s", getVersion().c_str());
  notifyInfo("Schema: %s", getJsonSchema().c_str());
  notifyInfo("Configuration: %s", _JsonConfig);

  // load configuration
  if(!loadConfiguration(_JsonConfig))
  {
    notifyError("Could not load configuration");
    return false;
  }

  // video back (format from configuration)
  AVRational videoTimeBase = { frameRate_.den, frameRate_.num };

  // audio silence (TODO: format from configuration)
  int audioSampleRate = 44100;
  AVCodecID audioCodecID = AV_CODEC_ID_PCM_S16LE;
  int channels = 2;
  AVSampleFormat sampleFmt = AV_SAMPLE_FMT_S16;
  int audioSamplesPerFrame = (int) (audioSampleRate / (double) (videoTimeBase.den / videoTimeBase.num));
  AVRational audioTimeBase = { 1, audioSampleRate };

  // AVFrame
  AVFrame *videoFrame = av_frame_alloc();
  if(!videoFrame)
  {
    notifyError("Could not allocate frame");
    return false;
  }

  videoFrame->width = width_;
  videoFrame->height = height_;
  videoFrame->format = pixelFormat_;

  AVFrame *audioFrame = av_frame_alloc();
  if(!audioFrame)
  {
    av_frame_free(&videoFrame);
    notifyError("Could not allocate frame");
    return false;
  }

  // video buffer
  int videoBufferSize = av_image_get_buffer_size((AVPixelFormat) videoFrame->format, videoFrame->width, videoFrame->height, 1);
  uint8_t *videoBuffer = (uint8_t *) av_malloc(videoBufferSize);
  av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, (AVPixelFormat) videoFrame->format, videoFrame->width, videoFrame->height, 1);

  // audio buffer
  int audioBufferSize = av_samples_get_buffer_size(nullptr, channels, audioSamplesPerFrame, sampleFmt, 0);
  uint8_t *audioBuffer = (uint8_t *) av_malloc(audioBufferSize);
  av_samples_fill_arrays(audioFrame->data, audioFrame->linesize, audioBuffer, channels, audioSamplesPerFrame, sampleFmt, 0);

  // frame count and clock
  int64_t frameCount = 0;
  SyncClock clock;

  // renderer
  SDLRenderer renderer;
  renderer.init(UID_.c_str());

  while(!abort_)
  {
    // consumer
    bool initOk = smc_.init(srcUID_.c_str(), timeoutOpen_ * 1000);
    if(initOk)
    {
      while(smc_.opened())
      {
        AVFrameExt *frame = smc_.read();
        if(!frame)
        {
          break;
        }

        // preview
        if(previewWindow_ && (frame->mediaType == AVMEDIA_TYPE_VIDEO))
        {
          renderer.render(frame->AVFrame);
        }

        free_AVFrameExt(&frame);      
      }
      smc_.deinit();
    }

    // draw video
    drawBackground(videoBuffer, videoFrame->width, videoFrame->height, videoFrame->linesize[0], (AVPixelFormat) videoFrame->format);
    drawLine(videoBuffer, videoFrame->width, videoFrame->height, videoFrame->linesize[0], (AVPixelFormat)videoFrame->format, frameCount, videoTimeBase);
    videoFrame->pts = frameCount;
    videoFrame->duration = av_rescale_q(1, videoTimeBase, videoTimeBase);

    // silence audio
    silenceAudio(audioBuffer, audioBufferSize);
    audioFrame->pts = frameCount * audioTimeBase.num;
    audioFrame->duration = av_rescale_q(audioSamplesPerFrame, audioTimeBase, audioTimeBase);

    frameCount++;

    AVFrameExt frameExt = { videoTimeBase, fieldOrder_, AVMEDIA_TYPE_VIDEO, 0, videoFrame };

    // duration
    long long frd = frameDuration(&frameExt);

    // preview
    if(previewWindow_)
    {
      renderer.render(frameExt.AVFrame);
    }

    // sync    
    clock.sync(frd);
  }

  renderer.cleanUp();

  smc_.deinit();

  // black video
  av_frame_free(&videoFrame);
  av_free(videoBuffer);

  // silence audio
  av_frame_free(&audioFrame);
  av_free(audioBuffer);

  return true;
}
