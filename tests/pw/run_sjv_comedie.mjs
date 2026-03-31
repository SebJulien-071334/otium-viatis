import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => logs.push('[CONSOLE] ' + msg.text()));

console.log('=== Navigating to', BASE, '===');
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

// Fermer le popup géoloc si présent
const denyBtn = page.locator('button').filter({ hasText: 'Ne jamais autoriser' }).first();
const denyVisible = await denyBtn.isVisible().catch(() => false);
if (denyVisible) {
  await denyBtn.click();
  console.log('Closed geoloc popup');
  await page.waitForTimeout(500);
}

await page.screenshot({ path: 'tests/pw/sjv_comedie_home.png', fullPage: true });
console.log('Screenshot home saved');

// === ÉTAPE 1: Ouvrir StationPicker DÉPART ===
// Les deux boutons "Sélectionner…" : 1er = départ, 2e = arrivée
const selectBtns = page.locator('button').filter({ hasText: 'Sélectionner…' });
const btnCount = await selectBtns.count();
console.log('Sélectionner buttons count:', btnCount);

await selectBtns.first().click();
console.log('Clicked Départ Sélectionner');
await page.waitForTimeout(800);

await page.screenshot({ path: 'tests/pw/sjv_comedie_picker_open.png', fullPage: true });

// Chercher l'input dans le StationPicker
const pickerInput = page.locator('input').first();
const pickerInputVisible = await pickerInput.isVisible().catch(() => false);
console.log('Picker input visible:', pickerInputVisible);

if (pickerInputVisible) {
  await pickerInput.fill('Saint-Jean de Védas');
  await page.waitForTimeout(1200);

  await page.screenshot({ path: 'tests/pw/sjv_comedie_depart_typed.png', fullPage: true });

  // Lister les résultats disponibles
  const results = await page.evaluate(() =>
    Array.from(document.querySelectorAll('li, [role="option"], [class*="result"]'))
      .map(el => el.textContent?.trim().substring(0, 100))
      .filter(t => t && t.length > 0)
  );
  console.log('Results after typing Védas:', JSON.stringify(results.slice(0, 10)));

  // Cliquer sur "Saint-Jean de Védas Centre"
  const sjvOption = page.locator('li, [role="option"]').filter({ hasText: 'Saint-Jean de Védas Centre' }).first();
  const sjvVisible = await sjvOption.isVisible().catch(() => false);
  console.log('SJV Centre option visible:', sjvVisible);

  if (sjvVisible) {
    await sjvOption.click();
    console.log('Selected Saint-Jean de Védas Centre');
  } else {
    // Fallback: cliquer sur le premier résultat contenant "Védas"
    const fallback = page.locator('li, [role="option"], button').filter({ hasText: 'Védas' }).first();
    const fbVisible = await fallback.isVisible().catch(() => false);
    console.log('Védas fallback visible:', fbVisible);
    if (fbVisible) {
      await fallback.click();
      console.log('Selected Védas (fallback)');
    } else {
      console.log('ERROR: Could not find Saint-Jean de Védas Centre option');
    }
  }
  await page.waitForTimeout(800);
} else {
  console.log('ERROR: Picker input not visible');
  const allElems = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input, [role="searchbox"], [class*="search"]'))
      .map(el => ({ tag: el.tagName, id: el.id, placeholder: el.getAttribute('placeholder'), className: el.className.substring(0,60) }))
  );
  console.log('All search elements:', JSON.stringify(allElems));
}

await page.screenshot({ path: 'tests/pw/sjv_comedie_after_depart.png', fullPage: true });

// === ÉTAPE 2: Ouvrir StationPicker ARRIVÉE ===
// Après sélection départ, le bouton arrivée devrait encore être "Sélectionner…"
const selectBtns2 = page.locator('button').filter({ hasText: 'Sélectionner…' });
const btnCount2 = await selectBtns2.count();
console.log('Sélectionner buttons remaining:', btnCount2);

// Ou chercher la carte Arrivée
// Les labels visibles: chercher le bouton arrivée
const arriveeSection = page.locator('text=Arrivée').first();
const arriveeVisible = await arriveeSection.isVisible().catch(() => false);
console.log('Arrivée label visible:', arriveeVisible);

if (btnCount2 > 0) {
  await selectBtns2.first().click();
  console.log('Clicked Arrivée Sélectionner');
} else {
  // Chercher par la card Arrivée
  const arriveeCard = page.locator('[class*="card"], div').filter({ hasText: 'Arrivée' }).first();
  const acVisible = await arriveeCard.isVisible().catch(() => false);
  if (acVisible) {
    const arriveeBtn = arriveeCard.locator('button');
    await arriveeBtn.click();
    console.log('Clicked via Arrivée card');
  }
}
await page.waitForTimeout(800);

