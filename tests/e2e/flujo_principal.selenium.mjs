// tests/e2e/flujo_principal.selenium.mjs
// Suite funcional E2E con Selenium WebDriver (PC8) — SISGESDOC MDLO
import assert from 'node:assert/strict'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

const BASE_URL = (
  process.env.BASE_URL || 'https://sistema-gestion-olivos.vercel.app'
).trim()
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL?.trim() || ''
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD?.trim() || ''
const TEST_CUT = (process.env.TEST_CUT || 'EXP-2026-000001-MDLO').trim()
const TIMEOUT_MS = Number(process.env.E2E_TIMEOUT_MS || 15000)

function resolveUrl(pathname) {
  return new URL(pathname, BASE_URL).toString()
}

async function createHeadlessChromeDriver() {
  const options = new chrome.Options()
  options.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1280,900'
  )

  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
    options.addArguments('--ignore-certificate-errors')
  }

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build()
}

async function runE2ESuite() {
  const resumen = []
  let driver

  console.log(`[PC8-E2E] Iniciando suite Selenium WebDriver contra: ${BASE_URL}`)

  try {
    driver = await createHeadlessChromeDriver()

    // =========================================================================
    // FLUJO 1: Acceso a /login y validación de elementos accesibles
    // =========================================================================
    const loginUrl = resolveUrl('/login')
    await driver.get(loginUrl)

    const emailInput = await driver.wait(
      until.elementLocated(By.css('input#email')),
      TIMEOUT_MS
    )
    const passwordInput = await driver.findElement(By.css('input#password'))
    const submitButton = await driver.findElement(By.css('button[type="submit"]'))
    const emailLabel = await driver.findElement(By.css('label[for="email"]'))
    const passwordLabel = await driver.findElement(By.css('label[for="password"]'))

    assert.equal(await emailInput.getAttribute('type'), 'email')
    assert.equal(await passwordInput.getAttribute('type'), 'password')
    assert.ok((await emailLabel.getText()).length > 0)
    assert.ok((await passwordLabel.getText()).length > 0)
    assert.ok(await submitButton.isDisplayed())

    resumen.push('PASS | Paso 1: Acceso a /login y verificación de accesibilidad del formulario')
    console.log('[PASS] Paso 1: /login cargó con inputs, labels y botón accesibles.')

    // =========================================================================
    // FLUJO 2: Inicio de sesión (credenciales reales o rechazo controlado)
    // =========================================================================
    let autenticado = false

    if (TEST_USER_EMAIL && TEST_USER_PASSWORD) {
      await emailInput.clear()
      await emailInput.sendKeys(TEST_USER_EMAIL)
      await passwordInput.clear()
      await passwordInput.sendKeys(TEST_USER_PASSWORD)
      await submitButton.click()

      await driver.wait(
        async () => {
          const url = await driver.getCurrentUrl()
          return url.includes('/dashboard')
        },
        TIMEOUT_MS,
        'No se redirigió a /dashboard tras iniciar sesión con credenciales de prueba.'
      )

      autenticado = true
      const currentUrl = await driver.getCurrentUrl()
      resumen.push(`PASS | Paso 2: Inicio de sesión exitoso -> ${currentUrl}`)
      console.log(`[PASS] Paso 2: Sesión iniciada correctamente (${currentUrl}).`)
    } else {
      // Flujo de rechazo controlado sin credenciales activas: valida control de formulario y protección de ruta
      await emailInput.clear()
      await emailInput.sendKeys('correo-invalido')
      await passwordInput.clear()
      await passwordInput.sendKeys('123')
      await submitButton.click()

      await driver.sleep(600)
      const currentUrl = await driver.getCurrentUrl()
      assert.ok(
        currentUrl.includes('/login'),
        'Un intento con datos inválidos debe permanecer en /login'
      )

      // Verificar protección de ruta privada /dashboard/bandeja sin sesión
      await driver.get(resolveUrl('/dashboard/bandeja'))
      await driver.wait(
        async () => (await driver.getCurrentUrl()).includes('/login'),
        TIMEOUT_MS,
        'El acceso sin sesión a /dashboard/bandeja debe redirigir a /login'
      )

      resumen.push(
        'PASS | Paso 2: Rechazo controlado de credenciales inválidas y protección de /dashboard/bandeja'
      )
      console.log(
        '[PASS] Paso 2: Rechazo controlado validado y ruta privada /dashboard/bandeja protegida.'
      )
    }

    // =========================================================================
    // FLUJO 3: Navegación a flujo principal (bandeja si autenticado + /consulta)
    // =========================================================================
    if (autenticado) {
      await driver.get(resolveUrl('/dashboard/bandeja'))
      await driver.wait(until.elementLocated(By.css('main, table, [role="region"]')), TIMEOUT_MS)
      resumen.push('PASS | Paso 3a: Navegación verificada en /dashboard/bandeja')
      console.log('[PASS] Paso 3a: Bandeja de expedientes cargada correctamente.')
    }

    const consultaUrl = resolveUrl('/consulta')
    await driver.get(consultaUrl)

    const heading = await driver.wait(
      until.elementLocated(By.css('h1')),
      TIMEOUT_MS
    )
    const headingText = await heading.getText()
    assert.match(headingText, /Consulta de Trámites/i)

    const cutInput = await driver.wait(
      until.elementLocated(By.css('input#cut-search-input')),
      TIMEOUT_MS
    )
    const searchBtn = await driver.findElement(
      By.css('form[role="search"] button[type="submit"]')
    )

    await cutInput.clear()
    await cutInput.sendKeys(TEST_CUT)
    await searchBtn.click()

    // Esperar resultado del expediente o alerta controlada (sin caída de la aplicación)
    await driver.wait(
      async () => {
        const alerts = await driver.findElements(By.css('[role="alert"]'))
        const sections = await driver.findElements(By.css('section[aria-label*="Resultado"]'))
        return alerts.length > 0 || sections.length > 0
      },
      TIMEOUT_MS,
      'La consulta por CUT no mostró ni resultado ni alerta controlada dentro del tiempo límite.'
    )

    resumen.push(
      `PASS | Paso 3: Consulta pública /consulta validada con CUT ${TEST_CUT}`
    )
    console.log(`[PASS] Paso 3: Consulta ciudadana en /consulta respondió correctamente para ${TEST_CUT}.`)

    // =========================================================================
    // FLUJO 4: Auditoría WCAG básica en vivo en navegador (PC13 / ODS 10)
    // =========================================================================
    const wcagReport = await driver.executeScript(() => {
      const lang = document.documentElement.getAttribute('lang') || ''
      const title = document.title || ''
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'))
      const unlabeledInputs = inputs.filter((el) => {
        const id = el.getAttribute('id')
        const hasLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false
        const hasAria = Boolean(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'))
        return !hasLabel && !hasAria
      }).length
      const imgsSinAlt = Array.from(document.querySelectorAll('img')).filter(
        (img) => !img.hasAttribute('alt')
      ).length
      const hasH1 = Boolean(document.querySelector('h1'))
      return { lang, title, unlabeledInputs, imgsSinAlt, hasH1 }
    })

    assert.ok(wcagReport.lang.length > 0, 'El documento debe declarar atributo lang')
    assert.ok(wcagReport.title.length > 0, 'La página debe tener un <title> descriptivo')
    assert.equal(wcagReport.unlabeledInputs, 0, 'Todos los inputs visibles deben tener etiqueta accesible')
    assert.equal(wcagReport.imgsSinAlt, 0, 'Todas las imágenes deben declarar atributo alt')
    assert.equal(wcagReport.hasH1, true, 'La página debe incluir encabezado principal <h1>')

    resumen.push(
      `PASS | Paso 4: Auditoría WCAG en vivo (lang="${wcagReport.lang}", inputs sin etiqueta=0, imgs sin alt=0, h1=OK)`
    )
    console.log(
      `[PASS] Paso 4: Auditoría WCAG en vivo aprobada (lang="${wcagReport.lang}", inputs sin etiqueta=0, imgs sin alt=0).`
    )

    console.log('\n=== RESUMEN SELENIUM E2E (PC8 / PC13) ===')
    for (const linea of resumen) {
      console.log(` - ${linea}`)
    }
  } finally {
    if (driver) {
      await driver.quit()
    }
  }
}

runE2ESuite().catch((err) => {
  console.error('[FAIL] Error durante la ejecución de la suite Selenium E2E:', err?.message || err)
  process.exit(1)
})
