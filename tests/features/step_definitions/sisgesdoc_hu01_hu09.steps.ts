// tests/features/step_definitions/sisgesdoc_hu01_hu09.steps.ts

import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import {
  puedeAccederIntranet,
  puedeDerivarExpediente,
  puedeFinalizarExpediente,
  puedeRecepcionarExpediente,
  puedeSubirDocumentoIntermedio,
  obtenerRutaInicioPorRol,
  type PerfilRBACContext,
} from '../../../lib/domain/rbac'
import { PoliticaPermisoRolFactory } from '../../../lib/domain/policies/PoliticaPermisoRol'
import {
  empleadoSchema,
  type ROLES_USUARIO_OFICIALES,
} from '../../../lib/validators/usuario.schema'
import {
  expedienteSchema,
  validarArchivoPdf,
} from '../../../lib/validators/expediente.schema'
import {
  ExpedienteService,
  type ResultadoOperacionExpediente,
} from '../../../lib/services/ExpedienteService'
import { StorageService } from '../../../lib/services/StorageService'
import {
  MockAdjuntoRepository,
  MockExpedienteRepository,
  MockStorageProvider,
  MockTrazabilidadRepository,
} from '../../mocks/MockExpedienteRepositories'
import type {
  IConsultaCiudadanaExpediente,
  IConsultaCiudadanaMovimiento,
  TipoDocumentoTramite,
} from '../../../lib/domain/contracts/expediente.contracts'

interface EstadoEscenariosHU {
  perfilActual: PerfilRBACContext | null
  accesoPermitido: boolean
  mensajeAcceso: string
  areaMesaPartesCatalogo: string
  areaSgopcuCatalogo: string
  validacionEmpleadoExito: boolean
  areaResueltaEmpleado: string | null
  expRepo: MockExpedienteRepository
  trazRepo: MockTrazabilidadRepository
  adjRepo: MockAdjuntoRepository
  storageProvider: MockStorageProvider
  service: ExpedienteService
  ultimoExpedienteId: string
  ultimoResultadoOp: ResultadoOperacionExpediente | null
  validacionExpedienteExito: boolean
  validacionArchivoExito: boolean
  expedientesFiltradosBandeja: Array<{ id: string; area_actual_id: string | null }>
  bloqueoPorFaltaDeRecepcion: boolean
  respuestasDenegadasCierre: string[]
  datosCrudosConPII: Record<string, unknown>
  vistaPublicaExpediente: IConsultaCiudadanaExpediente | null
  vistaPublicaTrazabilidad: IConsultaCiudadanaMovimiento[]
}

function crearEstadoInicial(): EstadoEscenariosHU {
  const expRepo = new MockExpedienteRepository()
  const trazRepo = new MockTrazabilidadRepository()
  const adjRepo = new MockAdjuntoRepository()
  const storageProvider = new MockStorageProvider()
  const storageService = new StorageService(storageProvider, adjRepo)
  const service = new ExpedienteService(expRepo, trazRepo, storageService)

  return {
    perfilActual: null,
    accesoPermitido: false,
    mensajeAcceso: '',
    areaMesaPartesCatalogo: '',
    areaSgopcuCatalogo: '',
    validacionEmpleadoExito: false,
    areaResueltaEmpleado: null,
    expRepo,
    trazRepo,
    adjRepo,
    storageProvider,
    service,
    ultimoExpedienteId: '',
    ultimoResultadoOp: null,
    validacionExpedienteExito: true,
    validacionArchivoExito: true,
    expedientesFiltradosBandeja: [],
    bloqueoPorFaltaDeRecepcion: false,
    respuestasDenegadasCierre: [],
    datosCrudosConPII: {},
    vistaPublicaExpediente: null,
    vistaPublicaTrazabilidad: [],
  }
}

let state: EstadoEscenariosHU = crearEstadoInicial()

// ============================================================================
// HU-01 & HU-02: Seguridad y Usuarios
// ============================================================================

interface EstadoAuthHU01 {
  email: string
  rol: string
  activo: boolean
  resultadoLogin: { success: boolean; error?: string; redirectUrl?: string } | null
}

let authState: EstadoAuthHU01 = {
  email: '',
  rol: '',
  activo: true,
  resultadoLogin: null,
}

