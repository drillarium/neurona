#include <string>
#include <thread>
#include <chrono>
#include <sstream>
#include <iostream>
#include <iomanip>
#include "engine.h"
#include "notifier.h"
#include "sync_clock.h"
#include "SDLRenderer.h"
#include "FFMPEG_sm_producer.h"
#include "FFMPEG_utils.h"

using namespace std::chrono_literals;

const char APP_VERSION_STR[] = "0.0.1";

const char UID[] = "id";
const char NAME[] = "name";
const char TYPE[] = "type";
const char AUTOSTART[] = "autostart";
const char PREVIEW[] = "preview";
const char WIDTH[] = "width";
const char HEIGHT[] = "height";
const char FR[] = "frame_rate";
const char FORMAT[] = "format";
const char FIELDO[] = "field_order";
const char URL[] = "url";
const char EXTRA[] = "extra";

// getJsonSchema
std::string getJsonSchema()
{
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);

  writer.StartObject();  // {

  // 
  writer.Key("BlackMagic (SDI)");
  writer.StartObject(); // {

  writer.Key("schema");
  writer.StartObject(); // {

  writer.Key("type");
  writer.String("object");

  writer.Key("title");
  writer.String("BlackMagic (SDI)");

  writer.Key("description");
  writer.String("");

  // required
  writer.Key("required");
  writer.StartArray(); // [
  writer.String(UID);
  writer.String(NAME);
  writer.EndArray(); // ] // required

  writer.Key("properties");
  writer.StartObject(); // {

  // uid
  writer.Key(UID);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("ID");
  writer.Key("type");
  writer.String("number");
  writer.Key("readOnly");
  writer.Bool(true);
  writer.EndObject(); // } // id

  // name
  writer.Key(NAME);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Name");
  writer.Key("type");
  writer.String("string");
  writer.EndObject(); // } // name

  // type
  writer.Key(TYPE);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Type");
  writer.Key("type");
  writer.String("string");
  writer.Key("default");
  writer.String("BlackMagic (SDI)");
  writer.Key("readOnly");
  writer.Bool(true);
  writer.EndObject(); // } // type

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
  writer.String("string");
  writer.Key("default");
  writer.String("Progressive");
  writer.Key("enum");
  writer.StartArray(); // [
  std::list<std::string> l = { "Progressive", "Field_TT", "Field_BB", "Field_TB", "Field_BT"};
  for(auto it = l.begin(); it != l.end(); it++)
  {
    writer.String(it->c_str());
  }
  writer.EndArray();
  writer.EndObject(); // } // fieldorder

  // url
  writer.Key(URL);
  writer.StartObject(); // {
  writer.Key("title");
  writer.String("Url");
  writer.Key("type");
  writer.String("string");
  writer.EndObject(); // } // url

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

  writer.EndObject(); // } // scchema

  writer.EndObject(); // } // "BlackMagic (SDI)"

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
  writer.String("FFMPEGInputEngine");

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
  return new FFMPEGInputEngine();
}

