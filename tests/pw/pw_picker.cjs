const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });

  const nonMerci = await page.$('button:has-text("Non merci")');
  if (nonMerci) { await nonMerci.click(); await page.waitForTimeout(400); }

  await page.click('button:has-text("Sélectionner…")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/pw/pw_picker_icons.png' });

  console.log('Done');
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