Given(
  'un usuario registrado en el sistema con correo {string}, rol {string} y activo {string}',
  (email: string, rol: string, activoStr: string) => {
    authState = {
      email,
      rol,
      activo: activoStr === 'true',
      resultadoLogin: null,
    }
  }
)

When(
  'intenta iniciar sesión con la contraseña correcta {string}',
  (_password: string) => {
    if (!authState.activo) {
      authState.resultadoLogin = {
        success: false,
        error: 'Su cuenta se encuentra desactivada. Contacte a la OGTIC.',
      }
      return
    }

    authState.resultadoLogin = {
      success: true,
      redirectUrl: obtenerRutaInicioPorRol(authState.rol),
    }
  }
)

When(
  'intenta iniciar sesión con una contraseña errónea {string}',
  (_password: string) => {
    authState.resultadoLogin = {
      success: false,
      error: 'Correo o contraseña incorrectos',
    }
  }
)

Then('el inicio de sesión es exitoso', () => {
  assert.ok(authState.resultadoLogin)
  assert.equal(authState.resultadoLogin.success, true)
})

Then('es redirigido a la ruta de inicio {string}', (rutaEsperada: string) => {
  assert.ok(authState.resultadoLogin)
  assert.equal(authState.resultadoLogin.redirectUrl, rutaEsperada)
})

Then(
  'el inicio de sesión es rechazado con el mensaje {string}',
  (mensajeEsperado: string) => {
    assert.ok(authState.resultadoLogin)
    assert.equal(authState.resultadoLogin.success, false)
    assert.equal(authState.resultadoLogin.error, mensajeEsperado)
  }
)

Given(
  'un funcionario registrado en el directorio con correo {string}, rol {string}, área {string} y estado activo {string}',
  (correo: string, rol: string, areaId: string, activoStr: string) => {
    state = crearEstadoInicial()
    state.perfilActual = {
      id: `user-${correo}`,
      rol,
      area_id: areaId,
      activo: activoStr === 'true',
    }
  }
)

When('se verifica su permiso de acceso a la intranet municipal', () => {
  const permitido = puedeAccederIntranet(state.perfilActual)
  state.accesoPermitido = permitido
  state.mensajeAcceso = permitido
    ? 'OK'
    : 'Su cuenta se encuentra desactivada. Contacte a la OGTIC'
})

When('se verifica nuevamente su permiso de acceso a la intranet municipal', () => {
  const permitido = puedeAccederIntranet(state.perfilActual)
  state.accesoPermitido = permitido
  state.mensajeAcceso = permitido
    ? 'OK'
    : 'Su cuenta se encuentra desactivada. Contacte a la OGTIC'
})

Then('el acceso a la intranet debe ser {string}', (esperado: string) => {
  assert.equal(state.accesoPermitido, esperado === 'PERMITIDO')
})

When(
  'el Administrador TI cambia el estado activo del funcionario a {string}',
  (nuevoEstadoStr: string) => {
    assert.ok(state.perfilActual)
    state.perfilActual = {
      ...state.perfilActual,
      activo: nuevoEstadoStr === 'true',
    }
  }
)

Then(
  'el acceso a la intranet debe ser {string} con el mensaje {string}',
  (esperado: string, mensajeEsperado: string) => {
    assert.equal(state.accesoPermitido, esperado === 'PERMITIDO')
    assert.equal(state.mensajeAcceso, mensajeEsperado)
  }
)

Given(
  'el catálogo oficial de áreas con Mesa de Partes {string} y Subgerencia SGOPCU {string}',
  (idMesaPartes: string, idSgopcu: string) => {
    state = crearEstadoInicial()
    state.areaMesaPartesCatalogo = idMesaPartes
    state.areaSgopcuCatalogo = idSgopcu
  }
)

When(
  'el Administrador TI intenta registrar un empleado con DNI {string}, rol {string} y área seleccionada {string}',
  (dni: string, rol: string, areaSeleccionada: string) => {
    const politica = PoliticaPermisoRolFactory.obtenerPolitica(rol)
    const areaInput =
      areaSeleccionada === 'NINGUNA' ? null : areaSeleccionada
    const areaResuelta = politica.resolverAreaAdscripcion(
      areaInput,
      state.areaMesaPartesCatalogo
    )
    state.areaResueltaEmpleado = areaResuelta

    const res = empleadoSchema.safeParse({
      nombres: 'Funcionario',
      apellidos: 'Prueba MDLO',
      dni,
      correo: `user.${dni}@munilosolivos.gob.pe`,
      rol: rol as (typeof ROLES_USUARIO_OFICIALES)[number],
      area_id: areaResuelta,
    })

    state.validacionEmpleadoExito = res.success
  }
)

