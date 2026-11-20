// lib/domain/contracts/expediente.contracts.ts

import type {
  EstadoExpediente as DbEstadoExpediente,
  RolUsuario as DbRolUsuario,
  TipoDocumentoTramite as DbTipoDocumentoTramite,
} from '@/types/database.types'

/**
 * Roles institucionales definidos en la matriz RBAC del sistema MDLO Docs.
 * Incluye los 5 roles oficiales de BD + compatibilidad histórica ('FUNCIONARIO', 'ADMIN').
 */
export type RolUsuario =
  | DbRolUsuario
  | 'ADMIN_TI'
  | 'MESA_PARTES'
  | 'ASISTENTE_AREA'
  | 'ESPECIALISTA'
  | 'JEFE_AREA'
  | 'FUNCIONARIO'
  | 'ADMIN'

export type RolUsuarioOficial = DbRolUsuario

/**
 * Estados posibles dentro del ciclo de vida de un expediente municipal.
 */
export type EstadoExpediente = DbEstadoExpediente

export type TipoDocumentoTramite = DbTipoDocumentoTramite

export type EstadoCierreExpediente = 'ATENDIDO' | 'ARCHIVADO'

export type TipoAccionExpediente =
  | 'REGISTRO_INICIAL'
  | 'RECEPCION'
  | 'ASIGNACION'
  | 'DERIVACION'
  | 'CIERRE'
  | 'ANEXO_DOCUMENTAL'

/**
 * [ISP] Contrato mínimo de identidad de un expediente tras su radicación.
 */
export interface IExpedienteIdentidad {
  id: string
  cut: string | null
}

/**
 * [ISP] Contrato segregado exclusivamente para lectura en bandejas y listados.
 * Evita exponer campos de mutación o detalles innecesarios a vistas de tabla.
 */
export interface IExpedienteLectura extends IExpedienteIdentidad {
  remitente_nombres: string
  remitente_dni_ruc?: string
  asunto: string
  estado: EstadoExpediente | string
  area_actual_id: string | null
  asignado_a?: string | null
  fecha_actualizacion: string
}

/**
 * [ISP] Contrato segregado para el detalle completo de un expediente.
 */
export interface IExpedienteDetalle extends IExpedienteLectura {
  tipo_doc_remitente?: string
  remitente_dni_ruc: string
  telefono: string | null
  correo: string | null
  direccion?: string | null
  tipo_tramite?: TipoDocumentoTramite | string
  folios: number
  asignado_a?: string | null
  registrado_por: string | null
  fecha_creacion: string
}

/**
 * [ISP] Contrato segregado exclusivamente para la radicación (registro inicial) en Mesa de Partes.
 */
export interface IExpedienteRadicacion {
  tipo_doc_remitente?: 'DNI' | 'RUC' | 'CE' | string
  remitente_nombres: string
  remitente_dni_ruc: string
  telefono?: string | null
  correo?: string | null
  asunto: string
  folios: number
  tipo_tramite?: TipoDocumentoTramite | string
  direccion?: string | null
  area_actual_id: string | null
  area_destino_inicial_id?: string | null
  registrado_por: string
}

/**
 * [ISP] Contrato segregado exclusivamente para la recepción de un expediente en bandeja.
 */
export interface IExpedienteRecepcion {
  expediente_id: string
  area_receptor_id: string | null
  usuario_id: string
}

/**
 * [ISP] Contrato segregado para la asignación interna a un especialista de la misma área.
 */
export interface IExpedienteAsignacionInterna {
  expediente_id: string
  especialista_id: string
  area_id: string
  usuario_id: string
  proveido?: string | null
}

/**
 * [ISP] Contrato segregado exclusivamente para la derivación entre unidades orgánicas.
 */
export interface IExpedienteDerivacion {
  expediente_id: string
  area_origen_id: string
  area_destino_id: string
  accion: string
  emisor_id: string
  asignado_a?: string | null
}

/**
 * [ISP] Contrato segregado exclusivamente para el cierre o archivo por Jefe de Área.
 */
export interface IExpedienteCierre {
  expediente_id: string
  estado_nuevo: EstadoCierreExpediente
  observacion?: string
  usuario_id: string
  rol_usuario: string
}

/**
 * [ISP] Contrato de entrada para un archivo binario listo para almacenarse.
 */
export interface IArchivoAdjuntoInput {
  nombre: string
  tipoMime: string
  tamanoBytes: number
  contenido: ArrayBuffer
  tipoDocumento?: TipoDocumentoTramite
}

/**
 * [ISP] Contrato de persistencia para metadatos de un archivo adjunto.
 */
export interface IAdjuntoRegistro {
  expediente_id: string
  nombre_archivo: string
  ruta_almacenamiento: string
  tipo_mime: string
  peso_bytes: number
  subido_por: string
  area_id: string | null
  tipo_documento?: TipoDocumentoTramite
}

/**
 * [ISP] Contrato de persistencia para eventos en la hoja de ruta (trazabilidad).
 */
export interface ITrazabilidadRegistro {
  expediente_id: string
  area_origen_id: string | null
  area_destino_id: string | null
  emisor_id: string | null
  receptor_id?: string | null
  accion: string
  proveido: string | null
  estado_previo?: EstadoExpediente | string | null
  estado_nuevo: EstadoExpediente | string | null
  fecha_envio: string
  fecha_recepcion?: string | null
}

/**
 * [ISP] Contratos segregados para la Consulta Pública Ciudadana (Anonimizada).
 */
export interface IConsultaCiudadanaExpediente {
  id: string
  cut: string
  asunto: string
  estado: string
  tipo_tramite?: TipoDocumentoTramite | string | null
  area_actual?: string | null
  area_actual_siglas?: string | null
  fecha_ingreso?: string | null
  fecha_actualizacion?: string | null
}

export interface IConsultaCiudadanaMovimiento {
  id?: string | null
  expediente_id: string
  accion: string
  proveido?: string | null
  estado_nuevo?: string | null
  area_origen?: string | null
  area_destino?: string | null
  fecha?: string | null
  fecha_envio?: string | null
  fecha_recepcion?: string | null
}
