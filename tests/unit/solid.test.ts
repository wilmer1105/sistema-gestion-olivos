// tests/unit/solid.test.ts

import { describe, expect, it, beforeEach } from 'vitest'
import { ExpedienteValidator } from '@/lib/services/ExpedienteValidator'
import { EmpleadoAdminValidator } from '@/lib/services/EmpleadoAdminService'
import { StorageService } from '@/lib/services/StorageService'
import { TrazabilidadLogger } from '@/lib/services/TrazabilidadLogger'
import { ExpedienteService } from '@/lib/services/ExpedienteService'
import {
  PoliticaPermisoRol,
  PoliticaMesaPartes,
  PoliticaEspecialista,
  PoliticaJefeArea,
  PoliticaAdminTI,
  PoliticaPermisoRolFactory,
} from '@/lib/domain/policies/PoliticaPermisoRol'
import {
  type AccionExpedienteHandler,
  RegistroInicialHandler,
  RecepcionHandler,
  DerivacionHandler,
  CierreExpedienteHandler,
} from '@/lib/domain/handlers/AccionExpedienteHandler'
import {
  MockAdjuntoRepository,
  MockExpedienteRepository,
  MockStorageProvider,
  MockTrazabilidadRepository,
} from '../mocks/MockExpedienteRepositories'