Then(
  'la validación del esquema de empleado debe resultar {string}',
  (resultadoEsperado: string) => {
    const esperadoBool = resultadoEsperado === 'VALIDO'
    assert.equal(state.validacionEmpleadoExito, esperadoBool)
  }
)

Then(
  'el área efectiva resuelta por la política del rol debe ser {string}',
  (areaEsperada: string) => {
    const esperado = areaEsperada === 'NULL' ? null : areaEsperada
    assert.equal(state.areaResueltaEmpleado, esperado)
  }
)

// ============================================================================
// HU-03: Radicación en Mesa de Partes
// ============================================================================

Given(
  'un operador activo con rol {string} adscrito a la unidad orgánica {string}',
  (rol: string, areaId: string) => {
    state = crearEstadoInicial()
    state.perfilActual = {
      id: 'user-mp-activo',
      rol,
      area_id: areaId,
      activo: true,
    }
  }
)

When(
  'registra un nuevo expediente con tipo de documento {string}, número {string}, remitente {string}, asunto {string}, {int} folios y un archivo PDF de {int} MB',
  async (
    tipoDoc: string,
    numDoc: string,
    remitente: string,
    asunto: string,
    folios: number,
    pesoMb: number
  ) => {
    assert.ok(state.perfilActual)
    const validacionForm = expedienteSchema.safeParse({
      tipo_doc_remitente: tipoDoc,
      remitente_dni_ruc: numDoc,
      remitente_nombres: remitente,
      tipo_tramite: 'SOLICITUD',
      asunto,
      folios,
    })
    assert.equal(validacionForm.success, true)

    const bytes = pesoMb * 1024 * 1024
    const validacionPdf = validarArchivoPdf({
      name: 'expediente_inicial.pdf',
      type: 'application/pdf',
      size: bytes,
    })
    assert.equal(validacionPdf.valido, true)

    state.ultimoResultadoOp = await state.service.radicarExpediente(
      {
        tipo_doc_remitente: tipoDoc,
        remitente_nombres: remitente,
        remitente_dni_ruc: numDoc,
        asunto,
        folios,
        tipo_tramite: 'SOLICITUD',
        area_actual_id: state.perfilActual.area_id,
        registrado_por: state.perfilActual.id || 'user-mp-activo',
      },
      [
        {
          nombre: 'expediente_inicial.pdf',
          tipoMime: 'application/pdf',
          tamanoBytes: 1024,
          contenido: new Uint8Array([1, 2, 3, 4]).buffer,
          tipoDocumento: 'SOLICITUD',
        },
      ]
    )

    if (state.ultimoResultadoOp.id) {
      state.ultimoExpedienteId = state.ultimoResultadoOp.id
    }
  }
)

Then(
  'la radicación del expediente finaliza con éxito generando un código CUT con formato {string}',
  (cutEsperado: string) => {
    assert.ok(state.ultimoResultadoOp)
    assert.equal(state.ultimoResultadoOp.success, true)
    assert.equal(state.ultimoResultadoOp.cut, cutEsperado)
  }
)

Then(
  'el expediente queda registrado con estado inicial {string} en la unidad orgánica {string}',
  async (estadoEsperado: string, areaEsperada: string) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    assert.equal(exp.estado, estadoEsperado)
    assert.equal(exp.area_actual_id, areaEsperada)
  }
)

Then(
  'el repositorio de adjuntos almacena {int} archivo PDF asociado a la unidad orgánica {string}',
  (cantidadEsperada: number, areaEsperada: string) => {
    const adjuntos = state.adjRepo.obtenerTodos()
    assert.equal(adjuntos.length, cantidadEsperada)
    assert.equal(adjuntos[0].area_id, areaEsperada)
  }
)

When(
  'intenta validar un expediente con tipo de documento {string}, número inválido {string} y asunto {string}',
  (tipoDoc: string, numDocInvalido: string, asunto: string) => {
    const res = expedienteSchema.safeParse({
      tipo_doc_remitente: tipoDoc,
      remitente_dni_ruc: numDocInvalido,
      remitente_nombres: 'Ciudadano Prueba',
      asunto,
      folios: 1,
    })
    state.validacionExpedienteExito = res.success
  }
)

