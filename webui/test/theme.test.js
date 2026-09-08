/* Global theme registry, token overrides and persistence. */
const { boot, flush } = require('./harness');

let failures = 0;
function check(value, message) {
  if (value) console.log('  PASS: ' + message);
  else { console.log('  FAIL: ' + message); failures++; }
}

(async () => {
  console.log('theme: public registry and global design tokens');
  const { window } = await boot();
  const api = window.AWTRIX_THEMES;
  check(!!api && api.current() === 'dark', 'the public theme API starts from the preferred theme');
  check(api.all().some(theme => theme.id === 'liquid-glass-white') &&
        api.all().some(theme => theme.id === 'liquid-glass-color') &&
        api.all().some(theme => theme.id === 'pixel-frame') &&
        api.all().some(theme => theme.id === 'pixel-frame-light'),
    'the Liquid Glass and both Pixel Frame themes are registered globally');

  const button=window.document.querySelector('#themebtn');
  button.click();
  await flush(10);
  check(button.getAttribute('aria-expanded') === 'true' &&
        window.document.querySelectorAll('#thememenu button').length === 6,
    'the global theme entry opens a menu of registered themes');
  [...window.document.querySelectorAll('#thememenu button')].find(b=>b.textContent.includes('Light')).click();
  check(api.current() === 'light' && window.document.documentElement.dataset.themeMode === 'light',
    'choosing a menu item applies that theme');
  check(window.localStorage.awtrixTheme === 'light', 'theme choice is persisted');
  check(button.getAttribute('aria-expanded') === 'false' &&
        window.document.querySelector('#thememenu button.on').textContent.includes('Light'),
    'the menu closes and marks the active theme');

  api.apply('liquid-glass-white');
  check(window.document.documentElement.dataset.theme === 'liquid-glass-white' &&
        window.document.documentElement.style.getPropertyValue('--card').includes('rgba') &&
        window.document.documentElement.style.getPropertyValue('--glass-line').includes('rgba'),
    'White Liquid Glass applies translucent light surface tokens');
  api.apply('liquid-glass-color');
  check(window.document.documentElement.dataset.themeMode === 'dark' &&
        window.document.documentElement.style.getPropertyValue('--acc') === '#78d7ff',
    'Color Liquid Glass applies its saturated dark palette');
  api.apply('light');

  api.apply('pixel-frame');
  check(window.document.documentElement.dataset.theme === 'pixel-frame' &&
        window.document.documentElement.style.getPropertyValue('--acc') === '#b8f34a',
    'Pixel Frame Dark applies its high-contrast phosphor palette');
  api.apply('pixel-frame-light');
  check(window.document.documentElement.dataset.themeMode === 'light' &&
        window.document.documentElement.style.getPropertyValue('--bg') === '#f4f0dc',
    'Pixel Frame Light applies its warm paper palette');
  api.apply('light');

  let eventTheme = '';
  window.addEventListener('awtrix-theme-change', e => { eventTheme = e.detail.id; });
  api.register('ocean', {
    label: 'Ocean', mode: 'dark',
    vars: { bg: '#071521', card: '#102536', acc: '#35c2ff' },
  });
  api.apply('ocean');
  const root = window.document.documentElement;
  check(api.current() === 'ocean' && eventTheme === 'ocean',
    'developers can register a theme and observe activation');
  check(root.dataset.theme === 'ocean' && root.dataset.themeMode === 'dark' &&
        root.style.getPropertyValue('--acc') === '#35c2ff',
    'a custom theme applies its mode and global token overrides');
  api.apply('light');
  check(root.style.getPropertyValue('--acc') === '', 'switching themes clears old token overrides');

  window.close();
  if (failures) process.exitCode = 1;
  else console.log('all checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
