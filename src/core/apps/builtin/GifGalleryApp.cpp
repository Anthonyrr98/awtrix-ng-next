#include "core/apps/builtin/GifGalleryApp.h"

#include <algorithm>
#include <cctype>

#include "core/Settings.h"
#include "media/AssetFile.h"

namespace awtrix {

namespace {

std::string trim(std::string value) {
  while (!value.empty() && std::isspace(static_cast<unsigned char>(value.front()))) value.erase(0, 1);
  while (!value.empty() && std::isspace(static_cast<unsigned char>(value.back()))) value.pop_back();
  if (value.size() > 4 && value.substr(value.size() - 4) == ".gif") value.resize(value.size() - 4);
  return value;
}

std::vector<std::string> selectedNames(const std::vector<std::string>& available,
                                       const std::string& configured) {
  if (configured.empty()) return available;
  std::vector<std::string> out;
  size_t start = 0;
  while (start <= configured.size()) {
    const size_t comma = configured.find(',', start);
    std::string id = trim(configured.substr(start, comma - start));
    if (!id.empty() && std::find(available.begin(), available.end(), id) != available.end() &&
        std::find(out.begin(), out.end(), id) == out.end()) out.push_back(std::move(id));
    if (comma == std::string::npos) break;
    start = comma + 1;
  }
  return out;
}

}

void GifGalleryApp::refresh(int64_t nowMs, const std::string& configured) {
  nextScanMs_ = nowMs + 5000;
  configured_ = configured;
  std::vector<std::string> fresh = selectedNames(media::listGifAssets(), configured);
  if (fresh == names_) return;
  const std::string keep = names_.empty() || current_ >= names_.size() ? "" : names_[current_];
  names_ = std::move(fresh);
  if (names_.empty()) {
    current_ = 0;
    player_.close();
    return;
  }
  const auto at = std::find(names_.begin(), names_.end(), keep);
  current_ = at == names_.end() ? 0 : static_cast<std::size_t>(at - names_.begin());
  if (at == names_.end()) openCurrent();
}

bool GifGalleryApp::openCurrent() {
  player_.close();
  if (names_.empty()) return false;
  for (std::size_t tried = 0; tried < names_.size(); ++tried) {
    if (player_.open(names_[current_]) == GifPlayer::OpenResult::kGood) return true;
    current_ = (current_ + 1) % names_.size();
  }
  return false;
}

void GifGalleryApp::render(Canvas& canvas, const RenderCtx& ctx) {
  const std::string configured = ctx.settings ? ctx.settings->gifGalleryIcons : "";
  if (ctx.nowMs >= nextScanMs_ || configured != configured_) refresh(ctx.nowMs, configured);
  if (!player_.active() && !openCurrent()) return;
  player_.render(canvas, ctx.nowMs);
  if (player_.takeLooped() && !names_.empty()) {
    current_ = (current_ + 1) % names_.size();
    openCurrent();
  }
}

}
