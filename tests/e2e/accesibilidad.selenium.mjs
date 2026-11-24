import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import net from 'node:net'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Builder } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')

const HEADLESS = process.env.HEADLESS !== 'false'
const EXPLICIT_BASE_URL = process.env.BASE_URL || ''
const REPORT_JSON_PATH = path.join(ROOT_DIR, 'reports', 'accessibility-report.json')
const REPORT_HTML_PATH = path.join(ROOT_DIR, 'reports', 'accessibility-report.html')
const AXE_MIN_PATH = path.join(ROOT_DIR, 'node_modules', 'axe-core', 'axe.min.js')

const ROUTES_TO_AUDIT = [
  { path: '/login', label: 'Inicio de Sesión Institucional (/login)', viewport: { width: 1280, height: 800, label: 'Desktop 1280x800' }, testInteractiveError: true },
  { path: '/login', label: 'Inicio de Sesión Institucional (/login)', viewport: { width: 390, height: 844, label: 'Móvil 390x844' }, testInteractiveError: false },
  { path: '/consulta', label: 'Consulta Pública Ciudadana (/consulta)', viewport: { width: 1280, height: 800, label: 'Desktop 1280x800' }, testInteractiveError: true },
  { path: '/consulta', label: 'Consulta Pública Ciudadana (/consulta)', viewport: { width: 390, height: 844, label: 'Móvil 390x844' }, testInteractiveError: false },
  { path: '/forgot-password', label: 'Recuperación de Contraseña (/forgot-password)', viewport: { width: 1280, height: 800, label: 'Desktop 1280x800' }, testInteractiveError: true },
]

function httpGetStatus(targetUrl) {
  return new Promise((resolve) => {
    const req = http.get(targetUrl, (res) => {
      res.resume()
      resolve(res.statusCode || 0)
    })
    req.on('error', () => resolve(0))
    req.setTimeout(1500, () => {
      req.destroy()
      resolve(0)
    })
  })
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 3199
      srv.close(() => resolve(port))
    })
  })
}

function stopSpawnedServer(serverProcess) {
  if (!serverProcess || !serverProcess.pid) return
  try {
    process.kill(-serverProcess.pid, 'SIGTERM')
  } catch {
    try {
      serverProcess.kill('SIGTERM')
    } catch {
      // noop
    }
  }
}

async function ensureServerRunning() {
  if (EXPLICIT_BASE_URL) {
    const existingStatus = await httpGetStatus(`${EXPLICIT_BASE_URL}/login`)
    if (existingStatus >= 200 && existingStatus < 500) {
      return { baseUrl: EXPLICIT_BASE_URL, serverProcess: null, startedByScript: false }
    }
  }

  const port = EXPLICIT_BASE_URL
    ? Number(new URL(EXPLICIT_BASE_URL).port || 3000)
    : await getFreePort()
  const baseUrl = EXPLICIT_BASE_URL || `http://127.0.0.1:${port}`
  const nextBin = path.join(ROOT_DIR, 'node_modules', '.bin', 'next')

  const serverProcess = spawn(nextBin, ['start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: ROOT_DIR,
    detached: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-local-a11y',
    },
    stdio: 'ignore',
  })

  for (let i = 0; i < 40; i += 1) {
    const status = await httpGetStatus(`${baseUrl}/login`)
    if (status >= 200 && status < 500) {
      return { baseUrl, serverProcess, startedByScript: true }
    }
    await new Promise((r) => setTimeout(r, 500))
  }

  stopSpawnedServer(serverProcess)
  throw new Error(`No se pudo iniciar servidor Next.js en ${baseUrl}. Ejecute primero "npm run build".`)
}

function buildDriver() {
  const options = new chrome.Options()
  if (HEADLESS) {
    options.addArguments('--headless=new')
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1280,900'
  )
  return new Builder().forBrowser('chrome').setChromeOptions(options).build()
}

