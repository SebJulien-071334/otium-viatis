const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  const errors = [];
  const networkFails = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));

  page.on('response', res => {
    if (res.status() >= 400) {
      networkFails.push(`${res.status()} ${res.url()}`);
    }
  });

  page.on('requestfailed', req => {
    networkFails.push(`FAILED: ${req.url()} — ${req.failure()?.errorText}`);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) {
    console.log('GOTO ERROR:', e.message);
  }

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'pw_debug.png' });

  console.log('\n=== NETWORK ERRORS ===');
  networkFails.forEach(f => console.log(f));

  console.log('\n=== CONSOLE ERRORS ===');
  errors.forEach(e => console.log(e));

  console.log('\n=== PAGE CONTENT (body text) ===');
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log(bodyText);

  await browser.close();
})().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
