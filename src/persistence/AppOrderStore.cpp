#include "persistence/AppOrderStore.h"

#include <LittleFS.h>
#include "persistence/AtomicFile.h"

#include "core/CoreEngine.h"

namespace awtrix {
namespace apporder {

bool save(const std::string& json) {
  return atomicfile::write("/apploop.json", json);
}

void load(CoreEngine& engine) {
  File f = LittleFS.open("/apploop.json", "r");
  if (!f) return;
  const String content = f.readString();
  f.close();
  engine.setAppOrder(std::string(content.c_str()));
}

}
}
