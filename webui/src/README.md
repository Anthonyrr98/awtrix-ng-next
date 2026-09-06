# Web UI source modules

These files are maintenance boundaries for the embedded Web UI. They are not
served as separate browser resources: `scripts/webui_modules.py` inlines them
into marked regions of `webui/index.html`, and the firmware then minifies and
gzips that self-contained page.

Current modules:

- Foundation: `core.js`, `i18n.js`, `schema.js`, `state.js`,
  `system-hardware.js`, `shell.js`, `forms.js` and `media.js`.
- Feature pages: `page-dashboard.js`, `page-apps.js`, `page-scripts.js`,
  `page-system.js` (Display, System and maintenance), `page-icons.js`,
  `page-editor.js`, `page-audio.js`, `page-palettes.js` and `page-log.js`.
- Supporting runtime: `audio-codec.js` for RTTTL parsing and `boot.js` for
  final startup.

`page-scripts.js` owns the generated Berry API and example catalog regions.
Their generators update that module before it is inlined into the page.

After editing a module, run:

```bash
python scripts/webui_modules.py
```

`python scripts/webui_modules.py --check` is read-only and is enforced by CI.
Keep feature pages in `index.html` until their dependencies form a clean,
tested boundary; move them one at a time rather than introducing a framework or
a runtime module loader.