/**
 * Función ejecutada dentro del navegador para replicar reglas clave de WAVE
 * (Errores, Errores de Contraste, Alertas, Features, Estructura y ARIA).
 */
function browserWaveEvaluator() {
  const norm = (str) => (str || '').replace(/\s+/g, ' ').trim().toLowerCase()
  const snippet = (el) => {
    const tag = el.tagName.toLowerCase()
    const id = el.id ? `#${el.id}` : ''
    const txt = norm(el.textContent).slice(0, 40)
    return `<${tag}${id}>${txt ? ` "${txt}"` : ''}`
  }

  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = 1
  colorCanvas.height = 1
  const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true })

  const parseColor = (css) => {
    if (!css || css === 'transparent' || !colorCtx) {
      return { r: 255, g: 255, b: 255, a: 0 }
    }
    colorCtx.clearRect(0, 0, 1, 1)
    colorCtx.fillStyle = '#000000'
    colorCtx.fillStyle = css
    colorCtx.fillRect(0, 0, 1, 1)
    const [r, g, b, a255] = colorCtx.getImageData(0, 0, 1, 1).data
    return { r, g, b, a: a255 / 255 }
  }

  const blend = (fg, bg) => {
    const a = fg.a
    return {
      r: Math.round(fg.r * a + bg.r * (1 - a)),
      g: Math.round(fg.g * a + bg.g * (1 - a)),
      b: Math.round(fg.b * a + bg.b * (1 - a)),
      a: 1,
    }
  }

  const luminance = ({ r, g, b }) => {
    const [rs, gs, bs] = [r, g, b].map((v) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const contrastRatio = (c1, c2) => {
    const l1 = luminance(c1)
    const l2 = luminance(c2)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }

  const resolveEffectiveBg = (el) => {
    const chain = []
    let cur = el
    while (cur && cur.nodeType === 1) {
      chain.unshift(parseColor(window.getComputedStyle(cur).backgroundColor))
      cur = cur.parentElement
    }
    let acc = { r: 255, g: 255, b: 255, a: 1 }
    for (const layer of chain) {
      if (layer.a > 0) acc = blend(layer, acc)
    }
    return acc
  }

  const isRendered = (el) => {
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false
    }
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }

  const isSrOnly = (el) => {
    const style = window.getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return (
      style.position === 'absolute' &&
      ((rect.width <= 2 && rect.height <= 2) || style.clipPath !== 'none')
    )
  }

  const errors = []
  const contrastErrors = []
  const alerts = []

  // Document language & title
  if (!document.documentElement.lang) {
    errors.push({ rule: 'language_missing', message: 'Falta atributo lang en <html>', snippet: '<html>' })
  }
  if (!document.title || !document.title.trim()) {
    errors.push({ rule: 'title_invalid', message: 'Documento sin <title>', snippet: '<title>' })
  }

  // Controls without accessible label
  document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((ctrl) => {
    const id = ctrl.id
    const hasForLabel = id ? Boolean(document.querySelector(`label[for="${CSS.escape(id)}"]`)) : false
    const hasWrappingLabel = Boolean(ctrl.closest('label'))
    const hasAria = Boolean(ctrl.getAttribute('aria-label') || ctrl.getAttribute('aria-labelledby'))
    if (!hasForLabel && !hasWrappingLabel && !hasAria) {
      errors.push({
        rule: 'label_missing',
        message: 'Control de formulario sin etiqueta asociada',
        snippet: snippet(ctrl),
      })
    }
  })

  // Empty buttons / links
  document.querySelectorAll('button, a[href]').forEach((el) => {
    const text = norm(el.textContent)
    const aria = norm(el.getAttribute('aria-label'))
    const labelledBy = el.getAttribute('aria-labelledby')
    const hasImgAlt = Array.from(el.querySelectorAll('img')).some((img) => norm(img.getAttribute('alt')))
    if (!text && !aria && !labelledBy && !hasImgAlt) {
      errors.push({
        rule: el.tagName === 'BUTTON' ? 'button_empty' : 'link_empty',
        message: 'Elemento interactivo sin nombre accesible',
        snippet: snippet(el),
      })
    }
  })

  // Duplicate IDs
  const seenIds = new Set()
  document.querySelectorAll('[id]').forEach((el) => {
    if (seenIds.has(el.id)) {
      errors.push({ rule: 'duplicate_id', message: `ID duplicado #${el.id}`, snippet: snippet(el) })
    }
    seenIds.add(el.id)
  })

  // Computed Contrast Errors
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node
  while ((node = textWalker.nextNode())) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue
    const el = node.parentElement
    if (!el || !isRendered(el) || isSrOnly(el)) continue
    const style = window.getComputedStyle(el)
    const fg = parseColor(style.color)
    const bg = resolveEffectiveBg(el)
    const blendedFg = fg.a < 1 ? blend(fg, bg) : fg
    const ratio = contrastRatio(blendedFg, bg)
    const fontSize = parseFloat(style.fontSize || '16')
    const fontWeight = parseInt(style.fontWeight || '400', 10)
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700)
    const minRatio = isLarge ? 3.0 : 4.5
    if (ratio < minRatio) {
      contrastErrors.push({
        rule: 'contrast',
        message: `Contraste ${ratio.toFixed(2)}:1 (< ${minRatio}:1)`,
        snippet: snippet(el),
      })
    }
  }

  // WAVE Alert: heading_possible
  document.querySelectorAll('[data-slot="card-title"]').forEach((el) => {
    const hasHeading = Boolean(el.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]'))
    if (!hasHeading && !/^H[1-6]$/.test(el.tagName) && el.getAttribute('role') !== 'heading') {
      alerts.push({ rule: 'heading_possible', message: 'CardTitle sin encabezado semántico', snippet: snippet(el) })
    }
  })

  document.querySelectorAll('p, div, span').forEach((el) => {
    if (el.closest('h1, h2, h3, h4, h5, h6, [role="heading"], button, a, label, th, table')) return
    if (!isRendered(el) || isSrOnly(el)) return
    const st = window.getComputedStyle(el)
    const fs = parseFloat(st.fontSize || '14')
    const fw = parseInt(st.fontWeight || '400', 10)
    const text = norm(el.textContent)
    if (
      fs >= 18 &&
      fw >= 600 &&
      text.length > 0 &&
      text.length <= 90 &&
      el.children.length <= 2 &&
      !el.querySelector('h1, h2, h3, h4, h5, h6') &&
      el.getAttribute('data-slot') !== 'card-title'
    ) {
      alerts.push({
        rule: 'heading_possible',
        message: `Posible encabezado visual (${fs}px, weight ${fw}) sin etiqueta h1-h6`,
        snippet: snippet(el),
      })
    }
  })

  // WAVE Alert: title_redundant
  document.querySelectorAll('[title]').forEach((el) => {
    if (el.tagName.toLowerCase() === 'iframe') return
    const t = norm(el.getAttribute('title'))
    const txt = norm(el.textContent)
    const aria = norm(el.getAttribute('aria-label'))
    if (t && (t === txt || t === aria)) {
      alerts.push({ rule: 'title_redundant', message: 'Atributo title redundante', snippet: snippet(el) })
    }
  })

  // WAVE Alert: label_orphaned
  document.querySelectorAll('label').forEach((label) => {
    const f = label.getAttribute('for')
    if (!f) {
      if (!label.querySelector('input, select, textarea')) {
        alerts.push({ rule: 'label_orphaned', message: 'Label sin atributo for ni input anidado', snippet: snippet(label) })
      }
      return
    }
    const target = document.getElementById(f)
    if (!target || window.getComputedStyle(target).display === 'none' || target.getAttribute('type') === 'hidden') {
      alerts.push({ rule: 'label_orphaned', message: `Label apunta a control oculto o inexistente #${f}`, snippet: snippet(label) })
    }
  })

  // WAVE Alert: link_redundant
  document.querySelectorAll('tr, nav, div, td, ul').forEach((box) => {
    const links = Array.from(box.querySelectorAll('a[href]')).filter((a) => a.parentElement === box)
    for (let i = 1; i < links.length; i += 1) {
      if (links[i - 1].getAttribute('href') === links[i].getAttribute('href')) {
        alerts.push({ rule: 'link_redundant', message: 'Enlaces adyacentes duplicados', snippet: snippet(links[i]) })
      }
    }
  })

  // WAVE Alert: heading_skipped
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  let prev = 0
  headings.forEach((h) => {
    const lvl = Number(h.tagName.slice(1))
    if (prev > 0 && lvl - prev > 1) {
      alerts.push({ rule: 'heading_skipped', message: `Salto de encabezado h${prev} -> h${lvl}`, snippet: snippet(h) })
    }
    prev = lvl
  })

  // WAVE Alert: nested interactive
  document.querySelectorAll('a[href] button, button a[href], button button, a[href] a[href]').forEach((el) => {
    alerts.push({ rule: 'nested_interactive', message: 'Control interactivo anidado', snippet: snippet(el) })
  })

  // WAVE Alert: tabindex > 0
  document.querySelectorAll('[tabindex]').forEach((el) => {
    const ti = Number(el.getAttribute('tabindex'))
    if (ti > 0) {
      alerts.push({ rule: 'tabindex', message: `tabindex positivo (${ti})`, snippet: snippet(el) })
    }
  })

  const stats = {
    landmarks: document.querySelectorAll('header, nav, main, footer, [role="banner"], [role="main"], [role="contentinfo"]').length,
    headings: headings.length,
    labels: document.querySelectorAll('label').length,
    ariaAttributes: document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [aria-hidden], [role]').length,
  }

  return { errors, contrastErrors, alerts, stats }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderHtmlReport(report) {
  const statusOk =
    report.totals.axeViolations === 0 &&
    report.totals.waveErrors === 0 &&
    report.totals.contrastErrors === 0 &&
    report.totals.waveAlerts === 0

  const rowsHtml = report.audits
    .map((item) => {
      const ok =
        item.axeViolations.length === 0 &&
        item.wave.errors.length === 0 &&
        item.wave.contrastErrors.length === 0 &&
        item.wave.alerts.length === 0
      return `
        <tr>
          <td><strong>${escapeHtml(item.label)}</strong><br><small>${escapeHtml(item.stage)}</small></td>
          <td>${escapeHtml(item.viewport)}</td>
          <td><span class="badge ${ok ? 'badge-ok' : 'badge-err'}">${ok ? 'APROBADO' : 'OBSERVADO'}</span></td>
          <td class="num">${item.axePasses}</td>
          <td class="num ${item.axeViolations.length ? 'err-num' : 'ok-num'}">${item.axeViolations.length}</td>
          <td class="num ${item.wave.errors.length ? 'err-num' : 'ok-num'}">${item.wave.errors.length}</td>
          <td class="num ${item.wave.contrastErrors.length ? 'err-num' : 'ok-num'}">${item.wave.contrastErrors.length}</td>
          <td class="num ${item.wave.alerts.length ? 'warn-num' : 'ok-num'}">${item.wave.alerts.length}</td>
          <td class="num">${item.wave.stats.landmarks} / ${item.wave.stats.headings} / ${item.wave.stats.ariaAttributes}</td>
        </tr>
      `
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte de Accesibilidad WCAG 2.1 AA y WAVE - Los Olivos</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; line-height: 1.5; }
    header { background: #0f2a4a; color: #ffffff; padding: 28px 32px; border-bottom: 4px solid #f59e0b; }
    main { max-width: 1180px; margin: 28px auto; padding: 0 24px 48px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .kpi { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }
    .kpi .title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; }
    .kpi .val { font-size: 30px; font-weight: 800; margin-top: 6px; }
    .ok-num { color: #15803d; }
    .err-num { color: #b91c1c; }
    .warn-num { color: #b45309; }
    table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
    td.num { text-align: center; font-weight: 700; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-err { background: #fee2e2; color: #991b1b; }
    footer { margin-top: 28px; color: #475569; font-size: 13px; }
  </style>
</head>
<body>
  <header>
    <h1>Auditoría Automatizada de Accesibilidad (WCAG 2.1 AA + WAVE)</h1>
    <p>Municipalidad Distrital de Los Olivos &middot; Ejecutado en Google Chrome real el ${escapeHtml(report.generatedAt)}</p>
  </header>
  <main>
    <div class="kpis">
      <div class="kpi"><div class="title">Estado Global</div><div class="val ${statusOk ? 'ok-num' : 'err-num'}">${statusOk ? 'APROBADO' : 'CON OBSERVACIONES'}</div></div>
      <div class="kpi"><div class="title">Escenarios Auditados</div><div class="val">${report.audits.length}</div></div>
      <div class="kpi"><div class="title">Violaciones axe-core</div><div class="val ${report.totals.axeViolations ? 'err-num' : 'ok-num'}">${report.totals.axeViolations}</div></div>
      <div class="kpi"><div class="title">Errores WAVE</div><div class="val ${report.totals.waveErrors ? 'err-num' : 'ok-num'}">${report.totals.waveErrors}</div></div>
      <div class="kpi"><div class="title">Errores Contraste</div><div class="val ${report.totals.contrastErrors ? 'err-num' : 'ok-num'}">${report.totals.contrastErrors}</div></div>
      <div class="kpi"><div class="title">Alertas WAVE</div><div class="val ${report.totals.waveAlerts ? 'warn-num' : 'ok-num'}">${report.totals.waveAlerts}</div></div>
    </div>
    <h2>Detalle por Ruta, Estado y Viewport</h2>
    <table>
      <thead>
        <tr>
          <th>Ruta / Escenario</th>
          <th>Viewport</th>
          <th>Resultado</th>
          <th>Reglas axe OK</th>
          <th>Violaciones axe</th>
          <th>Errores WAVE</th>
          <th>Contraste</th>
          <th>Alertas WAVE</th>
          <th>Landmarks / H / ARIA</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <footer>
      <p>Generado por <code>tests/e2e/accesibilidad.selenium.mjs</code> (Selenium WebDriver + axe-core + motor heurístico WAVE). Modo visual disponible con <code>HEADLESS=false npm run test:a11y</code>.</p>
    </footer>
  </main>
</body>
</html>`
}

async function main() {
  const axeSource = fs.readFileSync(AXE_MIN_PATH, 'utf8')
  fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true })

  const { baseUrl, serverProcess, startedByScript } = await ensureServerRunning()
  const driver = await buildDriver()
  const audits = []

  try {
    console.log(`\n🔍 Iniciando auditoría visible WAVE + axe-core en Chrome (${HEADLESS ? 'headless' : 'ventana visible'}) sobre ${baseUrl}\n`)

    for (const target of ROUTES_TO_AUDIT) {
      await driver.manage().window().setRect({ width: target.viewport.width, height: target.viewport.height })
      await driver.get(`${baseUrl}${target.path}`)
      await driver.executeScript(`
        return new Promise((resolve) => {
          if (document.readyState === 'complete') return resolve();
          window.addEventListener('load', () => resolve(), { once: true });
        });
      `)
      await driver.sleep(300)

      const runAuditStage = async (stageName) => {
        await driver.executeScript(axeSource)
        const axeRes = await driver.executeAsyncScript(`
          const done = arguments[arguments.length - 1];
          window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
          }).then((res) => done({
            passes: res.passes.length,
            violations: res.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => n.target.join(' ')),
            })),
          })).catch((err) => done({ error: String(err) }));
        `)

        if (axeRes.error) {
          throw new Error(`Error ejecutando axe-core en ${target.path}: ${axeRes.error}`)
        }

        const waveRes = await driver.executeScript(`return (${browserWaveEvaluator.toString()})();`)

        if (!HEADLESS) {
          await driver.executeScript(`
            const prev = document.getElementById('a11y-visible-banner');
            if (prev) prev.remove();
            const bar = document.createElement('div');
            bar.id = 'a11y-visible-banner';
            bar.setAttribute('role', 'status');
            bar.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:99999;background:#0f2a4a;color:#fff;padding:10px 14px;border-radius:10px;font:600 13px system-ui;box-shadow:0 10px 25px rgba(0,0,0,0.3);border:2px solid #f59e0b';
            bar.textContent = arguments[0];
            document.body.appendChild(bar);
          `, `A11Y ${target.path} [${stageName}]: axe=${axeRes.violations.length} WAVE alerts=${waveRes.alerts.length}`)
          await driver.sleep(1000)
          await driver.executeScript(`document.getElementById('a11y-visible-banner')?.remove()`)
        }

        const entry = {
          path: target.path,
          label: target.label,
          stage: stageName,
          viewport: target.viewport.label,
          axePasses: axeRes.passes,
          axeViolations: axeRes.violations,
          wave: waveRes,
        }
        audits.push(entry)

        const statusIcon =
          axeRes.violations.length === 0 &&
          waveRes.errors.length === 0 &&
          waveRes.contrastErrors.length === 0 &&
          waveRes.alerts.length === 0
            ? '✅'
            : '❌'
        console.log(
          `${statusIcon} ${target.path} (${target.viewport.label} - ${stageName}) | axe OK: ${axeRes.passes} | axe viols: ${axeRes.violations.length} | WAVE err: ${waveRes.errors.length} | contraste: ${waveRes.contrastErrors.length} | alertas WAVE: ${waveRes.alerts.length}`
        )
      }

      await runAuditStage('Carga inicial')

      if (target.testInteractiveError) {
        const submitBtn = await driver.findElement({ css: 'form button[type="submit"]' })
        await submitBtn.click()
        await driver.sleep(250)
        await runAuditStage('Validación accesible con alertas')
      }
    }

    const totals = audits.reduce(
      (acc, cur) => {
        acc.axeViolations += cur.axeViolations.length
        acc.waveErrors += cur.wave.errors.length
        acc.contrastErrors += cur.wave.contrastErrors.length
        acc.waveAlerts += cur.wave.alerts.length
        return acc
      },
      { axeViolations: 0, waveErrors: 0, contrastErrors: 0, waveAlerts: 0 }
    )

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      headless: HEADLESS,
      totals,
      audits,
    }

    fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2), 'utf8')
    fs.writeFileSync(REPORT_HTML_PATH, renderHtmlReport(report), 'utf8')

    console.log(`\n📄 Reporte visible HTML: ${REPORT_HTML_PATH}`)
    console.log(`📄 Reporte JSON: ${REPORT_JSON_PATH}`)

    if (
      totals.axeViolations > 0 ||
      totals.waveErrors > 0 ||
      totals.contrastErrors > 0 ||
      totals.waveAlerts > 0
    ) {
      console.error('\n❌ Se detectaron incidencias de accesibilidad/WAVE:')
      for (const a of audits) {
        if (
          a.axeViolations.length ||
          a.wave.errors.length ||
          a.wave.contrastErrors.length ||
          a.wave.alerts.length
        ) {
          console.error(JSON.stringify(a, null, 2))
        }
      }
      process.exitCode = 1
    } else {
      console.log('\n🎉 Auditoría completada: 0 violaciones axe-core, 0 errores WAVE, 0 errores de contraste y 0 alertas WAVE.')
    }
  } finally {
    await driver.quit()
    if (startedByScript && serverProcess) {
      stopSpawnedServer(serverProcess)
    }
  }
}

main().catch((err) => {
  console.error('Fallo fatal en accesibilidad.selenium.mjs:', err)
  process.exit(1)
})
