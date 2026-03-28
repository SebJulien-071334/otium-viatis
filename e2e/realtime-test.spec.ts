import { test } from '@playwright/test'

test('realtime panel — station de départ', async ({ page }) => {
  // Intercepter la réponse du proxy CSV
  page.on('response', async res => {
    if (res.url().includes('/api/realtime')) {
      const text = await res.text().catch(() => '')
      const lines = text.split('\n').filter(l => l.trim())
      console.log(`\n--- CSV TAM : ${lines.length} lignes reçues ---`)
      if (lines.length > 0) console.log('Exemple ligne:', lines[1])
    }
  })

  await page.goto('http://localhost:3000')

  const declineBtn = page.getByText('Non merci')
  if (await declineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await declineBtn.click()
  }

  // Départ : Saint-Jean de Védas Centre
  await page.getByText('Sélectionner…').first().click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('saint jean')
  await page.waitForTimeout(500)
  await page.locator('.absolute button').first().click()

  // Arrivée : Comédie
  await page.getByText('Sélectionner…').click()
  await page.getByText('Nom de station').click()
  await page.getByPlaceholder('Nom de la station…').fill('comedie')
  await page.waitForTimeout(500)
  await page.locator('.absolute button').first().click()

  await page.getByText('Chercher un itinéraire').click()
  await page.waitForTimeout(3000)

  // Chercher le bloc "Prochains passages"
  const panel = page.locator('text=Prochains passages')
  const visible = await panel.isVisible({ timeout: 5000 }).catch(() => false)
  console.log(`\n--- RealtimePanel visible : ${visible} ---`)

  if (visible) {
    const content = await page.locator('text=Prochains passages').locator('..').textContent()
    console.log('Contenu:', content?.trim())
  } else {
    console.log('Page complète:', await page.locator('body').textContent())
  }
})
