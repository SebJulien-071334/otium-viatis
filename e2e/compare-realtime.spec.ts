import { test } from '@playwright/test'

test('compare passages — St-Jean vers Comédie', async ({ page }) => {
  await page.goto('http://localhost:3000')
  const declineBtn = page.getByText('Non merci')
  if (await declineBtn.isVisible({ timeout: 2000 }).catch(() => false)) await declineBtn.click()

  await page.getByText('Sélectionner…').first().click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('saint jean')
  await page.waitForTimeout(600)
  await page.locator('.absolute button').first().click()

  await page.getByText('Sélectionner…').click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('comedie')
  await page.waitForTimeout(600)
  await page.locator('.absolute button').first().click()

  await page.getByText('Chercher un itinéraire').click()
  await page.waitForTimeout(4000)

  // Dump complet du body
  const full = await page.locator('body').innerText()
  console.log('\n=== BODY FULL ===')
  console.log(full.slice(0, 2000))
})
