import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => logs.push('[CONSOLE] ' + msg.text()));

console.log('=== Navigating to', BASE, '===');
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

// Fermer géoloc popup
const denyBtn = page.locator('button').filter({ hasText: 'Ne jamais autoriser' }).first();
if (await denyBtn.isVisible().catch(() => false)) {
  await denyBtn.click();
  console.log('Closed geoloc popup');
  await page.waitForTimeout(500);
}

// =====================================================
// ÉTAPE 1: DÉPART — Ouvrir picker, choisir Station, taper, sélectionner
// =====================================================
console.log('\n--- ÉTAPE 1: DÉPART ---');
const selectBtns = page.locator('button').filter({ hasText: 'Sélectionner…' });
await selectBtns.first().click();
console.log('Opened Départ picker');
await page.waitForTimeout(600);

// Cliquer sur "Station"
const stationBtn = page.locator('button').filter({ hasText: 'Station' }).first();
const stationVisible = await stationBtn.isVisible().catch(() => false);
console.log('Station button visible:', stationVisible);

if (stationVisible) {
  await stationBtn.click();
  console.log('Clicked Station');
  await page.waitForTimeout(600);
}

await page.screenshot({ path: 'tests/pw/sjv_comedie_station_mode.png', fullPage: true });

// Maintenant un input devrait apparaître
const inputNow = await page.evaluate(() =>
  Array.from(document.querySelectorAll('input')).map(el => ({
    placeholder: el.placeholder, id: el.id, visible: !!(el.offsetWidth || el.offsetHeight)
  }))
);
console.log('Inputs after Station click:', JSON.stringify(inputNow));

// Interagir avec le premier input visible
const searchInput = page.locator('input').first();
const siVisible = await searchInput.isVisible().catch(() => false);
console.log('Search input visible:', siVisible);

if (siVisible) {
  await searchInput.fill('Saint-Jean de Védas');
  await page.waitForTimeout(1500);
  console.log('Typed Saint-Jean de Védas');

  await page.screenshot({ path: 'tests/pw/sjv_comedie_depart_typed.png', fullPage: true });

  // Lister les résultats
  const results = await page.evaluate(() =>
    Array.from(document.querySelectorAll('li, [role="option"], button'))
      .map(el => el.textContent?.trim().substring(0, 100))
      .filter(t => t && t.length > 2 && t.length < 100)
  );
  console.log('Results after Védas:', JSON.stringify(results.slice(0, 15)));

  // Cliquer sur Saint-Jean de Védas Centre
  // D'abord essayer locator exact
  let selected = false;
  const optionSJV = page.locator('li, button').filter({ hasText: 'Saint-Jean de Védas Centre' }).first();
  if (await optionSJV.isVisible().catch(() => false)) {
    await optionSJV.click();
    selected = true;
    console.log('Selected: Saint-Jean de Védas Centre');
  } else {
    // Essai avec "Védas Centre"
    const opt2 = page.locator('li, button').filter({ hasText: /Védas Centre/ }).first();
    if (await opt2.isVisible().catch(() => false)) {
      const t = await opt2.textContent();
      console.log('Found Védas Centre:', t?.trim());
      await opt2.click();
      selected = true;
    }
  }

  if (!selected) {
    // Voir ce qu'il y a dans les li
    const liItems = await page.evaluate(() =>
      Array.from(document.querySelectorAll('li')).map(el => el.innerText?.trim().substring(0,100))
    );
    console.log('All li items:', JSON.stringify(liItems.slice(0, 20)));
    // Cliquer sur le premier li
    const firstLi = page.locator('li').first();
    if (await firstLi.isVisible().catch(() => false)) {
      const t = await firstLi.textContent();
      console.log('Clicking first li:', t?.trim().substring(0,60));
      await firstLi.click();
    }
  }
  await page.waitForTimeout(800);
} else {
  console.log('ERROR: search input not found after Station click');
  // Debug complet
  const allVisible = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0 && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE')
      .map(el => ({ tag: el.tagName, className: el.className?.substring?.(0,60) || '', text: el.textContent?.trim().substring(0,40) }))
      .filter(el => ['INPUT','TEXTAREA','SELECT'].includes(el.tag))
  );
  console.log('Visible form elements:', JSON.stringify(allVisible));
}

