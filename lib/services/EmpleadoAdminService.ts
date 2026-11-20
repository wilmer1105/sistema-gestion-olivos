// lib/services/EmpleadoAdminService.ts

import { PoliticaPermisoRolFactory } from '@/lib/domain/policies/PoliticaPermisoRol'
import type { ValidacionResultado } from './ExpedienteValidator'

export interface DatosCrearEmpleadoValidar {
  readonly nombres: string
  readonly apellidos: string
  readonly dni: string
  readonly email: string
  readonly password: string
  readonly rol: string
  readonly area_id: string | null
}

/**
 * [SRP / OCP] Servicio de Validación y Reglas de Negocio para Administración de Empleados (OTI).
 * Delega la resolución del área de adscripción de forma polimórfica a `PoliticaPermisoRol`.
 */
export class EmpleadoAdminValidator {
  validarCreacion(datos: DatosCrearEmpleadoValidar): ValidacionResultado {
    const nombres = datos.nombres?.trim() || ''
    const apellidos = datos.apellidos?.trim() || ''
    const dni = datos.dni?.trim() || ''
    const email = datos.email?.trim() || ''
    const password = datos.password || ''
    const rol = datos.rol?.trim() || ''

    if (!nombres || nombres.length < 2) {
      return {
        valido: false,
        error: 'Debe ingresar nombres válidos (mínimo 2 caracteres).',
      }
    }
    if (!apellidos || apellidos.length < 2) {
      return {
        valido: false,
        error: 'Debe ingresar apellidos válidos (mínimo 2 caracteres).',
      }
    }
    if (!dni || !/^\d{8}$/.test(dni)) {
      return {
        valido: false,
        error: 'El DNI debe tener exactamente 8 dígitos numéricos.',
      }
    }
    if (!email || !email.includes('@')) {
      return {
        valido: false,
        error: 'Debe ingresar un correo electrónico institucional válido.',
      }
    }
    if (!password || password.length < 6) {
      return {
        valido: false,
        error: 'La contraseña debe tener al menos 6 caracteres.',
      }
    }
    if (!rol) {
      return {
        valido: false,
        error: 'Debe seleccionar un rol para el usuario.',
      }
    }

    const politica = PoliticaPermisoRolFactory.obtenerPolitica(rol)
    const areaResuelta = politica.resolverAreaAdscripcion(datos.area_id)

    if (rol !== 'ADMIN_TI' && !areaResuelta) {
      return {
        valido: false,
        error: 'Debe seleccionar un área de adscripción.',
      }
    }

    return { valido: true }
  }

  resolverAreaPorRol(
    rol: string,
    areaId: string | null | undefined,
    areaMesaPartesId?: string | null
  ): string | null {
    const politica = PoliticaPermisoRolFactory.obtenerPolitica(rol)
    return politica.resolverAreaAdscripcion(areaId, areaMesaPartesId)
  }
}
