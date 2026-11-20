// tests/features/step_definitions/expedientes.steps.ts

import assert from 'node:assert/strict'
import { Given, When, Then, Before } from '@cucumber/cucumber'
import {
  PoliticaPermisoRol,
  PoliticaPermisoRolFactory,
} from '../../../lib/domain/policies/PoliticaPermisoRol'
import { ExpedienteService, type ResultadoOperacionExpediente } from '../../../lib/services/ExpedienteService'
import { StorageService } from '../../../lib/services/StorageService'
import {
  MockAdjuntoRepository,
  MockExpedienteRepository,
  MockStorageProvider,
  MockTrazabilidadRepository,
} from '../../mocks/MockExpedienteRepositories'
import type { EstadoCierreExpediente } from '../../../lib/domain/contracts/expediente.contracts'

interface ContextoPruebaBDD {
  rolActual: string
  politicaActual: PoliticaPermisoRol | null
  expedienteRepo: MockExpedienteRepository
  trazabilidadRepo: MockTrazabilidadRepository
  adjuntoRepo: MockAdjuntoRepository
  storageProvider: MockStorageProvider
  expedienteService: ExpedienteService
  expedienteIdActual: string
  ultimoResultado: ResultadoOperacionExpediente | null
}

let ctx: ContextoPruebaBDD

Before(() => {
  const expedienteRepo = new MockExpedienteRepository()
  const trazabilidadRepo = new MockTrazabilidadRepository()
  const adjuntoRepo = new MockAdjuntoRepository()
  const storageProvider = new MockStorageProvider()
  const storageService = new StorageService(storageProvider, adjuntoRepo)
  const expedienteService = new ExpedienteService(
    expedienteRepo,
    trazabilidadRepo,
    storageService
  )

  ctx = {
    rolActual: '',
    politicaActual: null,
    expedienteRepo,
    trazabilidadRepo,
    adjuntoRepo,
    storageProvider,
    expedienteService,
    expedienteIdActual: '',
    ultimoResultado: null,
  }
})

// ============================================================================
// ESCENARIO 1: Validación de reglas de negocio y permisos RBAC por rol
// ============================================================================

Given('un funcionario municipal autenticado con el rol {string}', (rol: string) => {
  ctx.rolActual = rol
})

When('se evalúa la política de permisos polimórfica para el rol {string}', (rol: string) => {
  ctx.politicaActual = PoliticaPermisoRolFactory.obtenerPolitica(rol)
})

Then('el permiso para radicar expediente inicial debe ser {string}', (esperado: string) => {
  assert.ok(ctx.politicaActual, 'La política debe estar inicializada')
  const valorEsperado = esperado === 'SI'
  assert.equal(ctx.politicaActual.puedeRadicarExpediente(), valorEsperado)
})

Then('el permiso para subir documentos intermedios debe ser {string}', (esperado: string) => {
  assert.ok(ctx.politicaActual, 'La política debe estar inicializada')
  const valorEsperado = esperado === 'SI'
  assert.equal(ctx.politicaActual.puedeSubirDocumentoIntermedio(), valorEsperado)
})

Then('el permiso para finalizar o archivar expediente debe ser {string}', (esperado: string) => {
  assert.ok(ctx.politicaActual, 'La política debe estar inicializada')
  const valorEsperado = esperado === 'SI'
  assert.equal(ctx.politicaActual.puedeFinalizarOArchivar(), valorEsperado)
})

Then('el permiso de acceso al panel de administración debe ser {string}', (esperado: string) => {
  assert.ok(ctx.politicaActual, 'La política debe estar inicializada')
  const valorEsperado = esperado === 'SI'
  assert.equal(ctx.politicaActual.puedeAccederAdmin(), valorEsperado)
})

// ============================================================================
// ESCENARIO 2: Flujo de derivación y cierre con sustitución de estados y trazabilidad
// ============================================================================

Given(
  'un expediente inicial radicado en {string} con asunto {string}',
  async (areaInicial: string, asunto: string) => {
    const res = await ctx.expedienteService.radicarExpediente({
      remitente_nombres: 'Constructora Norte Perú SAC',
      remitente_dni_ruc: '20601234567',
      asunto,
      folios: 25,
      tipo_tramite: 'FUT',
      area_actual_id: areaInicial,
      registrado_por: 'user-mp-01',
    })

    assert.equal(res.success, true)
    assert.ok(res.id)
    ctx.expedienteIdActual = res.id
  }
)

