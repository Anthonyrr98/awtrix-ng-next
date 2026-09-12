
#include <LittleFS.h>

#include <algorithm>

#include "media/AssetFile.h"

namespace awtrix {
namespace media {

bool readAsset(const std::string& path, PodBuffer<uint8_t>& out) {
  File f = LittleFS.open(path.c_str(), "r");
  if (!f) return false;
  const size_t n = f.size();
  if (n == 0 || !out.resize(n)) {
    f.close();
    return false;
  }
  f.read(out.data(), n);
  f.close();
  return true;
}

std::vector<std::string> listGifAssets() {
  std::vector<std::string> out;
  File dir = LittleFS.open("/ICONS");
  for (File f = dir.openNextFile(); f; f = dir.openNextFile()) {
    String name = f.name();
    const int slash = name.lastIndexOf('/');
    if (slash >= 0) name = name.substring(slash + 1);
    if (!name.endsWith(".gif") && !name.endsWith(".GIF")) continue;
    name.remove(name.length() - 4);
    out.emplace_back(name.c_str());
  }
  std::sort(out.begin(), out.end());
  return out;
}

}
}