await page.screenshot({ path: 'tests/pw/sjv_comedie_arrivee_open.png', fullPage: true });

const pickerInput2 = page.locator('input').first();
const pi2Visible = await pickerInput2.isVisible().catch(() => false);
console.log('Picker2 input visible:', pi2Visible);

if (pi2Visible) {
  await pickerInput2.fill('Comédie');
  await page.waitForTimeout(1200);

  await page.screenshot({ path: 'tests/pw/sjv_comedie_arrivee_typed.png', fullPage: true });

  const results2 = await page.evaluate(() =>
    Array.from(document.querySelectorAll('li, [role="option"]'))
      .map(el => el.textContent?.trim().substring(0, 100))
      .filter(t => t && t.length > 0)
  );
  console.log('Results after typing Comédie:', JSON.stringify(results2.slice(0, 10)));

  const comedieOption = page.locator('li, [role="option"]').filter({ hasText: 'Comédie' }).first();
  const coVisible = await comedieOption.isVisible().catch(() => false);
  console.log('Comédie option visible:', coVisible);

  if (coVisible) {
    await comedieOption.click();
    console.log('Selected Comédie');
  } else {
    // Fallback: premier résultat
    const firstResult = page.locator('li, [role="option"]').first();
    const frVisible = await firstResult.isVisible().catch(() => false);
    if (frVisible) {
      const frText = await firstResult.textContent();
      console.log('Clicking first result:', frText?.trim());
      await firstResult.click();
    }
  }
  await page.waitForTimeout(800);
}

await page.screenshot({ path: 'tests/pw/sjv_comedie_after_arrivee.png', fullPage: true });

// Vérifier l'état du bouton Calculer
const calcBtn = page.locator('button').filter({ hasText: /[Cc]alculer/ }).first();
const calcEnabled = await calcBtn.isEnabled().catch(() => false);
const calcVisible = await calcBtn.isVisible().catch(() => false);
console.log('Calculer button: visible=', calcVisible, 'enabled=', calcEnabled);

if (calcEnabled) {
  await calcBtn.click();
  console.log('Clicked Calculer!');
  await page.waitForTimeout(4000); // attendre le calcul + rendu
} else {
  // Debug: quel est l'état des cartes?
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 600));
  console.log('Page state (no calc possible):', pageText);

  // Essai avec force click
  await calcBtn.click({ force: true });
  console.log('Force-clicked Calculer');
  await page.waitForTimeout(4000);
}

// === SCREENSHOT RÉSULTAT ===
await page.screenshot({ path: 'tests/pw/sjv_comedie_result.png', fullPage: true });
console.log('Screenshot result saved: tests/pw/sjv_comedie_result.png');

// === VÉRIFIER "Prochains passages" ===
const pageContent = await page.evaluate(() => document.body.innerText);
const hasProchains = pageContent.includes('Prochains passages');
const hasItinerary = pageContent.includes('itinéraire') || pageContent.includes('Itinéraire');
const hasLine = pageContent.includes('Ligne') || pageContent.includes('ligne');
console.log('"Prochains passages" visible:', hasProchains);
console.log('Has itinerary info:', hasItinerary);
console.log('Has ligne info:', hasLine);
console.log('Result page text (first 600):', pageContent.substring(0, 600));

// === FETCH /api/realtime ===
console.log('\n=== Fetching /api/realtime ===');
const realtimeResult = await page.evaluate(async () => {
  try {
    const res = await fetch('/api/realtime');
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 12);
    return { ok: true, status: res.status, lines, total: text.split('\n').length };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

console.log('Realtime fetch status:', realtimeResult.status, '| ok:', realtimeResult.ok, '| total lines:', realtimeResult.total);
if (realtimeResult.lines) {
  console.log('\n=== FIRST 10 LINES CSV (col4=lineCode, col5=headsign) ===');
  realtimeResult.lines.forEach((line, i) => {
    const cols = line.split(',');
    const lineCode = cols[4] ?? '(no col 4)';
    const headsign = cols[5] ?? '(no col 5)';
    console.log(`[${i}] col4="${lineCode}" | col5="${headsign}" | raw: ${line.substring(0, 130)}`);
  });
}

if (realtimeResult.error) {
  console.log('Realtime error:', realtimeResult.error);
}

// === RÉSUMÉ ===
console.log('\n============================');
console.log('RÉSUMÉ TEST SJV → Comédie');
console.log('============================');
console.log('Screenshot: tests/pw/sjv_comedie_result.png');
console.log('"Prochains passages" affiché:', hasProchains);
console.log('Bouton Calculer était enabled:', calcEnabled);

if (logs.length > 0) {
  console.log('\n=== CONSOLE LOGS (first 15) ===');
  logs.slice(0, 15).forEach(l => console.log(l));
}

await browser.close();