describe('Arquitectura SOLID - Pruebas Unitarias (Vitest)', () => {
  // =========================================================================
  // 1. PRINCIPIO DE RESPONSABILIDAD ÚNICA (SRP)
  // =========================================================================
  describe('1. SRP: Clases con Responsabilidad Única aisladas', () => {
    it('ExpedienteValidator valida exclusivamente reglas de datos de radicación, derivación y cierre', () => {
      const validator = new ExpedienteValidator()

      // Radicación inválida
      expect(
        validator.validarRadicacion({
          remitente_nombres: 'Jo',
          remitente_dni_ruc: '45892134',
          asunto: 'Solicitud de licencia municipal',
        })
      ).toEqual({
        valido: false,
        error: 'El nombre o razón social debe tener al menos 3 caracteres.',
      })

      // Radicación válida
      expect(
        validator.validarRadicacion({
          remitente_nombres: 'Juan Pérez Quispe',
          remitente_dni_ruc: '45892134',
          asunto: 'Solicitud de licencia de funcionamiento',
          folios: 3,
        })
      ).toEqual({ valido: true })

      // Construcción de asunto descriptivo
      expect(
        validator.construirAsuntoDescriptivo(
          'Oficio',
          'Remite informe técnico',
          'Av. Las Palmeras 300'
        )
      ).toBe('[Oficio] Remite informe técnico (Dirección: Av. Las Palmeras 300)')

      // Derivación inválida por falta de área destino
      expect(
        validator.validarDerivacion({
          expediente_id: 'exp-1',
          area_origen_id: 'area-mp',
          area_destino_id: '',
        })
      ).toEqual({
        valido: false,
        error: 'El área de destino (area_destino_id) no puede ser undefined o null.',
      })

      // Cierre válido e inválido
      expect(
        validator.validarCierre({
          expediente_id: 'exp-1',
          estado_nuevo: 'ATENDIDO',
        })
      ).toEqual({ valido: true })

      expect(
        validator.validarCierre({
          expediente_id: 'exp-1',
          estado_nuevo: 'EN_TRAMITE',
        })
      ).toEqual({
        valido: false,
        error: "El estado de cierre solo puede ser 'ATENDIDO' o 'ARCHIVADO'.",
      })
    })

    it('EmpleadoAdminValidator valida datos de empleados y resuelve áreas según el rol', () => {
      const adminValidator = new EmpleadoAdminValidator()

      expect(
        adminValidator.resolverAreaPorRol('ADMIN_TI', 'area-gerencia')
      ).toBeNull()

      expect(
        adminValidator.resolverAreaPorRol(
          'MESA_PARTES',
          'area-cualquiera',
          'area-mesa-partes-oficial'
        )
      ).toBe('area-mesa-partes-oficial')

      expect(
        adminValidator.resolverAreaPorRol('ESPECIALISTA', 'area-catastro')
      ).toBe('area-catastro')
    })

    it('StorageService sanitiza nombres, sube binarios al StorageProvider y registra metadatos en AdjuntoRepository', async () => {
      const mockStorage = new MockStorageProvider()
      const mockAdjuntoRepo = new MockAdjuntoRepository()
      const storageService = new StorageService(mockStorage, mockAdjuntoRepo)

      expect(storageService.sanitizarNombreArchivo('Informe N° 01-2026 (Final).pdf')).toBe(
        'Informe_N__01-2026__Final_.pdf'
      )

      const buffer = new Uint8Array([1, 2, 3, 4]).buffer
      const res = await storageService.subirYRegistrarArchivos({
        expedienteId: 'exp-100',
        usuarioId: 'user-esp-1',
        areaId: 'area-obras',
        archivos: [
          {
            nombre: 'Resolucion 001.pdf',
            tipoMime: 'application/pdf',
            tamanoBytes: 4,
            contenido: buffer,
          },
        ],
      })

      expect(res.exito).toBe(true)
      expect(res.cantidadSubidos).toBe(1)
      expect(mockStorage.archivosSubidos).toHaveLength(1)
      expect(mockAdjuntoRepo.obtenerTodos()).toHaveLength(1)
      expect(mockAdjuntoRepo.obtenerTodos()[0].nombre_archivo).toBe('Resolucion 001.pdf')
    })

    it('TrazabilidadLogger registra hitos de hoja de ruta de manera aislada', async () => {
      const mockTrazRepo = new MockTrazabilidadRepository()
      const logger = new TrazabilidadLogger(mockTrazRepo)

      await logger.registrarIngresoInicial({
        expedienteId: 'exp-200',
        areaId: 'area-mp',
        usuarioId: 'user-mp',
        tipoTramite: 'Solicitud',
      })

      await logger.registrarAnexoDocumental({
        expedienteId: 'exp-200',
        areaId: 'area-legal',
        usuarioId: 'user-esp',
        cantidadArchivos: 2,
      })

      const historial = await mockTrazRepo.obtenerPorExpediente('exp-200')
      expect(historial).toHaveLength(2)
      expect(historial[0].accion).toBe('REGISTRO_INICIAL')
      expect(historial[1].accion).toBe('ANEXO_DOCUMENTAL')
    })
  })

  // =========================================================================
  // 2. PRINCIPIOS ABIERTO/CERRADO (OCP) Y SUSTITUCIÓN DE LISKOV (LSP)
  // =========================================================================
  describe('2. OCP y LSP: Polimorfismo en Políticas RBAC y Manejadores de Acciones', () => {
    it('LSP: Todas las implementaciones de PoliticaPermisoRol cumplen el contrato base sin lanzar excepciones', () => {
      const politicas: PoliticaPermisoRol[] = PoliticaPermisoRolFactory.obtenerTodas()
      const acciones = [
        'REGISTRO_INICIAL',
        'RECEPCION',
        'DERIVACION',
        'ANEXO_DOCUMENTAL',
        'CIERRE',
      ] as const

      for (const politica of politicas) {
        // Toda política debe tener un identificador de rol válido
        expect(typeof politica.rol).toBe('string')
        expect(politica.rol.length).toBeGreaterThan(0)

        // Toda política debe responder determinísticamente a cualquier acción sin lanzar errores
        for (const accion of acciones) {
          const resultado = politica.verificarPermisoAccion(accion)
          expect(typeof resultado.autorizado).toBe('boolean')
          if (!resultado.autorizado) {
            expect(typeof resultado.motivo).toBe('string')
            expect(resultado.motivo!.length).toBeGreaterThan(5)
          }
        }
      }

      // Verificación específica de la matriz RBAC institucional
      const mp = new PoliticaMesaPartes()
      const esp = new PoliticaEspecialista()
      const jefe = new PoliticaJefeArea()
      const admin = new PoliticaAdminTI()

      expect(mp.puedeRadicarExpediente()).toBe(true)
      expect(mp.puedeFinalizarOArchivar()).toBe(false)

      expect(esp.puedeSubirDocumentoIntermedio()).toBe(true)
      expect(esp.puedeFinalizarOArchivar()).toBe(false)

      expect(jefe.puedeSubirDocumentoIntermedio()).toBe(true)
      expect(jefe.puedeFinalizarOArchivar()).toBe(true)

      expect(admin.puedeAccederAdmin()).toBe(true)
      expect(admin.resolverAreaAdscripcion('cualquier-area')).toBeNull()
    })

    it('OCP: Permite extender y registrar una nueva política de rol sin modificar el código base', () => {
      class PoliticaAuditorOCI extends PoliticaPermisoRol {
        readonly rol = 'AUDITOR_OCI'
        puedeRadicarExpediente(): boolean {
          return false
        }
        puedeRecepcionar(): boolean {
          return false
        }
        puedeDerivar(): boolean {
          return false
        }
        puedeSubirDocumentoIntermedio(): boolean {
          return false
        }
        puedeFinalizarOArchivar(): boolean {
          return false
        }
        puedeAccederAdmin(): boolean {
          return false
        }
      }

      PoliticaPermisoRolFactory.registrarPolitica('AUDITOR_OCI', new PoliticaAuditorOCI())
      const politicaRecuperada = PoliticaPermisoRolFactory.obtenerPolitica('AUDITOR_OCI')

      expect(politicaRecuperada.rol).toBe('AUDITOR_OCI')
      expect(politicaRecuperada.verificarPermisoAccion('CIERRE').autorizado).toBe(false)
    })

    it('LSP y OCP: Iteración polimórfica sobre AccionExpedienteHandler ejecutando transiciones de estado válidas', async () => {
      const mockExpRepo = new MockExpedienteRepository()
      const mockTrazRepo = new MockTrazabilidadRepository()

      mockExpRepo.sembrar({
        id: 'exp-lsp-001',
        cut: 'EXP-2026-000001-MDLO',
        remitente_nombres: 'María López',
        asunto: '[FUT] Certificado de Parámetros Urbanísticos',
        estado: 'REGISTRADO',
        area_actual_id: 'area-mp',
        fecha_actualizacion: new Date().toISOString(),
      })

      // Secuencia polimórfica de manejadores que sustituyen a la clase base AccionExpedienteHandler
      const pasos: Array<{
        handler: AccionExpedienteHandler
        contexto: {
          usuarioId: string
          areaOrigenId?: string
          areaDestinoId?: string
          proveido?: string
          estadoCierre?: 'ATENDIDO' | 'ARCHIVADO'
        }
        estadoEsperado: string
      }> = [
        {
          handler: new RegistroInicialHandler(),
          contexto: {
            usuarioId: 'u-mp',
            areaOrigenId: 'area-mp',
            areaDestinoId: 'area-mp',
          },
          estadoEsperado: 'REGISTRADO',
        },
        {
          handler: new RecepcionHandler(),
          contexto: {
            usuarioId: 'u-mp',
            areaDestinoId: 'area-mp',
          },
          estadoEsperado: 'RECEPCIONADO',
        },
        {
          handler: new DerivacionHandler(),
          contexto: {
            usuarioId: 'u-mp',
            areaOrigenId: 'area-mp',
            areaDestinoId: 'area-catastro',
            proveido: 'Pase a Catastro para evaluación técnica',
          },
          estadoEsperado: 'DERIVADO',
        },
        {
          handler: new RecepcionHandler(),
          contexto: {
            usuarioId: 'u-jefe-catastro',
            areaDestinoId: 'area-catastro',
          },
          estadoEsperado: 'RECEPCIONADO',
        },
        {
          handler: new CierreExpedienteHandler(),
          contexto: {
            usuarioId: 'u-jefe-catastro',
            estadoCierre: 'ATENDIDO',
            proveido: 'Se emitió Certificado N° 120-2026',
          },
          estadoEsperado: 'ATENDIDO',
        },
      ]

      for (const paso of pasos) {
        const estadoActual = await mockExpRepo.obtenerPorId('exp-lsp-001')
        expect(estadoActual).not.toBeNull()

        const res = await paso.handler.ejecutar(
          estadoActual!,
          paso.contexto,
          mockExpRepo,
          mockTrazRepo
        )

        expect(res.exito).toBe(true)
        expect(res.estadoNuevo).toBe(paso.estadoEsperado)
      }

      const trazabilidad = await mockTrazRepo.obtenerPorExpediente('exp-lsp-001')
      expect(trazabilidad).toHaveLength(5)
      expect(trazabilidad[4].estado_nuevo).toBe('ATENDIDO')
    })
  })

  // =========================================================================
  // 3. INVERSIÓN DE DEPENDENCIAS (DIP) Y SEGREGACIÓN DE INTERFACES (ISP)
  // =========================================================================
  describe('3. DIP e ISP: ExpedienteService inyectado con MockExpedienteRepository sin tocar BD real', () => {
    let expRepo: MockExpedienteRepository
    let trazRepo: MockTrazabilidadRepository
    let adjRepo: MockAdjuntoRepository
    let storageProvider: MockStorageProvider
    let service: ExpedienteService

    beforeEach(() => {
      expRepo = new MockExpedienteRepository()
      trazRepo = new MockTrazabilidadRepository()
      adjRepo = new MockAdjuntoRepository()
      storageProvider = new MockStorageProvider()
      const storageService = new StorageService(storageProvider, adjRepo)
      service = new ExpedienteService(expRepo, trazRepo, storageService)
    })

    it('Ejecuta el ciclo de vida completo (radicar -> recepcionar -> anexar -> derivar -> finalizar) en memoria', async () => {
      // 1. Radicación en Mesa de Partes
      const radicacion = await service.radicarExpediente(
        {
          remitente_nombres: 'Inversiones Los Olivos SAC',
          remitente_dni_ruc: '20554433221',
          asunto: 'Solicitud de Inspección Técnica de Seguridad en Edificaciones',
          folios: 12,
          tipo_tramite: 'Solicitud',
          area_actual_id: 'area-mesa-partes',
          registrado_por: 'user-mp-01',
        },
        [
          {
            nombre: 'plano_arquitectura.pdf',
            tipoMime: 'application/pdf',
            tamanoBytes: 1024,
            contenido: new Uint8Array([10, 20, 30]).buffer,
          },
        ]
      )

      expect(radicacion.success).toBe(true)
      expect(radicacion.id).toBeDefined()
      expect(radicacion.cut).toBe('EXP-2026-000001-MDLO')
      const expedienteId = radicacion.id!

      // 2. Recepción en Mesa de Partes
      const recepcion = await service.recepcionarExpediente({
        expediente_id: expedienteId,
        area_receptor_id: 'area-mesa-partes',
        usuario_id: 'user-mp-01',
      })
      expect(recepcion.success).toBe(true)

      // 3. Derivación a Defensa Civil
      const derivacion = await service.derivarExpediente({
        expediente_id: expedienteId,
        area_origen_id: 'area-mesa-partes',
        area_destino_id: 'area-defensa-civil',
        accion: 'Para inspección técnica ITSE',
        emisor_id: 'user-mp-01',
      })
      expect(derivacion.success).toBe(true)

      // 4. Anexo de documento intermedio por Especialista
      const anexo = await service.anexarDocumentosIntermedios({
        expedienteId,
        usuarioId: 'user-esp-dc',
        rolUsuario: 'ESPECIALISTA',
        areaId: 'area-defensa-civil',
        archivos: [
          {
            nombre: 'informe_itse.pdf',
            tipoMime: 'application/pdf',
            tamanoBytes: 2048,
            contenido: new Uint8Array([40, 50]).buffer,
          },
        ],
      })
      expect(anexo.success).toBe(true)
      expect(anexo.archivosSubidos).toBe(1)

      // 5. Intento de cierre por ESPECIALISTA debe ser bloqueado por RBAC
      const cierreNoAutorizado = await service.finalizarExpediente({
        expediente_id: expedienteId,
        estado_nuevo: 'ATENDIDO',
        observacion: 'Intento de cierre por especialista',
        usuario_id: 'user-esp-dc',
        rol_usuario: 'ESPECIALISTA',
      })
      expect(cierreNoAutorizado.success).toBe(false)
      expect(cierreNoAutorizado.error).toContain('Solo el Jefe de Área')

      // 6. Cierre exitoso por JEFE_AREA
      const cierreAutorizado = await service.finalizarExpediente({
        expediente_id: expedienteId,
        estado_nuevo: 'ATENDIDO',
        observacion: 'Certificado ITSE emitido favorablemente',
        usuario_id: 'user-jefe-dc',
        rol_usuario: 'JEFE_AREA',
      })
      expect(cierreAutorizado.success).toBe(true)

      const expedienteFinal = await expRepo.obtenerPorId(expedienteId)
      expect(expedienteFinal?.estado).toBe('ATENDIDO')
      expect(expedienteFinal?.area_actual_id).toBe('area-defensa-civil')
    })
  })
})