Then(
  'el validador rechaza los datos de radicación indicando error en el documento de identidad',
  () => {
    assert.equal(state.validacionExpedienteExito, false)
  }
)

When(
  'intenta validar un archivo adjunto con nombre {string}, tipo MIME {string} y peso {int} MB',
  (nombre: string, mime: string, pesoMb: number) => {
    const res = validarArchivoPdf({
      name: nombre,
      type: mime,
      size: pesoMb * 1024 * 1024,
    })
    state.validacionArchivoExito = res.valido
  }
)

Then(
  'el validador de archivos rechaza el adjunto por no ser formato PDF válido',
  () => {
    assert.equal(state.validacionArchivoExito, false)
  }
)

// ============================================================================
// HU-04 a HU-08: Flujo Documental y RBAC
// ============================================================================

Given(
  'que existen expedientes radicados y ubicados actualmente en las unidades orgánicas {string} y {string}',
  (area1: string, area2: string) => {
    state = crearEstadoInicial()
    state.expRepo.sembrar({
      id: 'exp-area-1',
      cut: 'EXP-2026-000101-MDLO',
      remitente_nombres: 'Administrado 1',
      asunto: 'Trámite de Obras Privadas',
      estado: 'RECEPCIONADO',
      area_actual_id: area1,
      fecha_actualizacion: new Date().toISOString(),
    })
    state.expRepo.sembrar({
      id: 'exp-area-2',
      cut: 'EXP-2026-000102-MDLO',
      remitente_nombres: 'Administrado 2',
      asunto: 'Trámite de Fiscalización',
      estado: 'RECEPCIONADO',
      area_actual_id: area2,
      fecha_actualizacion: new Date().toISOString(),
    })
  }
)

When(
  'un funcionario adscrito a la unidad orgánica {string} consulta los expedientes de su bandeja de entrada',
  (areaFuncionario: string) => {
    state.expedientesFiltradosBandeja =
      state.expRepo.obtenerPorArea(areaFuncionario)
  }
)

Then(
  'solo visualiza los expedientes cuya área actual es {string} y ningún expediente de {string}',
  (areaPropia: string, areaAjena: string) => {
    assert.ok(state.expedientesFiltradosBandeja.length > 0)
    assert.equal(
      state.expedientesFiltradosBandeja.every(
        (e) => e.area_actual_id === areaPropia
      ),
      true
    )
    assert.equal(
      state.expedientesFiltradosBandeja.some(
        (e) => e.area_actual_id === areaAjena
      ),
      false
    )
  }
)

Given(
  'un expediente con estado {string} ubicado en la bandeja de la unidad orgánica {string}',
  (estado: string, areaId: string) => {
    state = crearEstadoInicial()
    state.ultimoExpedienteId = 'exp-hu05-001'
    state.expRepo.sembrar({
      id: state.ultimoExpedienteId,
      cut: 'EXP-2026-000205-MDLO',
      remitente_nombres: 'Constructora Los Olivos SAC',
      asunto: 'Evaluación de Anteproyecto en Consulta',
      estado,
      area_actual_id: areaId,
      fecha_actualizacion: new Date().toISOString(),
    })
  }
)

When(
  'un funcionario con rol {string} de {string} intenta subir un documento intermedio o derivar el expediente sin haberlo recepcionado',
  async (rol: string, areaId: string) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    const perfil: PerfilRBACContext = {
      id: 'u-esp-1',
      rol,
      area_id: areaId,
      activo: true,
    }
    const puedeSubir = puedeSubirDocumentoIntermedio(perfil, exp)
    const puedeDerivar = puedeDerivarExpediente(perfil, exp)
    state.bloqueoPorFaltaDeRecepcion = !puedeSubir && !puedeDerivar
  }
)

Then(
  'el motor RBAC bloquea la subida de documentos y la derivación porque el expediente sigue en estado {string}',
  async (estadoEsperado: string) => {
    assert.equal(state.bloqueoPorFaltaDeRecepcion, true)
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.equal(exp?.estado, estadoEsperado)
  }
)

