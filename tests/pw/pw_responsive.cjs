const { chromium } = require('playwright')
const path = require('path')

;(async () => {
  const browser = await chromium.launch({ headless: true })

  const sizes = [
    { name: '320px_iphone_se', width: 320, height: 568 },
    { name: '428px_iphone14promax', width: 428, height: 926 },
  ]

  for (const size of sizes) {
    const page = await browser.newPage()
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    // Dismiss geo consent if visible
    const declineBtn = page.locator('button', { hasText: 'Ne jamais autoriser' })
    if (await declineBtn.isVisible()) {
      await declineBtn.click()
      await page.waitForTimeout(300)
    }

    await page.screenshot({
      path: path.join(__dirname, `pw_responsive_${size.name}.png`),
      fullPage: false,
    })

    // Check overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = size.width
    const hasOverflow = bodyScrollWidth > viewportWidth
    console.log(`[${size.name}] viewport:${viewportWidth}px body:${bodyScrollWidth}px overflow:${hasOverflow ? '❌ OUI' : '✅ NON'}`)

    await page.close()
  }

  await browser.close()
  console.log('Screenshots saved in tests/pw/')
})()
