import { test, expect } from '@playwright/test'

const TAM_COLORS: Record<string, string> = {
  '1': '#0070C0',
  '2': '#F7901E',
  '3': '#8DC63F',
  '4': '#EE1C25',
  '5': '#9E1F63',
}

test('couleurs TAM cohérentes partout', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const declineBtn = page.getByText('Non merci')
  if (await declineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await declineBtn.click()
  }

  // --- TEST 1 : StationPicker résultats ---
  await page.getByText('Sélectionner…').first().click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('saint jean')
  await page.waitForTimeout(500)

  const lineLabels = page.locator('.absolute button span').filter({ hasText: /^L\d/ })
  const count = await lineLabels.count()
  console.log(`\n--- StationPicker : ${count} badges ligne trouvés ---`)

  for (let i = 0; i < count; i++) {
    const el = lineLabels.nth(i)
    const text = await el.textContent()
    const bg = await el.evaluate(node => window.getComputedStyle(node).backgroundColor)
    console.log(`  "${text?.trim()}" → bg: ${bg}`)
  }

  // Fermer en cliquant le bouton ✕
  await page.locator('button', { hasText: '✕' }).click()
  await page.waitForTimeout(300)

  // --- TEST 2 : itinéraire Saint-Jean → Comédie ---
  await page.getByText('Sélectionner…').first().click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('saint jean')
  await page.waitForTimeout(500)
  await page.locator('.absolute button').first().click()

  await page.getByText('Sélectionner…').click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('comedie')
  await page.waitForTimeout(500)
  await page.locator('.absolute button').first().click()

  await page.getByText('Chercher un itinéraire').click()
  await page.waitForTimeout(1500)

  // Badges dans JourneyTimeline
  const timelineBadges = page.locator('span[style*="background-color"]')
  const badgeCount = await timelineBadges.count()
  console.log(`\n--- JourneyTimeline : ${badgeCount} badges colorés trouvés ---`)

  let allCorrect = true
  for (let i = 0; i < badgeCount; i++) {
    const el = timelineBadges.nth(i)
    const text = (await el.textContent())?.trim() ?? ''
    const bg = await el.evaluate(node => window.getComputedStyle(node).backgroundColor)
    const lineNum = text.replace('L', '')
    const expected = TAM_COLORS[lineNum]
    const ok = expected ? bg.includes(expected.slice(1).match(/.{2}/g)!.map(h => parseInt(h, 16)).join(', ')) : true
    console.log(`  "${text}" → bg: ${bg} ${expected ? (ok ? '✅' : `❌ attendu ${expected}`) : ''}`)
    if (!ok) allCorrect = false
  }

  // Badges dans RealtimePanel
  const realtimeBadges = page.locator('text=/Prochains passages/').locator('..').locator('span[style*="background-color"]')
  const realtimeCount = await realtimeBadges.count()
  console.log(`\n--- RealtimePanel : ${realtimeCount} badges colorés ---`)
  for (let i = 0; i < realtimeCount; i++) {
    const el = realtimeBadges.nth(i)
    const text = (await el.textContent())?.trim() ?? ''
    const bg = await el.evaluate(node => window.getComputedStyle(node).backgroundColor)
    console.log(`  "${text}" → bg: ${bg}`)
  }

  // Vérifie absence de bg-[#0070C0] hardcodé sur des badges non-L1
  const hardcodedBlue = page.locator('[class*="bg-\\[#0070C0\\]"]')
  const hardcodedCount = await hardcodedBlue.count()
  console.log(`\n--- Éléments avec bg-[#0070C0] hardcodé : ${hardcodedCount} ---`)
  for (let i = 0; i < hardcodedCount; i++) {
    const el = hardcodedBlue.nth(i)
    console.log(`  tag: ${await el.evaluate(n => n.tagName)}, text: "${(await el.textContent())?.trim().slice(0, 40)}"`)
  }

  expect(allCorrect).toBe(true)
})
