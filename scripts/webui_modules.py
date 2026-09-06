"""Keep independently maintained Web UI modules inlined in index.html.

The ESP32 continues to serve one gzip-compressed HTML response.  Modules are
source boundaries for maintainers, not extra requests for the device browser.
"""

import argparse
import os


MODULES = (
    "core", "i18n", "schema", "state", "system-hardware", "shell", "forms", "media",
    "page-dashboard", "page-apps", "page-scripts", "page-system", "page-icons",
    "page-editor", "audio-codec", "page-audio", "page-palettes", "page-log", "boot",
)


def marker(name, side):
    return "/* WEBUI-MODULE:%s %s */" % (name, side)


def paths(project_dir, name, index_path=None):
    index_path = index_path or os.path.join(project_dir, "webui", "index.html")
    module_path = os.path.join(project_dir, "webui", "src", name + ".js")
    return index_path, module_path


def rendered(name, module_path):
    with open(module_path, "r", encoding="utf-8") as handle:
        body = handle.read().strip()
    return "%s\n%s\n%s" % (marker(name, "BEGIN"), body, marker(name, "END"))


def inject(project_dir, index_path=None, write=True):
    index_path = index_path or os.path.join(project_dir, "webui", "index.html")
    with open(index_path, "r", encoding="utf-8") as handle:
        html = handle.read()
    updated = html
    previous = -1
    for name in MODULES:
        _, module_path = paths(project_dir, name, index_path)
        begin, end = marker(name, "BEGIN"), marker(name, "END")
        if updated.count(begin) != 1 or updated.count(end) != 1:
            raise RuntimeError("webui: %s module must have exactly one marker pair" % name)
        start, finish = updated.find(begin), updated.find(end)
        if start <= previous or finish < start:
            raise RuntimeError("webui: %s module markers are missing from webui/index.html" % name)
        finish += len(end)
        updated = updated[:start] + rendered(name, module_path) + updated[finish:]
        previous = updated.find(end, start) + len(end)
    if updated == html:
        return False
    if write:
        with open(index_path, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(updated)
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-dir", default=os.path.dirname(os.path.dirname(__file__)))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = inject(args.project_dir, write=not args.check)
    if args.check and changed:
        raise SystemExit("webui: index.html has stale source modules; regenerate it")
    print("webui: source modules %s" % ("regenerated" if changed else "current"))


if __name__ == "__main__":
    main()
