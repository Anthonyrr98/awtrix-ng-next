#include <unity.h>
#include <map>
#include <string>
#include "core/AtomicFile.h"

struct MemoryFs {
  std::map<std::string, std::string> files;
  bool shortWrite = false, failOpen = false, failRename = false, corrupt = false;
  struct File {
    MemoryFs* fs;
    std::string path;
    bool valid;
    std::size_t pos = 0;
    explicit operator bool() const { return valid; }
    std::size_t write(const uint8_t* data, std::size_t n) {
      if (fs->shortWrite && n) --n;
      fs->files[path].assign(reinterpret_cast<const char*>(data), n);
      if (fs->corrupt && n) fs->files[path][0] ^= 1;
      return n;
    }
    void flush() {}
    void close() {}
    std::size_t size() const { return fs->files.at(path).size(); }
    int read() { return pos < size() ? static_cast<unsigned char>(fs->files[path][pos++]) : -1; }
  };
  File open(const char* path, const char* mode) {
    if (failOpen) return {this, path, false};
    if (*mode == 'w') files[path].clear();
    return {this, path, files.count(path) != 0};
  }
  bool rename(const char* from, const char* to) {
    if (failRename) return false;
    files[to] = files.at(from);
    files.erase(from);
    return true;
  }
  bool remove(const char* path) { return files.erase(path) != 0; }
};

void setUp() {}
void tearDown() {}

static void test_failures_preserve_original_and_allow_retry() {
  for (int failure = 0; failure < 4; ++failure) {
    MemoryFs fs;
    fs.files["/config"] = "old";
    fs.shortWrite = failure == 0;
    fs.failOpen = failure == 1;
    fs.failRename = failure == 2;
    fs.corrupt = failure == 3;
    TEST_ASSERT_FALSE(awtrix::atomicfile::write(fs, "/config", "new"));
    TEST_ASSERT_EQUAL_STRING("old", fs.files.at("/config").c_str());
    fs.shortWrite = fs.failOpen = fs.failRename = fs.corrupt = false;
    TEST_ASSERT_TRUE(awtrix::atomicfile::write(fs, "/config", "new"));
    TEST_ASSERT_EQUAL_STRING("new", fs.files.at("/config").c_str());
    TEST_ASSERT_EQUAL_UINT(1, fs.files.size());
  }
}

static void test_stale_temporary_file_and_empty_content() {
  MemoryFs fs;
  fs.files["/config.tmp"] = "interrupted write";
  TEST_ASSERT_TRUE(awtrix::atomicfile::write(fs, "/config", ""));
  TEST_ASSERT_TRUE(fs.files.at("/config").empty());
  TEST_ASSERT_EQUAL_UINT(1, fs.files.size());
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_failures_preserve_original_and_allow_retry);
  RUN_TEST(test_stale_temporary_file_and_empty_content);
  return UNITY_END();
}