await page.screenshot({ path: 'tests/pw/sjv_comedie_after_depart.png', fullPage: true });

// =====================================================
// ÉTAPE 2: ARRIVÉE — Ouvrir picker, choisir Station, taper Comédie
// =====================================================
console.log('\n--- ÉTAPE 2: ARRIVÉE ---');

// Attendre que le picker arrivée soit accessible
await page.waitForTimeout(500);

const selectBtns2 = page.locator('button').filter({ hasText: 'Sélectionner…' });
const cnt2 = await selectBtns2.count();
console.log('Remaining Sélectionner buttons:', cnt2);

if (cnt2 > 0) {
  await selectBtns2.first().click();
  console.log('Opened Arrivée picker');
} else {
  // Chercher via le texte Arrivée dans la page
  const arrivedBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(el => el.textContent?.trim().substring(0,60))
  );
  console.log('All buttons after depart:', JSON.stringify(arrivedBtns));
}
await page.waitForTimeout(600);

// Cliquer Station dans le picker arrivée
const stationBtn2 = page.locator('button').filter({ hasText: 'Station' }).first();
if (await stationBtn2.isVisible().catch(() => false)) {
  await stationBtn2.click();
  console.log('Clicked Station (arrivée)');
  await page.waitForTimeout(600);
}

await page.screenshot({ path: 'tests/pw/sjv_comedie_arrivee_station_mode.png', fullPage: true });

const searchInput2 = page.locator('input').first();
const si2Visible = await searchInput2.isVisible().catch(() => false);
console.log('Search input 2 visible:', si2Visible);

if (si2Visible) {
  await searchInput2.fill('Comédie');
  await page.waitForTimeout(1500);
  console.log('Typed Comédie');

  await page.screenshot({ path: 'tests/pw/sjv_comedie_arrivee_typed.png', fullPage: true });

  const results2 = await page.evaluate(() =>
    Array.from(document.querySelectorAll('li, [role="option"]'))
      .map(el => el.textContent?.trim().substring(0, 100))
      .filter(t => t && t.length > 2)
  );
  console.log('Results after Comédie:', JSON.stringify(results2.slice(0, 15)));

  let selected2 = false;
  const optComedie = page.locator('li, button').filter({ hasText: /^Comédie$/ }).first();
  if (await optComedie.isVisible().catch(() => false)) {
    await optComedie.click();
    selected2 = true;
    console.log('Selected: Comédie (exact)');
  } else {
    const optComedie2 = page.locator('li, button').filter({ hasText: 'Comédie' }).first();
    if (await optComedie2.isVisible().catch(() => false)) {
      const t = await optComedie2.textContent();
      console.log('Selected Comédie (contains):', t?.trim().substring(0,60));
      await optComedie2.click();
      selected2 = true;
    }
  }

  if (!selected2) {
    const firstLi2 = page.locator('li').first();
    if (await firstLi2.isVisible().catch(() => false)) {
      const t = await firstLi2.textContent();
      console.log('Clicking first li (comédie fallback):', t?.trim().substring(0,60));
      await firstLi2.click();
    }
  }
  await page.waitForTimeout(800);
}

await page.screenshot({ path: 'tests/pw/sjv_comedie_after_arrivee.png', fullPage: true });

// =====================================================
// ÉTAPE 3: CALCULER L'ITINÉRAIRE
// =====================================================
console.log('\n--- ÉTAPE 3: CALCULER ---');

const calcBtn = page.locator('button').filter({ hasText: /[Cc]alculer/ }).first();
const calcEnabled = await calcBtn.isEnabled().catch(() => false);
const calcVisible = await calcBtn.isVisible().catch(() => false);
console.log('Calculer: visible=', calcVisible, 'enabled=', calcEnabled);

