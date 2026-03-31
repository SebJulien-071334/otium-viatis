import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

// Fermer géoloc
const denyBtn = page.locator('button').filter({ hasText: 'Ne jamais autoriser' }).first();
if (await denyBtn.isVisible().catch(() => false)) {
  await denyBtn.click();
  await page.waitForTimeout(500);
}

// Cliquer sur Départ "Sélectionner…"
const selectBtns = page.locator('button').filter({ hasText: 'Sélectionner…' });
await selectBtns.first().click();
await page.waitForTimeout(1000);

await page.screenshot({ path: 'tests/pw/picker_open.png', fullPage: true });

// Dump tout le DOM après ouverture
const dom = await page.evaluate(() => {
  const allInputs = Array.from(document.querySelectorAll('input')).map(el => ({
    tag: 'INPUT', id: el.id, placeholder: el.placeholder, type: el.type,
    visible: !!(el.offsetWidth || el.offsetHeight), className: el.className.substring(0,80)
  }));
  const allTextareas = Array.from(document.querySelectorAll('textarea')).map(el => ({
    tag: 'TEXTAREA', id: el.id, placeholder: el.placeholder, visible: !!(el.offsetWidth || el.offsetHeight)
  }));
  const allDivEditable = Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
    tag: el.tagName, contenteditable: el.contentEditable, text: el.textContent?.substring(0,40)
  }));
  const bodyText = document.body.innerText.substring(0, 1000);
  const portals = Array.from(document.querySelectorAll('[class*="modal"], [class*="picker"], [class*="overlay"], [class*="sheet"], [class*="drawer"], [class*="popup"], [role="dialog"]'))
    .map(el => ({ tag: el.tagName, className: el.className.substring(0,80), text: el.innerText?.substring(0,200) }));
  return { allInputs, allTextareas, allDivEditable, bodyText, portals };
});

console.log('=== INPUTS ===', JSON.stringify(dom.allInputs, null, 2));
console.log('=== TEXTAREAS ===', JSON.stringify(dom.allTextareas));
console.log('=== CONTENTEDITABLE ===', JSON.stringify(dom.allDivEditable));
console.log('=== PORTALS/MODALS ===', JSON.stringify(dom.portals, null, 2));
console.log('=== BODY TEXT ===', dom.bodyText);

// Chercher tous les éléments interactifs dans les overlays
const interactive = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button, input, select, textarea, [tabindex], [role="searchbox"]'))
    .map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      text: el.textContent?.trim().substring(0,50),
      placeholder: el.getAttribute('placeholder'),
      id: el.id,
      className: el.className.substring(0,60),
      visible: !!(el.offsetWidth || el.offsetHeight)
    }))
    .filter(el => el.visible);
});
console.log('\n=== ALL VISIBLE INTERACTIVE ELEMENTS ===');
interactive.forEach((el, i) => console.log(`[${i}]`, JSON.stringify(el)));

await browser.close();
