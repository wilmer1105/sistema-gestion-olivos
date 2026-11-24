import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const require = createRequire(import.meta.url)

function parseProperties(content) {
  const props = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    const val = line.slice(eqIndex + 1).trim()
    props[key] = val
  }
  return props
}

function normalizeSlash(p) {
  return p.replace(/\\/g, '/')
}

function validateSonarXml(xmlPath) {
  if (!fs.existsSync(xmlPath)) {
    throw new Error(`No existe el reporte XML de SonarQube en ${xmlPath}`)
  }
  const xml = fs.readFileSync(xmlPath, 'utf8')
  if (!xml.includes('<testExecutions version="1">') || !xml.includes('</testExecutions>')) {
    throw new Error('reports/sonar-report.xml no tiene estructura válida <testExecutions version="1">')
  }

  const fileMatches = [...xml.matchAll(/<file\s+path="([^"]+)"/g)].map((m) => m[1])
  const testCaseMatches = [...xml.matchAll(/<testCase\s+name="([^"]+)"\s+duration="(\d+)"/g)]
  const failureMatches = [...xml.matchAll(/<(failure|error)\b/g)]

  if (fileMatches.length === 0) {
    throw new Error('reports/sonar-report.xml no contiene ningún elemento <file path="...">')
  }
  if (testCaseMatches.length === 0) {
    throw new Error('reports/sonar-report.xml no contiene ningún <testCase>')
  }

  for (const relPath of fileMatches) {
    const abs = path.resolve(ROOT_DIR, relPath)
    if (!fs.existsSync(abs)) {
      throw new Error(`Archivo de prueba referenciado en sonar-report.xml no existe: ${relPath}`)
    }
  }

  return {
    files: fileMatches,
    testCasesCount: testCaseMatches.length,
    failuresOrErrors: failureMatches.length,
  }
}

function validateLcov(lcovPath, allowedPrefixes) {
  if (!fs.existsSync(lcovPath)) {
    throw new Error(`No existe el reporte LCOV en ${lcovPath}`)
  }
  const content = fs.readFileSync(lcovPath, 'utf8')
  if (!content.trim()) {
    throw new Error('coverage/lcov.info está vacío')
  }

  const sfMatches = [...content.matchAll(/^SF:(.+)$/gm)].map((m) => normalizeSlash(m[1].trim()))
  if (sfMatches.length === 0) {
    throw new Error('coverage/lcov.info no contiene registros SF:')
  }

  const outsideSources = []
  const missingFiles = []

  for (const sf of sfMatches) {
    const rel = path.isAbsolute(sf)
      ? normalizeSlash(path.relative(ROOT_DIR, sf))
      : sf
    const matchesPrefix = allowedPrefixes.some(
      (prefix) => rel === prefix || rel.startsWith(`${prefix}/`)
    )
    if (!matchesPrefix) {
      outsideSources.push(rel)
    }
    if (!fs.existsSync(path.resolve(ROOT_DIR, rel))) {
      missingFiles.push(rel)
    }
  }

  if (outsideSources.length > 0) {
    throw new Error(
      `coverage/lcov.info incluye archivos fuera de sonar.sources (${allowedPrefixes.join(',')}): ${outsideSources.join(', ')}`
    )
  }
  if (missingFiles.length > 0) {
    throw new Error(`coverage/lcov.info referencia archivos inexistentes: ${missingFiles.join(', ')}`)
  }

  let linesFound = 0
  let linesHit = 0
  let funcsFound = 0
  let funcsHit = 0
  let branchesFound = 0
  let branchesHit = 0

  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith('LF:')) linesFound += Number(line.slice(3))
    else if (line.startsWith('LH:')) linesHit += Number(line.slice(3))
    else if (line.startsWith('FNF:')) funcsFound += Number(line.slice(4))
    else if (line.startsWith('FNH:')) funcsHit += Number(line.slice(4))
    else if (line.startsWith('BRF:')) branchesFound += Number(line.slice(4))
    else if (line.startsWith('BRH:')) branchesHit += Number(line.slice(4))
  }

  return {
    filesCount: sfMatches.length,
    linesFound,
    linesHit,
    funcsFound,
    funcsHit,
    branchesFound,
    branchesHit,
  }
}

