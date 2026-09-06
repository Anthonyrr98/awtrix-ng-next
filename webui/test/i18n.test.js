/* Language selection and Simplified Chinese coverage smoke test. */
const { boot, goto, flush } = require('./harness');

let failures = 0;
function check(value, message) {
  if (value) console.log('  PASS: ' + message);
  else { console.log('  FAIL: ' + message); failures++; }
}

(async () => {
  console.log('i18n: extensible language registry and Simplified Chinese');
  const { window } = await boot();
  const doc = window.document;
  const button = doc.querySelector('#langbtn');

  button.click(); // English -> Deutsch
  button.click(); // Deutsch -> 简体中文
  await flush(40);
  check(button.textContent === '中', 'language control reaches Simplified Chinese');
  check(window.localStorage.awtrixLang === 'zh', 'language preference is persisted');
  check(doc.documentElement.lang === 'zh-CN', 'document language is exposed to accessibility tools');
  check([...doc.querySelectorAll('#nav a')].some(a => a.textContent === '仪表盘'),
    'navigation is translated');

  await goto(window, '#/system');
  check(doc.body.textContent.includes('稳定版更新'), 'maintenance content is translated');
  check(doc.body.textContent.includes('WiFi 网络'), 'settings field labels are translated');
  check(doc.body.textContent.includes('连接超时'), 'settings field help structure supports Chinese');

  button.click(); // 简体中文 -> English
  await flush(20);
  check(button.textContent === 'EN' && window.localStorage.awtrixLang === 'en',
    'language cycle returns to English');
  window.close();
  if (failures) process.exitCode = 1;
  else console.log('all checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
