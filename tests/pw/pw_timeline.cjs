const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });

  const nonMerci = await page.$('button:has-text("Non merci")');
  if (nonMerci) { await nonMerci.click(); await page.waitForTimeout(400); }

  // --- DÉPART : Corum ---
  await page.click('button:has-text("Sélectionner…")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Nom de station")');
  await page.waitForTimeout(300);
  await page.fill('input', 'Corum');
  await page.waitForTimeout(1000);
  // Clique sur la ligne résultat "Corum"
  await page.click('text=Corum', { timeout: 3000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/pw/pw_after_depart.png' });

  // --- ARRIVÉE : Odysseum ---
  await page.click('button:has-text("Sélectionner…")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Nom de station")');
  await page.waitForTimeout(300);
  await page.fill('input', 'Odysseum');
  await page.waitForTimeout(1000);
  await page.click('text=Odysseum', { timeout: 3000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/pw/pw_after_arrivee.png' });

  // Chercher itinéraire
  await page.click('button:has-text("Chercher un itinéraire")');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'tests/pw/pw_timeline.png', fullPage: true });

  console.log('Done');
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
