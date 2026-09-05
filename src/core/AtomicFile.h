#pragma once

#include <cstdint>
#include <string>

namespace awtrix::atomicfile {

// LittleFS replaces the destination atomically on rename. Never remove the old
// file first: an interrupted or short write must leave the last good copy intact.
template <class Filesystem>
bool write(Filesystem& fs, const char* path, const std::string& body) {
  const std::string temporary = std::string(path) + ".tmp";
  auto file = fs.open(temporary.c_str(), "w");
  if (!file) return false;
  const auto written = file.write(reinterpret_cast<const uint8_t*>(body.data()), body.size());
  file.flush();
  file.close();
  auto check = fs.open(temporary.c_str(), "r");
  bool ok = written == body.size() && check && check.size() == body.size();
  for (std::size_t i = 0; ok && i < body.size(); ++i)
    ok = check.read() == static_cast<unsigned char>(body[i]);
  check.close();
  if (ok) ok = fs.rename(temporary.c_str(), path);
  if (!ok) fs.remove(temporary.c_str());
  return ok;
}

}