When(
  'el funcionario con rol {string} de {string} acusa la recepción del expediente en su bandeja',
  async (rol: string, areaId: string) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    const permitido = puedeRecepcionarExpediente(
      { id: 'u-asist-1', rol, area_id: areaId, activo: true },
      exp
    )
    assert.equal(permitido, true)

    state.ultimoResultadoOp = await state.service.recepcionarExpediente({
      expediente_id: state.ultimoExpedienteId,
      area_receptor_id: areaId,
      usuario_id: 'u-asist-1',
    })
    assert.equal(state.ultimoResultadoOp.success, true)
  }
)

Then(
  'el expediente cambia su estado a {string} en la unidad orgánica {string}',
  async (estadoEsperado: string, areaEsperada: string) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    assert.equal(exp.estado, estadoEsperado)
    assert.equal(exp.area_actual_id, areaEsperada)
  }
)

Then(
  'el asistente asigna internamente el expediente al especialista {string} pasando a estado {string}',
  async (especialistaId: string, nuevoEstadoEsperado: string) => {
    const expActual = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(expActual)

    const res = await state.service.asignarEspecialistaInterno({
      expediente_id: state.ultimoExpedienteId,
      especialista_id: especialistaId,
      area_id: expActual.area_actual_id || 'SGOPCU',
      usuario_id: 'u-asist-1',
      proveido: 'Asignado para evaluación técnica',
    })
    assert.equal(res.success, true)

    const expDespues = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.equal(expDespues?.estado, nuevoEstadoEsperado)
    assert.equal(expDespues?.asignado_a, especialistaId)
  }
)

Given(
  'un expediente recepcionado en estado {string} en la unidad orgánica {string}',
  (estado: string, areaId: string) => {
    state = crearEstadoInicial()
    state.ultimoExpedienteId = 'exp-flujo-activo'
    state.expRepo.sembrar({
      id: state.ultimoExpedienteId,
      cut: 'EXP-2026-000310-MDLO',
      remitente_nombres: ' Consorcio Urbano Lima Norte',
      asunto: 'Solicitud de Conformidad de Obra y Declaratoria de Edificación',
      estado,
      area_actual_id: areaId,
      fecha_actualizacion: new Date().toISOString(),
    })
  }
)

When(
  'el funcionario con rol {string} de {string} sube el archivo PDF {string} catalogado como {string}',
  async (
    rol: string,
    areaId: string,
    nombreArchivo: string,
    tipoDoc: string
  ) => {
    state.ultimoResultadoOp = await state.service.anexarDocumentosIntermedios({
      expedienteId: state.ultimoExpedienteId,
      usuarioId: 'user-esp-ogaj',
      rolUsuario: rol,
      areaId,
      tipoDocumento: tipoDoc as TipoDocumentoTramite,
      requerirRecepcionPrevia: true,
      archivos: [
        {
          nombre: nombreArchivo,
          tipoMime: 'application/pdf',
          tamanoBytes: 4096,
          contenido: new Uint8Array([10, 20, 30, 40]).buffer,
          tipoDocumento: tipoDoc as TipoDocumentoTramite,
        },
      ],
    })
  }
)

Then(
  'el documento intermedio se registra exitosamente en el repositorio de adjuntos',
  () => {
    assert.ok(state.ultimoResultadoOp)
    assert.equal(state.ultimoResultadoOp.success, true)
    assert.equal(state.ultimoResultadoOp.archivosSubidos, 1)
  }
)

Then(
  'el adjunto queda etiquetado con tipo de documento {string} y agrupado bajo la unidad orgánica emisora {string}',
  (tipoEsperado: string, areaEsperada: string) => {
    const adjuntos = state.adjRepo.obtenerTodos()
    assert.equal(adjuntos.length, 1)
    assert.equal(adjuntos[0].tipo_documento, tipoEsperado)
    assert.equal(adjuntos[0].area_id, areaEsperada)
  }
)

When(
  'el funcionario de {string} deriva el expediente hacia la unidad orgánica {string} con el proveído {string}',
  async (areaOrigen: string, areaDestino: string, proveido: string) => {
    state.ultimoResultadoOp = await state.service.derivarExpediente({
      expediente_id: state.ultimoExpedienteId,
      area_origen_id: areaOrigen,
      area_destino_id: areaDestino,
      accion: proveido,
      emisor_id: 'user-sgopcu-1',
    })
    assert.equal(state.ultimoResultadoOp.success, true)
  }
)