// destroyEngine
bool destroyEngine(void **_engine)
{
  if(!*_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(*_engine);
  delete engine;
  *_engine = nullptr;

  return true;
}

// abortEngine
bool abortEngine(void *_engine)
{
  if(!_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(_engine);
  return engine->abort();
}

// putCommand
bool putCommand(void *_engine, const char *_JsonCommand)
{
  if(!_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(_engine);
  return engine->putCommand(_JsonCommand);
}

// runEngine
bool runEngine(void *_engine, const char *_JsonConfig)
{
  if(!_engine) return false;
  
  FFMPEGInputEngine *engine = static_cast<FFMPEGInputEngine *>(_engine);
  return engine->run(_JsonConfig);
}

// FFMPEGInputEngine
FFMPEGInputEngine::FFMPEGInputEngine()
{

}

// FFMPEGInputEngine
FFMPEGInputEngine::~FFMPEGInputEngine()
{

}

// abort
bool FFMPEGInputEngine::abort()
{
  abort_ = true;
  return true;
}

// putCommand
bool FFMPEGInputEngine::putCommand(const char *_JsonCommand)
{
  rapidjson::Document d;
  d.Parse(_JsonCommand);
  if(d.HasParseError())
  {
    notifyError("Error parsing command: %s", _JsonCommand);
    return false;
  }

  if(!d.IsObject())
  {
    notifyError("Invalid configuration: %s", _JsonCommand);
    return false;
  }

  const char cmd[] = "command";
  const char params[] = "params";
  if(d.HasMember(cmd) && d[cmd].IsString())
  {
    std::string command = d[cmd].GetString();
    if(!command.compare("load"))
    {
      if(d.HasMember(params) && d[params].IsObject())
      {
        auto p = d[params].GetObject();
        if(p.HasMember(URL) && p[URL].IsString())
        {
          url_ = p[URL].GetString();
          openReader_ = true;
          notifyInfo("New command received: %s %s", command.c_str(), url_.c_str());
        }
      }
    }
  }

  return true;
}

bool FFMPEGInputEngine::loadConfiguration(const char *_JsonConfig)
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

  if(d.HasMember(URL) && d[URL].IsString())
  {
    url_ = d[URL].GetString();
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
bool FFMPEGInputEngine::run(const char *_JsonConfig)
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

  // worker thread
  std::thread workerThread = std::thread([&] {
    workerThreadFunc();
  });

  // video back (format from configuration)
  AVRational videoTimeBase = { frameRate_.den, frameRate_.num };

  // audio silence (TODO: format from configuration)
  int audioSampleRate = 44100;
  int channels = 2;
  AVSampleFormat sampleFmt = AV_SAMPLE_FMT_S16;
  int audioSamplesPerFrame = (int)(audioSampleRate / (double)(videoTimeBase.den / videoTimeBase.num));
  AVRational audioTimeBase = { 1, audioSampleRate };

  // AVFrame (black)
  AVFrame* videoFrame = av_frame_alloc();
  if(!videoFrame)
  {
    notifyError("Could not allocate frame");
    return false;
  }

  videoFrame->width = width_;
  videoFrame->height = height_;
  videoFrame->format = pixelFormat_;

  // AVFrame (silence)
  AVFrame* audioFrame = av_frame_alloc();
  if(!audioFrame)
  {
    av_frame_free(&videoFrame);
    notifyError("Could not allocate frame");
    return false;
  }

  // video buffer
  int videoBufferSize = av_image_get_buffer_size((AVPixelFormat) videoFrame->format, videoFrame->width, videoFrame->height, 1);
  uint8_t* videoBuffer = (uint8_t*)av_malloc(videoBufferSize);
  av_image_fill_arrays(videoFrame->data, videoFrame->linesize, videoBuffer, (AVPixelFormat) videoFrame->format, videoFrame->width, videoFrame->height, 1);

  // audio buffer
  int audioBufferSize = av_samples_get_buffer_size(nullptr, channels, audioSamplesPerFrame, sampleFmt, 0);
  uint8_t* audioBuffer = (uint8_t*)av_malloc(audioBufferSize);
  av_samples_fill_arrays(audioFrame->data, audioFrame->linesize, audioBuffer, channels, audioSamplesPerFrame, sampleFmt, 0);

  // frame count and clock
  int64_t frameCount = 0;
  SyncClock clock;

  // renderer
  SDLRenderer renderer;
  std::string title = "UID: \"" + UID_ + "\", URL: \"" + url_ + "\"";
  renderer.init(title.c_str(), 320, 240, 12, previewWindow_);

  // sm protocol
  FFMPEGSharedMemoryProducer sm;
  sm.init(UID_.c_str());

  while(!abort_)
  {
    if(!openReader_)
    {
      AVPacket *packet = av_packet_alloc();
      AVFrame *frame = av_frame_alloc();

      while(av_read_frame(formatCtx_, packet) >= 0 && !abort_)
      {
        if( (packet->stream_index >= 0) && (packet->stream_index < codecCtxs_.size()) )
        {
          AVCodecContext *codecCtx = codecCtxs_[packet->stream_index];
          if(codecCtx)
          {
            // Decode video frame
            int ret = avcodec_send_packet(codecCtx, packet);
            if(ret < 0)
            {
              notifyError("Error sending packet for decoding: %s", url_.c_str());
              break;
            }

            while(ret >= 0)
            {
              ret = avcodec_receive_frame(codecCtx, frame);
              if(ret == AVERROR(EAGAIN) || ret == AVERROR_EOF)
              {
                break;
              }
              else if(ret < 0)
              {
                notifyError("Error during decoding: %s", url_.c_str());
                break;
              }

              // frame
              AVFrameExt frameExt = { formatCtx_->streams[packet->stream_index]->time_base,
                                      formatCtx_->streams[packet->stream_index]->codecpar->field_order,
                                      formatCtx_->streams[packet->stream_index]->codecpar->codec_type, 
                                      packet->stream_index, frame, nullptr };
              // sm producer
              sm.write(&frameExt);

              // preview
              if(previewWindow_ && (formatCtx_->streams[packet->stream_index]->codecpar->codec_type == AVMEDIA_TYPE_VIDEO) )
              {
                renderer.render(frameExt.AVFrame);
              }
            }
          }
          else
          {
            AVFrameExt frameExt = { formatCtx_->streams[packet->stream_index]->time_base,
                                    formatCtx_->streams[packet->stream_index]->codecpar->field_order,
                                    formatCtx_->streams[packet->stream_index]->codecpar->codec_type,
                                    packet->stream_index, nullptr, packet };          
            // sm producer
            sm.write(&frameExt);
          }
        }      
        av_packet_unref(packet);
      }    
      av_packet_free(&packet);
      av_frame_free(&frame);
      openReader_ = true;
    }
    else
    {
      // draw video
      drawBackground(videoBuffer, videoFrame->width, videoFrame->height, videoFrame->linesize[0], (AVPixelFormat) videoFrame->format);
      drawLine(videoBuffer, videoFrame->width, videoFrame->height, videoFrame->linesize[0], (AVPixelFormat) videoFrame->format, frameCount, videoTimeBase);
      videoFrame->pts = frameCount;
      videoFrame->duration = av_rescale_q(1, videoTimeBase, videoTimeBase);

      // silence audio
      silenceAudio(audioBuffer, audioBufferSize);
      audioFrame->pts = frameCount * audioTimeBase.num;
      audioFrame->duration = av_rescale_q(audioSamplesPerFrame, audioTimeBase, audioTimeBase);

      // frame count
      frameCount++;

      // internal struct
      AVFrameExt frameExt = { videoTimeBase, fieldOrder_, AVMEDIA_TYPE_VIDEO, 0, videoFrame };

      // duration
      long long frd = frameDuration(&frameExt);

      // sm producer
      sm.write(&frameExt);

      // preview
      if(previewWindow_)
      {
        renderer.render(frameExt.AVFrame);
      }

      // sync    
      clock.sync(frd);
    }
  }

  // render
  renderer.cleanUp();

  // black video
  av_frame_free(&videoFrame);
  av_free(videoBuffer);

  // silence audio
  av_frame_free(&audioFrame);
  av_free(audioBuffer);

  // shared memory
  sm.deinit();

  // worker thread
  if(workerThread.joinable())
  {
    workerThread.join();
  }

  return true;
}

void FFMPEGInputEngine::workerThreadFunc()
{
  openReader_ = true;
  bool notifyErr = true;

  while(!abort_)
  {
    if(openReader_)
    {
      // close previously
      for(int i = 0; i < codecCtxs_.size(); i++)
      {
        AVCodecContext *codecCtx = codecCtxs_[i];
        avcodec_free_context(&codecCtx);
      }
      codecCtxs_.clear();

      // close previously
      avformat_close_input(&formatCtx_);

      // Open input file and allocate format context
      AVDictionary* dict = nullptr;
      std::string timeout = std::to_string(timeoutOpen_ * 1000000);
      av_dict_set(&dict, "timeout", timeout.c_str(), 0);
      if(avformat_open_input(&formatCtx_, url_.c_str(), nullptr, &dict) < 0)
      {
        av_dict_free(&dict);
        if(notifyErr)
        {
          notifyError("Could not open input file: %s", url_.c_str());
          notifyErr = false;
        }
      }
      else
      {
        // Retrieve stream information
        if(avformat_find_stream_info(formatCtx_, nullptr) < 0)
        {
          av_dict_free(&dict);
          if(notifyErr)
          {
            notifyError("Could not find stream information: %s", url_.c_str());
            notifyErr = false;
          }
        }
        else
        {
          // iterate stream      
          for(unsigned int i = 0; i < formatCtx_->nb_streams; i++)
          {
            // Get codec parameters and codec context
            AVCodecParameters *codecPar = formatCtx_->streams[i]->codecpar;
            const AVCodec *codec = avcodec_find_decoder(codecPar->codec_id);
            AVCodecContext *codecCtx = avcodec_alloc_context3(codec);
            avcodec_parameters_to_context(codecCtx, codecPar);

            // Open codec
            if(avcodec_open2(codecCtx, codec, nullptr) < 0)
            {
              avcodec_free_context(&codecCtx);
              notifyWarning("Could not open codec %d: %s", i, url_.c_str());
            }
            
            // could be null case not supported  
            codecCtxs_.push_back(codecCtx);
          }
          
          av_dict_free(&dict);
          notifyInfo("Stream opened: %s", url_.c_str());
          openReader_ = false;       
          notifyErr = true;
        }
      }
    } 
 
    if(!openReader_)
    {
      std::this_thread::sleep_for(1ms);
    }
  }

  // close previously
  for(int i = 0; i < codecCtxs_.size(); i++)
  {
    AVCodecContext *codecCtx = codecCtxs_[i];
    avcodec_free_context(&codecCtx);
  }
  codecCtxs_.clear();

  // close previously
  avformat_close_input(&formatCtx_);
}
