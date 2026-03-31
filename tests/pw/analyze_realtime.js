import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to app
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });

  // Screenshot initial state
  await page.screenshot({ path: join(__dirname, 'realtime_analysis.png'), fullPage: false });
  console.log('Screenshot taken');

  // Execute the CSV analysis JS
  const result = await page.evaluate(async () => {
    const r = await fetch('/api/realtime');
    const text = await r.text();
    const lines = text.split('\n').slice(1).filter(l => l.trim());
    const parsed = lines.map(l => {
      const c = l.split(';');
      return { stopName: c[3]?.trim(), lineCode: c[4]?.trim(), headsign: c[5]?.trim(), time: c[7]?.trim() };
    });
    const l2 = parsed.filter(r => r.lineCode === '2');
    const headsigns = [...new Set(l2.map(r => r.headsign))];
    const sjv = parsed.filter(r => r.stopName?.toLowerCase().includes('jean') || r.stopName?.toLowerCase().includes('vedas'));
    return {
      l2headsigns: headsigns,
      l2count: l2.length,
      sjvRows: sjv.slice(0, 5),
      l2examples: l2.slice(0, 5)
    };
  });

  console.log('=== RESULT JSON ===');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