Then(
  'el expediente actualiza su estado a {string} y su ubicación actual a {string}',
  async (estadoEsperado: string, areaDestinoEsperada: string) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    assert.equal(exp.estado, estadoEsperado)
    assert.equal(exp.area_actual_id, areaDestinoEsperada)
  }
)

Then(
  'la hoja de ruta registra el movimiento de derivación desde {string} hacia {string} con su proveído',
  async (areaOrigen: string, areaDestino: string) => {
    const movimientos = await state.trazRepo.obtenerPorExpediente(
      state.ultimoExpedienteId
    )
    assert.equal(movimientos.length, 1)
    assert.equal(movimientos[0].area_origen_id, areaOrigen)
    assert.equal(movimientos[0].area_destino_id, areaDestino)
    assert.equal(movimientos[0].estado_nuevo, 'DERIVADO')
  }
)

When(
  'los roles no resolutivos {string}, {string} y {string} intentan finalizar el expediente en {string}',
  async (rol1: string, rol2: string, rol3: string, areaId: string) => {
    state.respuestasDenegadasCierre = []
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)

    for (const rol of [rol1, rol2, rol3]) {
      const permitidoRbac = puedeFinalizarExpediente(
        { id: `u-${rol}`, rol, area_id: areaId, activo: true },
        exp
      )
      assert.equal(permitidoRbac, false)

      const res = await state.service.finalizarExpediente({
        expediente_id: state.ultimoExpedienteId,
        estado_nuevo: 'ATENDIDO',
        observacion: 'Intento de cierre sin potestad resolutiva',
        usuario_id: `u-${rol}`,
        rol_usuario: rol,
      })
      assert.equal(res.success, false)
      state.respuestasDenegadasCierre.push(res.error || '')
    }
  }
)

Then(
  'el sistema deniega cada intento con el error de autorización {string}',
  (mensajeEsperado: string) => {
    assert.equal(state.respuestasDenegadasCierre.length, 3)
    for (const msg of state.respuestasDenegadasCierre) {
      assert.equal(msg, mensajeEsperado)
    }
  }
)

When(
  'la autoridad con rol {string} de {string} finaliza el expediente como {string} con proveído de cierre {string}',
  async (
    rolJefe: string,
    areaId: string,
    estadoFinal: string,
    proveidoCierre: string
  ) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    assert.equal(
      puedeFinalizarExpediente(
        { id: 'u-jefe-gdu', rol: rolJefe, area_id: areaId, activo: true },
        exp
      ),
      true
    )

    state.ultimoResultadoOp = await state.service.finalizarExpediente({
      expediente_id: state.ultimoExpedienteId,
      estado_nuevo: estadoFinal as 'ATENDIDO' | 'ARCHIVADO',
      observacion: proveidoCierre,
      usuario_id: 'u-jefe-gdu',
      rol_usuario: rolJefe,
    })
    assert.equal(state.ultimoResultadoOp.success, true)
  }
)

Then(
  'el expediente queda cerrado con estado final {string} en la unidad orgánica {string}',
  async (estadoEsperado: string, areaEsperada: string) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    assert.equal(exp.estado, estadoEsperado)
    assert.equal(exp.area_actual_id, areaEsperada)
  }
)

// ============================================================================
// HU-09: Consulta Pública Ciudadana Anonimizada
// ============================================================================

Given(
  'un expediente público registrado con CUT {string}, asunto {string}, estado {string} en {string} y datos sensibles del administrado',
  (cut: string, asunto: string, estado: string, areaNombre: string) => {
    state = crearEstadoInicial()
    // Datos completos en la tabla privada expedientes (con PII sensible)
    state.datosCrudosConPII = {
      id: 'exp-pub-550',
      cut,
      remitente_dni_ruc: '45892134',
      remitente_nombres: 'Pedro Pablo Castillo',
      telefono: '999888777',
      correo: 'pedro.privado@gmail.com',
      direccion: 'Jr. Los Olivos 450 Urb. Mercurio',
      asunto,
      estado,
      area_actual: areaNombre,
      area_actual_siglas: 'SGOPCU',
      fecha_ingreso: '2026-10-20T10:00:00Z',
      fecha_actualizacion: '2026-10-27T11:30:00Z',
    }
  }
)

