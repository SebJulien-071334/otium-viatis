import { test, expect } from '@playwright/test'

test('adresse → Comédie : walking time visible', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('response', res => {
    if (res.url().includes('/api/walking')) {
      res.json().then(j => console.log('ORS response:', JSON.stringify(j))).catch(() => {})
    }
  })

  await page.goto('http://localhost:3000')

  // Fermer dialog géoloc si présent
  const declineBtn = page.getByText('Non merci')
  if (await declineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await declineBtn.click()
  }

  // Ouvrir champ Départ
  await page.getByText('Sélectionner…').first().click()
  await page.getByText('Adresse').click()
  await page.getByPlaceholder('Adresse…').fill('56 rue des sonnailles 34430')
  await page.waitForTimeout(1500)

  // Sélectionner premier résultat BAN
  const firstAddr = page.locator('.absolute button').first()
  await firstAddr.waitFor({ timeout: 5000 })
  console.log('Adresse trouvée:', await firstAddr.textContent())
  await firstAddr.click()

  // Ouvrir champ Arrivée
  await page.getByText('Sélectionner…').click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('comedie')
  await page.waitForTimeout(500)

  const stopBtn = page.locator('.absolute button').first()
  await stopBtn.waitFor({ timeout: 3000 })
  console.log('Station trouvée:', await stopBtn.textContent())
  await stopBtn.click()

  // Lancer la recherche
  await page.getByText('Chercher un itinéraire').click()
  await page.waitForTimeout(2000)

  // Attendre le bloc walking (max 10s)
  const walkingText = page.locator('text=/min à pied/')
  const found = await walkingText.isVisible({ timeout: 10000 }).catch(() => false)

  if (found) {
    console.log('✅ Walking block:', await walkingText.textContent())
  } else {
    console.log('❌ Walking block absent')
    console.log('Page content:', await page.locator('body').textContent())
  }

  console.log('Console errors:', errors)
  expect(found).toBe(true)
})
