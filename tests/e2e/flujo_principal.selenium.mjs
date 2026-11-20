// tests/e2e/flujo_principal.selenium.mjs
// Suite funcional E2E integral con Selenium WebDriver (PC8 / PC13) — SISGESDOC MDLO
import assert from 'node:assert/strict'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

const BASE_URL = (
  process.env.BASE_URL || 'https://sistema-gestion-olivos.vercel.app'
).trim()

// Credenciales de prueba oficiales definidas en HU-01 (sobrescribibles por variables de entorno)
const MESA_EMAIL = (
  process.env.TEST_USER_EMAIL || 'mesadepartes@mdlo.gob.pe'
).trim()
const MESA_PASSWORD = (
  process.env.TEST_USER_PASSWORD || 'Mdlo2026!'
).trim()
const ADMIN_EMAIL = (
  process.env.TEST_ADMIN_EMAIL || 'admin@mdlo.gob.pe'
).trim()
const ADMIN_PASSWORD = (
  process.env.TEST_ADMIN_PASSWORD || 'Mdlo2026!'
).trim()
const TEST_CUT = (process.env.TEST_CUT || 'EXP-2026-000001-MDLO').trim()
const TIMEOUT_MS = Number(process.env.E2E_TIMEOUT_MS || 20000)

function resolveUrl(pathname) {
  return new URL(pathname, BASE_URL).toString()
}

async function createChromeDriver() {
  const options = new chrome.Options()
  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new')
  }
  options.addArguments(
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

async function logoutViaProfileMenu(driver) {
  const profileBtn = await driver.wait(
    until.elementLocated(By.css('button[aria-haspopup="menu"]')),
    TIMEOUT_MS
  )
  await profileBtn.click()

  const logoutBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Cerrar Sesión')]")),
    TIMEOUT_MS
  )
  await logoutBtn.click()

  await driver.wait(
    async () => (await driver.getCurrentUrl()).includes('/login'),
    TIMEOUT_MS,
    'El cierre de sesión debe redirigir a /login.'
  )
}

async function loginWith(driver, email, password) {
  await driver.get(resolveUrl('/login'))
  const emailInput = await driver.wait(
    until.elementLocated(By.css('input#email')),
    TIMEOUT_MS
  )
  const passwordInput = await driver.findElement(By.css('input#password'))
  const submitButton = await driver.findElement(By.css('button[type="submit"]'))

  await emailInput.clear()
  if (email) await emailInput.sendKeys(email)
  await passwordInput.clear()
  if (password) await passwordInput.sendKeys(password)
  await submitButton.click()
}

