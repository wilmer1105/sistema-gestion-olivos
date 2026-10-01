// types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: { id: string; nombre: string; siglas: string; created_at: string }
        Insert: { id?: string; nombre: string; siglas: string; created_at?: string }
        Update: { id?: string; nombre?: string; siglas?: string; created_at?: string }
      }
      perfiles: {
        Row: { id: string; nombres: string; apellidos: string; dni: string; area_id: string | null; rol: string; activo: boolean; created_at: string }
        Insert: { id: string; nombres: string; apellidos: string; dni: string; area_id?: string | null; rol?: string; activo?: boolean; created_at?: string }
        Update: { id?: string; nombres?: string; apellidos?: string; dni?: string; area_id?: string | null; rol?: string; activo?: boolean; created_at?: string }
      }
      expedientes: {
        Row: { id: string; cut: string | null; remitente_nombres: string; remitente_dni_ruc: string; telefono: string | null; correo: string | null; asunto: string; folios: number; estado: string; area_actual_id: string | null; registrado_por: string | null; fecha_creacion: string; fecha_actualizacion: string }
        Insert: { id?: string; cut?: string | null; remitente_nombres: string; remitente_dni_ruc: string; telefono?: string | null; correo?: string | null; asunto: string; folios?: number; estado?: string; area_actual_id?: string | null; registrado_por?: string | null; fecha_creacion?: string; fecha_actualizacion?: string }
        Update: { id?: string; cut?: string | null; remitente_nombres?: string; remitente_dni_ruc?: string; telefono?: string | null; correo?: string | null; asunto?: string; folios?: number; estado?: string; area_actual_id?: string | null; registrado_por?: string | null; fecha_creacion?: string; fecha_actualizacion?: string }
      }
      adjuntos: {
        Row: { id: string; expediente_id: string; nombre_archivo: string; ruta_almacenamiento: string; tipo_mime: string | null; peso_bytes: number | null; subido_por: string | null; fecha_subida: string; area_id: string | null }
        Insert: { id?: string; expediente_id: string; nombre_archivo: string; ruta_almacenamiento: string; tipo_mime?: string | null; peso_bytes?: number | null; subido_por?: string | null; fecha_subida?: string; area_id?: string | null }
        Update: { id?: string; expediente_id?: string; nombre_archivo?: string; ruta_almacenamiento?: string; tipo_mime?: string | null; peso_bytes?: number | null; subido_por?: string | null; fecha_subida?: string; area_id?: string | null }
      }
      trazabilidad: {
        Row: {
          id: string
          expediente_id: string
          area_origen_id: string | null
          area_destino_id: string | null
          emisor_id: string | null
          receptor_id: string | null
          accion: string
          proveido: string | null
          estado_previo: string | null
          estado_nuevo: string | null
          fecha_envio: string
          fecha_recepcion: string | null
        }
        Insert: {
          id?: string
          expediente_id: string
          area_origen_id?: string | null
          area_destino_id?: string | null
          emisor_id?: string | null
          receptor_id?: string | null
          accion: string
          proveido?: string | null
          estado_previo?: string | null
          estado_nuevo?: string | null
          fecha_envio?: string
          fecha_recepcion?: string | null
        }
        Update: {
          id?: string
          expediente_id?: string
          area_origen_id?: string | null
          area_destino_id?: string | null
          emisor_id?: string | null
          receptor_id?: string | null
          accion?: string
          proveido?: string | null
          estado_previo?: string | null
          estado_nuevo?: string | null
          fecha_envio?: string
          fecha_recepcion?: string | null
        }
      }
    }
  }
}