async function verifySonarScannerPackage(sonarProps) {
  const pkgJsonPath = require.resolve('@sonar/scan/package.json', { paths: [ROOT_DIR] })
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
  const propertiesModPath = path.join(path.dirname(pkgJsonPath), 'src', 'properties.js')
  const propsMod = await import(pathToFileURL(propertiesModPath).href)

  if (typeof propsMod.getProperties !== 'function') {
    throw new Error('No se encontró getProperties en @sonar/scan/src/properties.js')
  }

  const resolvedViaSonarSdk = propsMod.getProperties(
    {
      serverUrl: process.env.SONAR_HOST_URL || 'http://127.0.0.1:9000',
      options: {
        'sonar.projectBaseDir': ROOT_DIR,
      },
    },
    Date.now(),
    []
  )

  if (!resolvedViaSonarSdk['sonar.projectKey']) {
    throw new Error('@sonar/scan no resolvió sonar.projectKey desde sonar-project.properties')
  }
  if (
    sonarProps['sonar.testExecutionReportPaths'] &&
    resolvedViaSonarSdk['sonar.testExecutionReportPaths'] !==
      sonarProps['sonar.testExecutionReportPaths']
  ) {
    throw new Error('sonar.testExecutionReportPaths resuelto por @sonar/scan no coincide con sonar-project.properties')
  }
  if (
    sonarProps['sonar.javascript.lcov.reportPaths'] &&
    resolvedViaSonarSdk['sonar.javascript.lcov.reportPaths'] !==
      sonarProps['sonar.javascript.lcov.reportPaths']
  ) {
    throw new Error('sonar.javascript.lcov.reportPaths resuelto por @sonar/scan no coincide con sonar-project.properties')
  }

  return {
    scannerVersion: pkg.version,
    resolvedKeysCount: Object.keys(resolvedViaSonarSdk).length,
    resolvedProjectKey: resolvedViaSonarSdk['sonar.projectKey'],
  }
}

async function main() {
  const propsPath = path.join(ROOT_DIR, 'sonar-project.properties')
  if (!fs.existsSync(propsPath)) {
    throw new Error('No se encontró sonar-project.properties en la raíz del repositorio')
  }
  const sonarProps = parseProperties(fs.readFileSync(propsPath, 'utf8'))
  const allowedSources = (sonarProps['sonar.sources'] || 'app,components,lib')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const xmlRel = sonarProps['sonar.testExecutionReportPaths'] || 'reports/sonar-report.xml'
  const lcovRel = sonarProps['sonar.javascript.lcov.reportPaths'] || 'coverage/lcov.info'

  const xmlStats = validateSonarXml(path.join(ROOT_DIR, xmlRel))
  const lcovStats = validateLcov(path.join(ROOT_DIR, lcovRel), allowedSources)
  const sdkStats = await verifySonarScannerPackage(sonarProps)

  const linePct = lcovStats.linesFound
    ? ((lcovStats.linesHit / lcovStats.linesFound) * 100).toFixed(2)
    : '0.00'

  console.log('\n✅ Validación completa de reportes SonarQube:')
  console.log(`   - @sonar/scan v${sdkStats.scannerVersion} (projectKey="${sdkStats.resolvedProjectKey}", propiedades resueltas: ${sdkStats.resolvedKeysCount})`)
  console.log(`   - ${xmlRel}: ${xmlStats.files.length} archivos de prueba, ${xmlStats.testCasesCount} casos, ${xmlStats.failuresOrErrors} fallos/errores`)
  console.log(`   - ${lcovRel}: ${lcovStats.filesCount} archivos fuente (100% dentro de [${allowedSources.join(', ')}]), líneas ${lcovStats.linesHit}/${lcovStats.linesFound} (${linePct}%)`)

  if (xmlStats.failuresOrErrors > 0) {
    throw new Error(`El reporte ${xmlRel} registró ${xmlStats.failuresOrErrors} fallos o errores de pruebas`)
  }
}

main().catch((err) => {
  console.error('\n❌ Error validando reportes de SonarQube:', err.message)
  process.exit(1)
})
