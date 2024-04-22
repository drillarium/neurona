#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <fstream>
#include "base64.h"
#include "notifier.h"

using namespace std::chrono_literals;

/* engine */
std::string getVersion();
void * createEngine();
bool destroyEngine(void **_engine);
std::string getJsonSchema();
bool runEngine(void *_engine, const char *_JsonConfig);
bool abortEngine(void *_engine);
bool putCommand(void *_engine, const char *_JsonCommand);

// params
std::string configFile;   // the config file
std::string configJson;   // the config Json
bool version = false;     // print version and exit
bool schema = false;      // print schema and exit
bool debug = false;

#include <Windows.h> // exe path
#include <direct.h>  // _chdir
void changeWorkingFolder()
{
  HMODULE hModule = GetModuleHandle(NULL);
  if(!hModule) return;

  char ownPth[MAX_PATH] = { '\0' };
  GetModuleFileNameA(hModule, ownPth, (sizeof(ownPth)));
  std::string s(ownPth);
  s = s.substr(0, s.find_last_of("\\/"));
  int res = _chdir(s.c_str());
}

// readParams
void readParams(int argc, char *argv[])
{
  for(int i = 1; i < argc; i++)
  {
    if(!_stricmp(argv[i], "-c") && i < argc - 1)
    {
      configFile = argv[++i];
    }
    else if(!_stricmp(argv[i], "-j") && i < argc - 1)
    {
      configJson = argv[++i];
    }
    else if(!_stricmp(argv[i], "-v"))
    {
      version = true;
    }
    else if(!_stricmp(argv[i], "-s"))
    {
      schema = true;
    }
    else if (!_stricmp(argv[i], "-d"))
    {
      debug = true;
    }
  }
}

// engine
void *engine = nullptr;

// main
int main(int argc, char * argv[])
{
  // read params
  readParams(argc, argv);

  // invoked from Launcher
  if(!debug)
  {
    changeWorkingFolder();
  }

  if(version)
  {
    std::string ver = getVersion();
    std::cout << ver.c_str() << std::endl;
  }
  else if(schema)
  {
    std::string schema = getJsonSchema();
    std::cout << schema.c_str() << std::flush;    
  }
  else
  {
    engine = createEngine();
    if(engine)
    {
      bool exit = false;

      // command thread
      std::thread workerThread = std::thread([&] {        
        while(!exit)
        {
          std::string userInput;
          std::getline(std::cin, userInput);
          if(!userInput.compare("exit"))
          {
            abortEngine(engine);
            notifyInfo("Exit command received");
          }
          else
          {
            std::string cmd = base64_decode(userInput);
            notifyInfo("Command %s received", cmd.c_str());
            putCommand(engine, cmd.c_str());
          }

          std::this_thread::sleep_for(1ms);
        }
      });

      std::string JsonConfig;
      if(configFile.length() > 0)
      {
        std::ifstream file(configFile);
        if(!file.is_open())
        {          
          notifyError("Error opening configuration file");
        }
        else
        {
          file.seekg(0, std::ios::end);
          size_t size = file.tellg();
          std::string buffer(size, ' ');
          file.seekg(0);
          file.read(&buffer[0], size);
          file.close();
          JsonConfig = buffer;
        }
      }
      else
      {
        JsonConfig = base64_decode(configJson);
      }
      
      // run engine
      runEngine(engine, JsonConfig.c_str());

      // exit flag
      exit = true;

      // destroy engine
      destroyEngine(&engine);

      //
      workerThread.join();
    }   
  }

  std::this_thread::sleep_for(1s);
  
  return 0;
}
