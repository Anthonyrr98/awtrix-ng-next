#pragma once

#include <cstddef>
#include <string>
#include <vector>

#include "core/apps/IApp.h"
#include "media/GifPlayer.h"

namespace awtrix {

class GifGalleryApp : public IApp {
 public:
  const std::string& id() const override { return id_; }
  void render(Canvas& canvas, const RenderCtx& ctx) override;

 private:
  void refresh(int64_t nowMs, const std::string& configured);
  bool openCurrent();

  const std::string id_ = "GIFGallery";
  std::vector<std::string> names_;
  std::string configured_;
  GifPlayer player_;
  std::size_t current_ = 0;
  int64_t nextScanMs_ = 0;
};

}