// Vérifier l'état actuel de la page
const pageState = await page.evaluate(() => document.body.innerText.substring(0, 400));
console.log('Page state before calc:', pageState);

if (calcEnabled) {
  await calcBtn.click();
  console.log('Clicked Calculer!');
  await page.waitForTimeout(5000);
} else {
  console.log('Button disabled — checking why');

  // Lire les valeurs affichées dans les cartes
  const cardTexts = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="card"], [class*="Card"], div');
    return Array.from(cards)
      .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0)
      .map(el => el.innerText?.trim().substring(0,80))
      .filter(t => t && t.includes('Départ') || t?.includes('Arrivée'))
      .slice(0, 6);
  });
  console.log('Card texts:', JSON.stringify(cardTexts));

  // Forcer le click quand même
  await calcBtn.click({ force: true });
  console.log('Force-clicked Calculer');
  await page.waitForTimeout(5000);
}

// =====================================================
// SCREENSHOT RÉSULTAT
// =====================================================
await page.screenshot({ path: 'tests/pw/sjv_comedie_result.png', fullPage: true });
console.log('\nScreenshot result saved: tests/pw/sjv_comedie_result.png');

// =====================================================
// VÉRIFICATIONS
// =====================================================
const pageContent = await page.evaluate(() => document.body.innerText);
const hasProchains = pageContent.includes('Prochains passages');
const hasItinerary = pageContent.includes('itinéraire') || pageContent.includes('Itinéraire');
const hasLigne = pageContent.includes('Ligne') || pageContent.includes('ligne L');
const hasMinutes = pageContent.match(/\d+\s*min/);

console.log('"Prochains passages" visible:', hasProchains);
console.log('Itinerary content:', hasItinerary);
console.log('Ligne mentioned:', hasLigne);
console.log('Minutes mentioned:', !!hasMinutes);
console.log('\nResult page text (first 800):\n', pageContent.substring(0, 800));

// =====================================================
// FETCH /api/realtime
// =====================================================
console.log('\n=== Fetching /api/realtime ===');
const realtimeResult = await page.evaluate(async () => {
  try {
    const res = await fetch('/api/realtime');
    const text = await res.text();
    const allLines = text.split('\n').filter(l => l.trim());
    const lines = allLines.slice(0, 11);
    return { ok: true, status: res.status, lines, total: allLines.length };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

console.log('Realtime fetch status:', realtimeResult.status, '| ok:', realtimeResult.ok, '| total rows:', realtimeResult.total);
if (realtimeResult.lines) {
  console.log('\n=== CSV FIRST 11 LINES — separator=; (col4=route_short_name, col5=trip_headsign) ===');
  realtimeResult.lines.forEach((line, i) => {
    // Le CSV utilise ";" comme séparateur d'après la ligne header
    const cols = line.split(';');
    const lineCode = cols[4] ?? '(no col 4)';
    const headsign = cols[5] ?? '(no col 5)';
    console.log(`[${i}] lineCode="${lineCode}" | headsign="${headsign}" | full: ${line.substring(0, 130)}`);
  });
}
if (realtimeResult.error) console.log('Realtime error:', realtimeResult.error);

// =====================================================
// RÉSUMÉ
// =====================================================
console.log('\n============================');
console.log('RÉSUMÉ TEST SJV → Comédie');
console.log('============================');
console.log('Screenshot: tests/pw/sjv_comedie_result.png');
console.log('"Prochains passages" affiché:', hasProchains);
console.log('Calculer bouton était enabled:', calcEnabled);
console.log('Total lignes CSV temps réel:', realtimeResult.total || '?');

if (logs.length > 0) {
  console.log('\n=== CONSOLE LOGS BROWSER (first 20) ===');
  logs.slice(0, 20).forEach(l => console.log(l));
}

await browser.close();
