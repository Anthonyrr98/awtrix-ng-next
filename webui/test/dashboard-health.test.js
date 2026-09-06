/* Dashboard health center smoke test against the real Web UI. */
const { boot, flush } = require('./harness');

let failures = 0;
function check(value, message) {
  if (value) console.log('  PASS: ' + message);
  else { console.log('  FAIL: ' + message); failures++; }
}

(async () => {
  console.log('dashboard: device health center');
  const { window, netlog } = await boot();
  await flush(80);
  const doc = window.document;
  const health = doc.querySelector('.health');
  check(!!health, 'health card is visible on Dashboard');
  check(health && health.querySelectorAll('.healthrow').length === 5,
    'power/reset, heap, fragmentation, network and FPS are assessed');
  check(health && [...health.querySelectorAll('button')].some(b => /diagnostic/i.test(b.textContent)),
    'diagnostic report download is offered');
  check(netlog.some(x => x === 'GET /api/v1/device'), 'health data comes from the device endpoint');
  window.close();
  if (failures) process.exitCode = 1;
  else console.log('all checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
