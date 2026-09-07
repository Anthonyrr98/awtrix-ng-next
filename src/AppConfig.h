#pragma once

#ifndef AWTRIX_NG_VERSION
#define AWTRIX_NG_VERSION "0.0.0-dev"
#endif
#ifndef AWTRIX_NG_BUILD_ID
#define AWTRIX_NG_BUILD_ID "unknown"
#endif
#ifndef AWTRIX_NG_BUILD_EPOCH
#define AWTRIX_NG_BUILD_EPOCH "0"
#endif

namespace awtrix {
inline constexpr int kMaxPushedApps = 50;
inline constexpr int kCommandQueueDepth = 16;
inline constexpr int kMaxNotifications = 32;
}
