// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#ifndef CEF_TESTS_CEFSIMPLE_SIMPLE_APP_H_
#define CEF_TESTS_CEFSIMPLE_SIMPLE_APP_H_

#include "include/cef_app.h"
#include <functional>

// Implement application-level callbacks for the browser process.
class SimpleApp : public CefApp, public CefBrowserProcessHandler {
 public:
  SimpleApp(const std::function<void(const void *, int, int)>& func);

  // CefApp methods:
  CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override {
    return this;
  }

  // CefBrowserProcessHandler methods:
  void OnContextInitialized() override;
  CefRefPtr<CefClient> GetDefaultClient() override;

protected:
  std::function<void(const void*, int, int)> func_;

 private:
  // Include the default reference counting implementation.
  IMPLEMENT_REFCOUNTING(SimpleApp);
};

#endif  // CEF_TESTS_CEFSIMPLE_SIMPLE_APP_H_