#include "persistence/RadioStore.h"

#include <LittleFS.h>
#include "persistence/AtomicFile.h"

#include "core/Command.h"
#include "core/CoreEngine.h"

namespace awtrix {
namespace radiostore {

namespace {
constexpr const char* kPath = "/radio.json";
}

bool save(const std::string& json) {
  return atomicfile::write(kPath, json);
}

void load(CoreEngine& engine) {
  File f = LittleFS.open(kPath, "r");
  if (!f) return;
  const String content = f.readString();
  f.close();
  DispatchDetail detail;
  engine.setStations(std::string(content.c_str()), detail);
}

}
}