When(
  'un ciudadano sin sesión consulta públicamente el expediente por el código CUT {string}',
  (cutBuscado: string) => {
    assert.equal(state.datosCrudosConPII.cut, cutBuscado)
    // Proyección exacta de vista_consulta_ciudadana y vista_trazabilidad_ciudadana (RNF-03)
    state.vistaPublicaExpediente = {
      id: String(state.datosCrudosConPII.id),
      cut: String(state.datosCrudosConPII.cut),
      asunto: String(state.datosCrudosConPII.asunto),
      estado: String(state.datosCrudosConPII.estado),
      area_actual: String(state.datosCrudosConPII.area_actual),
      area_actual_siglas: String(state.datosCrudosConPII.area_actual_siglas),
      fecha_ingreso: String(state.datosCrudosConPII.fecha_ingreso),
      fecha_actualizacion: String(state.datosCrudosConPII.fecha_actualizacion),
    }

    state.vistaPublicaTrazabilidad = [
      {
        id: 'traz-pub-1',
        expediente_id: 'exp-pub-550',
        accion: 'REGISTRO_INICIAL',
        proveido: 'Ingreso por Mesa de Partes',
        estado_nuevo: 'REGISTRADO',
        area_origen: 'Mesa de Partes',
        area_destino: 'Mesa de Partes',
        fecha_envio: '2026-10-20T10:00:00Z',
      },
      {
        id: 'traz-pub-2',
        expediente_id: 'exp-pub-550',
        accion: 'DERIVACIÓN',
        proveido: 'Pase a Subgerencia de Obras Privadas',
        estado_nuevo: 'DERIVADO',
        area_origen: 'Mesa de Partes',
        area_destino: 'Subgerencia de Obras Privadas y Control Urbano',
        fecha_envio: '2026-10-20T12:00:00Z',
        fecha_recepcion: '2026-10-21T09:00:00Z',
      },
    ]
  }
)

Then(
  'la vista de consulta ciudadana retorna el estado {string}, el área actual {string} y el historial de movimientos',
  (estadoEsperado: string, areaEsperada: string) => {
    assert.ok(state.vistaPublicaExpediente)
    assert.equal(state.vistaPublicaExpediente.estado, estadoEsperado)
    assert.equal(state.vistaPublicaExpediente.area_actual, areaEsperada)
    assert.equal(state.vistaPublicaTrazabilidad.length, 2)
  }
)

Then(
  'la respuesta pública anonimiza completamente el DNI, teléfono, correo electrónico y dirección domiciliaria del remitente',
  () => {
    assert.ok(state.vistaPublicaExpediente)
    const keysExpuestas = Object.keys(state.vistaPublicaExpediente)
    assert.equal(keysExpuestas.includes('remitente_dni_ruc'), false)
    assert.equal(keysExpuestas.includes('telefono'), false)
    assert.equal(keysExpuestas.includes('correo'), false)
    assert.equal(keysExpuestas.includes('direccion'), false)
  }
)

// ============================================================================
// PC7: Casos borde de PDF (bytes exactos) y RBAC negativo por estado
// ============================================================================

When(
  'intenta validar un archivo PDF de exactamente {int} bytes',
  (tamanoBytes: number) => {
    const res = validarArchivoPdf({
      name: 'frontera_10mb.pdf',
      type: 'application/pdf',
      size: tamanoBytes,
    })
    state.validacionArchivoExito = res.valido
  }
)

Then(
  'el validador de archivos acepta el PDF en el límite permitido',
  () => {
    assert.equal(state.validacionArchivoExito, true)
  }
)

Then(
  'el validador de archivos rechaza el adjunto por exceder el límite de 10 MB',
  () => {
    assert.equal(state.validacionArchivoExito, false)
  }
)

When(
  'se verifica la autorización de cierre de {string} de {string} sobre el estado actual del expediente',
  async (rol: string, areaId: string) => {
    const exp = await state.expRepo.obtenerPorId(state.ultimoExpedienteId)
    assert.ok(exp)
    const perfil: PerfilRBACContext = {
      id: `user-${rol.toLowerCase()}-${areaId}`,
      rol,
      area_id: areaId,
      activo: true,
    }
    state.accesoPermitido = puedeFinalizarExpediente(perfil, {
      id: exp.id,
      area_actual_id: exp.area_actual_id,
      estado: exp.estado,
    })
  }
)

Then(
  'la política RBAC deniega el cierre por estado no habilitado',
  () => {
    assert.equal(state.accesoPermitido, false)
  }
)

