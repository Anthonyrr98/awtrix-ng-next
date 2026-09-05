#pragma once

#include <string>

namespace awtrix {

class CoreEngine;

namespace radiostore {

bool save(const std::string& json);
void load(CoreEngine& engine);

}
}