When(
  'el operador de {string} recepciona el expediente en bandeja',
  async (areaReceptora: string) => {
    ctx.ultimoResultado = await ctx.expedienteService.recepcionarExpediente({
      expediente_id: ctx.expedienteIdActual,
      area_receptor_id: areaReceptora,
      usuario_id: 'user-mp-01',
    })
    assert.equal(ctx.ultimoResultado.success, true)
  }
)

When(
  'el operador deriva el expediente desde {string} hacia {string} con proveído {string}',
  async (areaOrigen: string, areaDestino: string, proveido: string) => {
    ctx.ultimoResultado = await ctx.expedienteService.derivarExpediente({
      expediente_id: ctx.expedienteIdActual,
      area_origen_id: areaOrigen,
      area_destino_id: areaDestino,
      accion: proveido,
      emisor_id: 'user-mp-01',
    })
    assert.equal(ctx.ultimoResultado.success, true)
  }
)

When(
  'el especialista de {string} recepciona el expediente derivado',
  async (areaReceptora: string) => {
    ctx.ultimoResultado = await ctx.expedienteService.recepcionarExpediente({
      expediente_id: ctx.expedienteIdActual,
      area_receptor_id: areaReceptora,
      usuario_id: 'user-esp-obras',
    })
    assert.equal(ctx.ultimoResultado.success, true)
  }
)

When(
  'un usuario con rol {string} intenta finalizar el expediente como {string}',
  async (rol: string, estadoIntento: string) => {
    ctx.ultimoResultado = await ctx.expedienteService.finalizarExpediente({
      expediente_id: ctx.expedienteIdActual,
      estado_nuevo: estadoIntento as EstadoCierreExpediente,
      observacion: 'Intento sin permisos de jefatura',
      usuario_id: 'user-esp-obras',
      rol_usuario: rol,
    })
  }
)

Then(
  'el sistema rechaza el cierre por política RBAC manteniendo el estado en {string}',
  async (estadoEsperado: string) => {
    assert.ok(ctx.ultimoResultado)
    assert.equal(ctx.ultimoResultado.success, false)
    assert.ok(ctx.ultimoResultado.error?.includes('Solo el Jefe de Área'))

    const exp = await ctx.expedienteRepo.obtenerPorId(ctx.expedienteIdActual)
    assert.ok(exp)
    assert.equal(exp.estado, estadoEsperado)
  }
)

When(
  'un usuario con rol {string} finaliza el expediente como {string} con observación {string}',
  async (rol: string, estadoFinal: string, observacion: string) => {
    ctx.ultimoResultado = await ctx.expedienteService.finalizarExpediente({
      expediente_id: ctx.expedienteIdActual,
      estado_nuevo: estadoFinal as EstadoCierreExpediente,
      observacion,
      usuario_id: 'user-jefe-obras',
      rol_usuario: rol,
    })
    assert.equal(ctx.ultimoResultado.success, true)
  }
)

Then(
  'el expediente cambia su estado final a {string} en el área {string}',
  async (estadoFinal: string, areaEsperada: string) => {
    const exp = await ctx.expedienteRepo.obtenerPorId(ctx.expedienteIdActual)
    assert.ok(exp)
    assert.equal(exp.estado, estadoFinal)
    assert.equal(exp.area_actual_id, areaEsperada)
  }
)

Then(
  'la hoja de ruta registra exactamente {int} movimientos auditables en orden cronológico',
  async (cantidadEsperada: number) => {
    const historial = await ctx.trazabilidadRepo.obtenerPorExpediente(ctx.expedienteIdActual)
    assert.equal(historial.length, cantidadEsperada)
    assert.equal(historial[0].estado_nuevo, 'REGISTRADO')
    assert.equal(historial[1].estado_nuevo, 'RECEPCIONADO')
    assert.equal(historial[2].estado_nuevo, 'DERIVADO')
    assert.equal(historial[3].estado_nuevo, 'RECEPCIONADO')
    assert.equal(historial[4].estado_nuevo, 'ATENDIDO')
  }
)
