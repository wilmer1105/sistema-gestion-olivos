// tests/unit/validators.test.ts

import { describe, expect, it } from 'vitest'
import { loginSchema } from '@/lib/validators/auth.schema'
import { empleadoSchema } from '@/lib/validators/usuario.schema'
import {
  expedienteSchema,
  validarArchivoPdf,
} from '@/lib/validators/expediente.schema'
import {
  asignacionInternaSchema,
  cierreExpedienteSchema,
  derivacionSchema,
  documentoIntermedioSchema,
} from '@/lib/validators/derivacion.schema'

const UUID_SGOPCU = '22222222-2222-4222-8222-222222222222'
const UUID_EXPEDIENTE = '33333333-3333-4333-8333-333333333333'
const UUID_ESPECIALISTA = '44444444-4444-4444-8444-444444444444'

describe('Validadores Isomórficos Zod y Aserciones Anti-Falsos Positivos (lib/validators/)', () => {
  describe('1. loginSchema (RF-01)', () => {
    it('acepta credenciales institucionales válidas', () => {
      const res = loginSchema.safeParse({
        email: 'operador.mp@munilosolivos.gob.pe',
        password: 'PasswordSeguro123',
      })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.email).toBe('operador.mp@munilosolivos.gob.pe')
      }
    })

    it('rechaza correo con formato inválido con mensaje exacto', () => {
      const res = loginSchema.safeParse({
        email: 'correo-sin-arroba',
        password: 'PasswordSeguro123',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toMatch(/correo electrónico.*válido/i)
      }
    })

    it('rechaza contraseña menor a 6 caracteres con mensaje exacto', () => {
      const res = loginSchema.safeParse({
        email: 'admin@munilosolivos.gob.pe',
        password: '12345',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toMatch(/al menos 6 caracteres/i)
      }
    })
  })

  describe('2. empleadoSchema y Regla Reactiva de Rol vs. Área (RF-03, RF-04)', () => {
    it('acepta ADMIN_TI únicamente cuando area_id es null', () => {
      const valido = empleadoSchema.safeParse({
        nombres: 'Roberto',
        apellidos: 'Sánchez OGTIC',
        dni: '41234567',
        correo: 'admin.ti@munilosolivos.gob.pe',
        rol: 'ADMIN_TI',
        area_id: null,
      })
      expect(valido.success).toBe(true)
    })

    it('rechaza ADMIN_TI si se le intenta asignar un area_id con mensaje exacto', () => {
      const invalidoConArea = empleadoSchema.safeParse({
        nombres: 'Roberto',
        apellidos: 'Sánchez OGTIC',
        dni: '41234567',
        correo: 'admin.ti@munilosolivos.gob.pe',
        rol: 'ADMIN_TI',
        area_id: UUID_SGOPCU,
      })
      expect(invalidoConArea.success).toBe(false)
      if (!invalidoConArea.success) {
        expect(invalidoConArea.error.issues[0]?.message).toBe(
          'El rol ADMIN_TI es de alcance global y debe tener area_id = null'
        )
      }
    })

    it('rechaza roles operativos (ASISTENTE_AREA, ESPECIALISTA, JEFE_AREA) si area_id es null con mensaje exacto', () => {
      const rolesOperativos = [
        'ASISTENTE_AREA',
        'ESPECIALISTA',
        'JEFE_AREA',
      ] as const

      for (const rol of rolesOperativos) {
        const sinArea = empleadoSchema.safeParse({
          nombres: 'Carlos',
          apellidos: 'Mendoza',
          dni: '43456789',
          correo: 'cmendoza@munilosolivos.gob.pe',
          rol,
          area_id: null,
        })
        expect(sinArea.success).toBe(false)
        if (!sinArea.success) {
          expect(sinArea.error.issues[0]?.message).toBe(
            'Debe asignar una unidad orgánica válida (UUID) para este rol operativo'
          )
        }
      }
    })

    it('rechaza DNI con letras o longitud diferente de 8 dígitos con mensaje exacto', () => {
      const conLetras = empleadoSchema.safeParse({
        nombres: 'Ana',
        apellidos: 'Torres',
        dni: '1234567A',
        correo: 'atorres@munilosolivos.gob.pe',
        rol: 'ESPECIALISTA',
        area_id: UUID_SGOPCU,
      })
      expect(conLetras.success).toBe(false)
      if (!conLetras.success) {
        expect(conLetras.error.issues[0]?.message).toBe(
          'El DNI debe tener exactamente 8 dígitos numéricos'
        )
      }

      const longitudCorta = empleadoSchema.safeParse({
        nombres: 'Ana',
        apellidos: 'Torres',
        dni: '1234567',
        correo: 'atorres@munilosolivos.gob.pe',
        rol: 'ESPECIALISTA',
        area_id: UUID_SGOPCU,
      })
      expect(longitudCorta.success).toBe(false)
      if (!longitudCorta.success) {
        expect(longitudCorta.error.issues[0]?.message).toBe(
          'El DNI debe tener exactamente 8 dígitos numéricos'
        )
      }
    })
  })

  describe('3. expedienteSchema y validarArchivoPdf (RF-06, RF-07, RNF-05)', () => {
    it('valida correctamente DNI de 8 dígitos y RUC de 11 dígitos', () => {
      const conDni = expedienteSchema.safeParse({
        tipo_doc_remitente: 'DNI',
        remitente_dni_ruc: '45892134',
        remitente_nombres: 'María Elena Quispe',
        tipo_tramite: 'SOLICITUD',
        asunto: 'Solicitud de Licencia de Edificación Modalidad B',
        folios: 15,
      })
      expect(conDni.success).toBe(true)

      const conRuc = expedienteSchema.safeParse({
        tipo_doc_remitente: 'RUC',
        remitente_dni_ruc: '20554433221',
        remitente_nombres: 'Inversiones Inmobiliarias Los Olivos SAC',
        tipo_tramite: 'CARTA',
        asunto: 'Presentación de levantamiento de observaciones técnicas',
        folios: 32,
      })
      expect(conRuc.success).toBe(true)
    })

    it('rechaza DNI con letras o longitud inválida con mensaje exacto', () => {
      const dniConLetras = expedienteSchema.safeParse({
        tipo_doc_remitente: 'DNI',
        remitente_dni_ruc: '4589213A',
        remitente_nombres: 'Juan Pérez',
        asunto: 'Solicitud de certificado de parámetros urbanísticos',
        folios: 2,
      })
      expect(dniConLetras.success).toBe(false)
      if (!dniConLetras.success) {
        expect(dniConLetras.error.issues[0]?.message).toBe(
          'El DNI debe contener exactamente 8 dígitos numéricos'
        )
      }

      const dniLargo = expedienteSchema.safeParse({
        tipo_doc_remitente: 'DNI',
        remitente_dni_ruc: '458921349',
        remitente_nombres: 'Juan Pérez',
        asunto: 'Solicitud de certificado de parámetros urbanísticos',
        folios: 2,
      })
      expect(dniLargo.success).toBe(false)
      if (!dniLargo.success) {
        expect(dniLargo.error.issues[0]?.message).toBe(
          'El DNI debe contener exactamente 8 dígitos numéricos'
        )
      }
    })

    it('rechaza RUC con longitud distinta de 11 dígitos o caracteres alfabéticos', () => {
      const rucCorto = expedienteSchema.safeParse({
        tipo_doc_remitente: 'RUC',
        remitente_dni_ruc: '2055443322',
        remitente_nombres: 'Constructora SAC',
        asunto: 'Solicitud de inspección técnica',
        folios: 4,
      })
      expect(rucCorto.success).toBe(false)
      if (!rucCorto.success) {
        expect(rucCorto.error.issues[0]?.message).toBe(
          'El RUC debe contener exactamente 11 dígitos numéricos'
        )
      }
    })

    it('validarArchivoPdf rechaza archivos no-PDF o mayores a 10MB con mensajes exactos', () => {
      // PDF válido <= 10MB
      expect(
        validarArchivoPdf({
          name: 'solicitud_firmada.pdf',
          type: 'application/pdf',
          size: 2 * 1024 * 1024,
        })
      ).toEqual({ valido: true })

      // Archivo ejecutable no-PDF
      const noPdf = validarArchivoPdf({
        name: 'archivo_peligroso.exe',
        type: 'application/x-msdownload',
        size: 1024,
      })
      expect(noPdf.valido).toBe(false)
      expect(noPdf.error).toMatch(/solo se permiten archivos en formato pdf/i)

      // Archivo vacío (0 bytes)
      const vacio = validarArchivoPdf({
        name: 'documento_vacio.pdf',
        type: 'application/pdf',
        size: 0,
      })
      expect(vacio.valido).toBe(false)
      expect(vacio.error).toMatch(/vacío/i)

      // Archivo mayor a 10MB (10,485,760 bytes)
      const excede10MB = validarArchivoPdf({
        name: 'expediente_gigante.pdf',
        type: 'application/pdf',
        size: 10485761,
      })
      expect(excede10MB.valido).toBe(false)
      expect(excede10MB.error).toMatch(/supera el límite máximo permitido de 10 mb/i)
    })

    it('valida fronteras exactas de PDF (null/undefined, tamaño negativo y exactamente 10 MB)', () => {
      const nulo = validarArchivoPdf(null)
      expect(nulo.valido).toBe(false)
      expect(nulo.error).toMatch(/archivo pdf válido/i)

      const indefinido = validarArchivoPdf(undefined)
      expect(indefinido.valido).toBe(false)

      const negativo = validarArchivoPdf({
        name: 'corrupto.pdf',
        type: 'application/pdf',
        size: -10,
      })
      expect(negativo.valido).toBe(false)
      expect(negativo.error).toMatch(/vacío/i)

      // Límite superior exacto inclusivo: 10 * 1024 * 1024 = 10,485,760 bytes
      const limiteExacto10MB = validarArchivoPdf({
        name: 'limite_exacto.pdf',
        type: 'application/pdf',
        size: 10 * 1024 * 1024,
      })
      expect(limiteExacto10MB).toEqual({ valido: true })
    })

    it('rechaza entradas vacías o solo espacios y folios no positivos en expedienteSchema', () => {
      const vacio = expedienteSchema.safeParse({
        tipo_doc_remitente: 'DNI',
        remitente_dni_ruc: '   ',
        remitente_nombres: '   ',
        asunto: '   ',
        folios: 0,
      })
      expect(vacio.success).toBe(false)
      if (!vacio.success) {
        const campos = vacio.error.issues.map((i) => i.path[0])
        expect(campos).toContain('remitente_dni_ruc')
        expect(campos).toContain('remitente_nombres')
        expect(campos).toContain('asunto')
        expect(campos).toContain('folios')
      }

      const foliosNegativos = expedienteSchema.safeParse({
        tipo_doc_remitente: 'DNI',
        remitente_dni_ruc: '45892134',
        remitente_nombres: 'Luis Paredes',
        asunto: 'Solicitud de constancia de posesión',
        folios: -2,
      })
      expect(foliosNegativos.success).toBe(false)
    })

    it('valida fronteras exactas de RUC (10, 11, 12 dígitos) y Carné de Extranjería CE (7, 8, 12, 13 caracteres)', () => {
      const ruc12 = expedienteSchema.safeParse({
        tipo_doc_remitente: 'RUC',
        remitente_dni_ruc: '205544332219',
        remitente_nombres: 'Empresa Demo SAC',
        asunto: 'Solicitud de licencia comercial municipal',
        folios: 3,
      })
      expect(ruc12.success).toBe(false)
      if (!ruc12.success) {
        expect(ruc12.error.issues[0]?.message).toBe(
          'El RUC debe contener exactamente 11 dígitos numéricos'
        )
      }

      const ceValido8 = expedienteSchema.safeParse({
        tipo_doc_remitente: 'CE',
        remitente_dni_ruc: 'CE123456',
        remitente_nombres: 'Carlos Foreign',
        asunto: 'Solicitud de autorización temporal de evento',
        folios: 2,
      })
      expect(ceValido8.success).toBe(true)

      const ceValido12 = expedienteSchema.safeParse({
        tipo_doc_remitente: 'CE',
        remitente_dni_ruc: 'CE1234567890',
        remitente_nombres: 'Carlos Foreign',
        asunto: 'Solicitud de autorización temporal de evento',
        folios: 2,
      })
      expect(ceValido12.success).toBe(true)

      const ceInvalido13 = expedienteSchema.safeParse({
        tipo_doc_remitente: 'CE',
        remitente_dni_ruc: 'CE12345678901',
        remitente_nombres: 'Carlos Foreign',
        asunto: 'Solicitud de autorización temporal de evento',
        folios: 2,
      })
      expect(ceInvalido13.success).toBe(false)
      if (!ceInvalido13.success) {
        expect(ceInvalido13.error.issues[0]?.message).toMatch(/entre 8 y 12 caracteres/i)
      }

      const ceConSimbolos = expedienteSchema.safeParse({
        tipo_doc_remitente: 'CE',
        remitente_dni_ruc: 'CE-123456',
        remitente_nombres: 'Carlos Foreign',
        asunto: 'Solicitud de autorización temporal de evento',
        folios: 2,
      })
      expect(ceConSimbolos.success).toBe(false)
    })
  })

  describe('4. derivacionSchema, asignacionInternaSchema y cierreExpedienteSchema', () => {
    it('rechaza proveído menor a 5 caracteres en derivación con mensaje exacto', () => {
      const res = derivacionSchema.safeParse({
        expediente_id: UUID_EXPEDIENTE,
        area_destino_id: UUID_SGOPCU,
        proveido: 'Ok',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe(
          'El proveído o instrucción debe tener al menos 5 caracteres'
        )
      }
    })

    it('rechaza proveído menor a 5 caracteres en asignación interna a especialista', () => {
      const res = asignacionInternaSchema.safeParse({
        expediente_id: UUID_EXPEDIENTE,
        especialista_id: UUID_ESPECIALISTA,
        proveido: 'Revi',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe(
          'El proveído de asignación debe tener al menos 5 caracteres'
        )
      }
    })

    it('valida documento intermedio con tipo válido y descripción opcional', () => {
      const res = documentoIntermedioSchema.safeParse({
        expediente_id: UUID_EXPEDIENTE,
        tipo_documento: 'INFORME_TECNICO',
        descripcion: 'Informe de inspección ocular',
      })
      expect(res.success).toBe(true)
    })

    it('valida cierre de expediente solo con estados ATENDIDO o ARCHIVADO y proveído >= 5 caracteres', () => {
      const validoAtendido = cierreExpedienteSchema.safeParse({
        expediente_id: UUID_EXPEDIENTE,
        estado_final: 'ATENDIDO',
        proveido: 'Resolución Gerencial N° 204-2026-MDLO',
      })
      expect(validoAtendido.success).toBe(true)

      const validoArchivado = cierreExpedienteSchema.safeParse({
        expediente_id: UUID_EXPEDIENTE,
        estado_final: 'ARCHIVADO',
        proveido: 'Expediente sin subsanación conforme a TUPA',
      })
      expect(validoArchivado.success).toBe(true)

      const invalidoEstado = cierreExpedienteSchema.safeParse({
        expediente_id: UUID_EXPEDIENTE,
        estado_final: 'RECEPCIONADO',
        proveido: 'Intento inválido de cierre',
      })
      expect(invalidoEstado.success).toBe(false)

      const proveidoCorto = cierreExpedienteSchema.safeParse({
        expediente_id: UUID_EXPEDIENTE,
        estado_final: 'ATENDIDO',
        proveido: 'Fin',
      })
      expect(proveidoCorto.success).toBe(false)
      if (!proveidoCorto.success) {
        expect(proveidoCorto.error.issues[0]?.message).toBe(
          'El proveído de cierre debe tener al menos 5 caracteres'
        )
      }
    })
  })

  describe('5. Refactorización PC12: correo obligatorio en empleadoSchema y ExpedienteValidator', () => {
    it('rechaza empleadoSchema cuando no se envía ni correo ni email', () => {
      const sinCorreo = empleadoSchema.safeParse({
        nombres: 'Lucía',
        apellidos: 'Ramos',
        dni: '44556677',
        rol: 'ESPECIALISTA',
        area_id: UUID_SGOPCU,
      })
      expect(sinCorreo.success).toBe(false)
      if (!sinCorreo.success) {
        expect(sinCorreo.error.issues[0]?.message).toBe(
          'El correo electrónico institucional es obligatorio'
        )
      }
    })

    it('ExpedienteValidator bloquea auto-derivación a la misma área, archivos > 10MB por defecto y valida cierres', async () => {
      const { ExpedienteValidator } = await import('@/lib/services/ExpedienteValidator')
      const validator = new ExpedienteValidator()

      // Auto-derivación bloqueada (regla PC12)
      const mismaArea = validator.validarDerivacion({
        expediente_id: UUID_EXPEDIENTE,
        area_origen_id: UUID_SGOPCU,
        area_destino_id: UUID_SGOPCU,
      })
      expect(mismaArea.valido).toBe(false)
      expect(mismaArea.error).toMatch(/distinta al área de origen/i)

      // Campos faltantes en derivación y cierre
      expect(validator.validarDerivacion({ area_origen_id: '', area_destino_id: UUID_SGOPCU, expediente_id: UUID_EXPEDIENTE }).valido).toBe(false)
      expect(validator.validarDerivacion({ area_origen_id: UUID_SGOPCU, area_destino_id: '', expediente_id: UUID_EXPEDIENTE }).valido).toBe(false)
      expect(validator.validarDerivacion({ area_origen_id: UUID_SGOPCU, area_destino_id: 'area-otra', expediente_id: '' }).valido).toBe(false)
      expect(validator.validarCierre({ expediente_id: '', estado_nuevo: 'ATENDIDO' }).valido).toBe(false)
      expect(validator.validarCierre({ expediente_id: UUID_EXPEDIENTE, estado_nuevo: 'DERIVADO' }).valido).toBe(false)
      expect(validator.esEstadoCierreValido('ATENDIDO')).toBe(true)
      expect(validator.esEstadoCierreValido('DERIVADO')).toBe(false)

      // Adjuntos: requiere al menos uno, vacío (0 bytes) y exceso del límite por defecto (10 MB)
      expect(validator.validarArchivosAdjuntos([], true).valido).toBe(false)
      expect(
        validator.validarArchivosAdjuntos([
          { nombre: 'vacio.pdf', tipoMime: 'application/pdf', tamanoBytes: 0, contenido: new ArrayBuffer(0) },
        ]).valido
      ).toBe(false)
      expect(
        validator.validarArchivosAdjuntos([
          { nombre: 'grande.pdf', tipoMime: 'application/pdf', tamanoBytes: 10 * 1024 * 1024 + 1, contenido: new ArrayBuffer(1) },
        ]).valido
      ).toBe(false)
      expect(
        validator.validarArchivosAdjuntos([
          { nombre: 'exacto10mb.pdf', tipoMime: 'application/pdf', tamanoBytes: 10 * 1024 * 1024, contenido: new ArrayBuffer(1) },
        ]).valido
      ).toBe(true)
    })
  })
})
