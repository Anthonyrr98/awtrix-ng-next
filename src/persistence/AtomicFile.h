#pragma once
#include <LittleFS.h>
#include "core/AtomicFile.h"

namespace awtrix::atomicfile {
inline bool write(const char* path, const std::string& body) {
  return write(LittleFS, path, body);
}
}
