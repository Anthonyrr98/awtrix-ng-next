#pragma once

#include <string>

namespace awtrix {
class CoreEngine;

namespace apporder {

bool save(const std::string& json);
void load(CoreEngine& engine);

}
}