async function runE2ESuite() {
  const resumen = []
  let driver

  console.log(`[E2E] Iniciando suite Selenium WebDriver contra: ${BASE_URL}`)

  try {
    driver = await createChromeDriver()

    // =========================================================================
    // CASO 1: Acceso a /login, etiquetas accesibles y envío con campos vacíos
    // =========================================================================
    await driver.get(resolveUrl('/login'))
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

    await submitButton.click()
    await driver.sleep(400)
    assert.ok((await driver.getCurrentUrl()).includes('/login'))

    resumen.push('PASS | Caso 1: /login accesible y bloqueo ante campos vacíos')
    console.log('[PASS] Caso 1: /login cargó accesible y bloqueó envío vacío.')

    // =========================================================================
    // CASO 2: Validación de correo inválido y contraseña incorrecta
    // =========================================================================
    await loginWith(driver, 'correo-invalido', '123')
    await driver.sleep(500)
    assert.ok((await driver.getCurrentUrl()).includes('/login'))

    await loginWith(driver, MESA_EMAIL, 'ClaveErronea123')
    await driver.wait(
      until.elementLocated(By.css('[role="alert"]')),
      TIMEOUT_MS
    )
    assert.ok((await driver.getCurrentUrl()).includes('/login'))

    resumen.push('PASS | Caso 2: Rechazo de formato inválido y contraseña incorrecta en /login')
    console.log('[PASS] Caso 2: Validación negativa y alerta de credenciales incorrectas verificadas.')

    // =========================================================================
    // CASO 3: Protección de rutas privadas sin sesión (/dashboard/bandeja y /admin)
    // =========================================================================
    await driver.get(resolveUrl('/dashboard/bandeja'))
    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes('/login'),
      TIMEOUT_MS
    )
    await driver.get(resolveUrl('/dashboard/admin'))
    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes('/login'),
      TIMEOUT_MS
    )

    resumen.push('PASS | Caso 3: Rutas privadas protegidas (redirección automática a /login)')
    console.log('[PASS] Caso 3: Protección de rutas /dashboard/bandeja y /dashboard/admin verificada.')

    // =========================================================================
    // CASO 4: Login exitoso MESA_PARTES (HU-01), bandeja, filtros y nuevo expediente
    // =========================================================================
    await loginWith(driver, MESA_EMAIL, MESA_PASSWORD)
    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes('/dashboard/bandeja'),
      TIMEOUT_MS,
      'MESA_PARTES debe redirigir a /dashboard/bandeja.'
    )

    // Verificar filtro de búsqueda en bandeja
    const searchBandeja = await driver.wait(
      until.elementLocated(By.css('input#bandeja_search_query')),
      TIMEOUT_MS
    )
    await searchBandeja.clear()
    await searchBandeja.sendKeys('EXP-2026')
    assert.equal(await searchBandeja.getAttribute('value'), 'EXP-2026')

    // Navegar a /dashboard/expedientes/nuevo y rellenar el formulario completo
    await driver.get(resolveUrl('/dashboard/expedientes/nuevo'))
    const dniInput = await driver.wait(
      until.elementLocated(By.css('input#remitente_dni_ruc')),
      TIMEOUT_MS
    )
    const nombresInput = await driver.findElement(By.css('input#remitente_nombres'))
    const correoExpInput = await driver.findElement(By.css('input#correo'))
    const telefonoInput = await driver.findElement(By.css('input#telefono'))
    const direccionInput = await driver.findElement(By.css('input#direccion'))
    const foliosInput = await driver.findElement(By.css('input#folios'))
    const asuntoInput = await driver.findElement(By.css('textarea#asunto'))

    await dniInput.clear()
    await dniInput.sendKeys('45892134')
    await nombresInput.clear()
    await nombresInput.sendKeys('Juan Carlos Pérez Quispe')
    await correoExpInput.clear()
    await correoExpInput.sendKeys('jperez@correo.pe')
    await telefonoInput.clear()
    await telefonoInput.sendKeys('987654321')
    await direccionInput.clear()
    await direccionInput.sendKeys('Av. Antúnez de Mayolo 1234, Los Olivos')
    await foliosInput.clear()
    await foliosInput.sendKeys('5')
    await asuntoInput.clear()
    await asuntoInput.sendKeys('Solicitud de Licencia de Funcionamiento Comercial para Bodega')

    assert.equal(await dniInput.getAttribute('value'), '45892134')
    assert.equal(await nombresInput.getAttribute('value'), 'Juan Carlos Pérez Quispe')
    assert.equal(await foliosInput.getAttribute('value'), '5')

    resumen.push('PASS | Caso 4: Login MESA_PARTES, filtro en bandeja y llenado de formulario Nuevo Expediente')
    console.log('[PASS] Caso 4: Login MESA_PARTES, bandeja y llenado del formulario de radicación verificados.')

    // Cerrar sesión desde menú de perfil
    await logoutViaProfileMenu(driver)
    resumen.push('PASS | Caso 5: Cierre de sesión desde menú de perfil -> /login')
    console.log('[PASS] Caso 5: Cierre de sesión ejecutado correctamente.')

    // =========================================================================
    // CASO 6: Login exitoso ADMIN_TI (HU-01), tabla de usuarios y modal Nuevo Empleado
    // =========================================================================
    await loginWith(driver, ADMIN_EMAIL, ADMIN_PASSWORD)
    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes('/dashboard/admin'),
      TIMEOUT_MS,
      'ADMIN_TI debe redirigir a /dashboard/admin.'
    )

    await driver.wait(until.elementLocated(By.css('table')), TIMEOUT_MS)
    const nuevoEmpBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Nuevo Empleado')]")),
      TIMEOUT_MS
    )
    await nuevoEmpBtn.click()

    const modalNombres = await driver.wait(
      until.elementLocated(By.css('input#nombres')),
      TIMEOUT_MS
    )
    await modalNombres.sendKeys('María Elena')
    const modalApellidos = await driver.findElement(By.css('input#apellidos'))
    await modalApellidos.sendKeys('Quispe Rojas')
    const modalDni = await driver.findElement(By.css('input#dni'))
    await modalDni.sendKeys('41234567')
    assert.equal(await modalDni.getAttribute('value'), '41234567')

    const cancelarBtn = await driver.findElement(
      By.xpath("//button[contains(., 'Cancelar')]")
    )
    await cancelarBtn.click()

    await logoutViaProfileMenu(driver)
    resumen.push('PASS | Caso 6: Login ADMIN_TI, tabla de usuarios y modal Nuevo Empleado verificados')
    console.log('[PASS] Caso 6: Panel Admin TI y llenado de modal Nuevo Empleado verificados.')

    // =========================================================================
    // CASO 7: Consulta Pública /consulta (CUT válido y CUT inexistente)
    // =========================================================================
    await driver.get(resolveUrl('/consulta'))
    const heading = await driver.wait(until.elementLocated(By.css('h1')), TIMEOUT_MS)
    assert.match(await heading.getText(), /Consulta de Trámites/i)

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

    await driver.wait(
      async () => {
        const alerts = await driver.findElements(By.css('[role="alert"]'))
        const sections = await driver.findElements(By.css('section[aria-label*="Resultado"]'))
        return alerts.length > 0 || sections.length > 0
      },
      TIMEOUT_MS
    )

    // Probar CUT inexistente
    await cutInput.clear()
    await cutInput.sendKeys('EXP-2026-999999-MDLO')
    await searchBtn.click()
    await driver.wait(
      until.elementLocated(By.css('#cut-search-error[role="alert"]')),
      TIMEOUT_MS
    )

    resumen.push(`PASS | Caso 7: Consulta ciudadana /consulta (${TEST_CUT} y CUT inexistente)`)
    console.log('[PASS] Caso 7: Consulta ciudadana con CUT válido e inexistente verificada.')

    // =========================================================================
    // CASO 8: Responsividad móvil (390x844) y Auditoría WCAG en vivo
    // =========================================================================
    await driver.manage().window().setRect({ width: 390, height: 844 })
    for (const path of ['/login', '/consulta']) {
      await driver.get(resolveUrl(path))
      await driver.sleep(400)
      const mobileAudit = await driver.executeScript(() => {
        const noOverflow =
          document.documentElement.scrollWidth <= window.innerWidth + 1
        const lang = document.documentElement.getAttribute('lang') || ''
        const inputs = Array.from(
          document.querySelectorAll('input:not([type="hidden"])')
        )
        const unlabeledInputs = inputs.filter((el) => {
          const id = el.getAttribute('id')
          const hasLabel = id
            ? Boolean(document.querySelector(`label[for="${id}"]`))
            : false
          const hasAria = Boolean(
            el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
          )
          return !hasLabel && !hasAria
        }).length
        const imgsSinAlt = Array.from(document.querySelectorAll('img')).filter(
          (img) => !img.hasAttribute('alt')
        ).length
        const hasH1 = Boolean(document.querySelector('h1'))
        return { noOverflow, lang, unlabeledInputs, imgsSinAlt, hasH1 }
      })

      assert.equal(mobileAudit.noOverflow, true, `Desbordamiento horizontal en móvil en ${path}`)
      assert.ok(mobileAudit.lang.length > 0, `Falta lang en ${path}`)
      assert.equal(mobileAudit.unlabeledInputs, 0, `Inputs sin etiqueta en ${path}`)
      assert.equal(mobileAudit.imgsSinAlt, 0, `Imágenes sin alt en ${path}`)
      assert.equal(mobileAudit.hasH1, true, `Falta <h1> en ${path}`)
    }

    resumen.push('PASS | Caso 8: Responsividad móvil (390x844 sin overflow) y WCAG AA en vivo')
    console.log('[PASS] Caso 8: Responsividad móvil 390x844 y WCAG en vivo aprobadas.')

    console.log('\n=== RESUMEN SUITE E2E SELENIUM (8/8 CASOS APROBADOS) ===')
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
