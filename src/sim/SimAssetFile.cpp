
#include <cstring>
#include <algorithm>
#include <filesystem>

#include "media/AssetFile.h"
#include "sim/SimStore.h"

namespace awtrix {
namespace media {

// Host half of the asset reader; the device half in media/AssetFileDevice.cpp reads from SPIFFS.
bool readAsset(const std::string& path, PodBuffer<uint8_t>& out) {
  std::string bytes;
  if (!sim::readFile(sim::hostPath(path), bytes) || bytes.empty()) return false;
  if (!out.resize(bytes.size())) return false;
  std::memcpy(out.data(), bytes.data(), bytes.size());
  return true;
}

std::vector<std::string> listGifAssets() {
  std::vector<std::string> out;
  std::error_code ec;
  for (const auto& e : std::filesystem::directory_iterator(
           std::filesystem::u8path(sim::hostPath("/ICONS")), ec)) {
    if (!e.is_regular_file()) continue;
    std::string ext = e.path().extension().u8string();
    std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
    if (ext == ".gif") out.push_back(e.path().stem().u8string());
  }
  std::sort(out.begin(), out.end());
  return out;
}

}
}
