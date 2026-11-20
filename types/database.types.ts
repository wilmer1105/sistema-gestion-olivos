export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      adjuntos: {
        Row: {
          area_id: string | null
          expediente_id: string | null
          fecha_subida: string
          id: string
          nombre_archivo: string
          peso_bytes: number | null
          ruta_almacenamiento: string
          subido_por: string | null
          tipo_documento: Database["public"]["Enums"]["tipo_documento_tramite"]
          tipo_mime: string | null
        }
        Insert: {
          area_id?: string | null
          expediente_id?: string | null
          fecha_subida?: string
          id?: string
          nombre_archivo: string
          peso_bytes?: number | null
          ruta_almacenamiento: string
          subido_por?: string | null
          tipo_documento?: Database["public"]["Enums"]["tipo_documento_tramite"]
          tipo_mime?: string | null
        }
        Update: {
          area_id?: string | null
          expediente_id?: string | null
          fecha_subida?: string
          id?: string
          nombre_archivo?: string
          peso_bytes?: number | null
          ruta_almacenamiento?: string
          subido_por?: string | null
          tipo_documento?: Database["public"]["Enums"]["tipo_documento_tramite"]
          tipo_mime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adjuntos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjuntos_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjuntos_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "vista_consulta_ciudadana"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjuntos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          siglas: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          siglas: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          siglas?: string
        }
        Relationships: []
      }
      expedientes: {
        Row: {
          area_actual_id: string | null
          asignado_a: string | null
          asunto: string
          correo: string | null
          cut: string | null
          direccion: string | null
          estado: Database["public"]["Enums"]["estado_expediente"] | null
          fecha_actualizacion: string
          fecha_creacion: string
          folios: number | null
          id: string
          registrado_por: string | null
          remitente_dni_ruc: string
          remitente_nombres: string
          telefono: string | null
          tipo_doc_remitente: string
          tipo_tramite: Database["public"]["Enums"]["tipo_documento_tramite"]
        }
        Insert: {
          area_actual_id?: string | null
          asignado_a?: string | null
          asunto: string
          correo?: string | null
          cut?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_expediente"] | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          folios?: number | null
          id?: string
          registrado_por?: string | null
          remitente_dni_ruc: string
          remitente_nombres: string
          telefono?: string | null
          tipo_doc_remitente?: string
          tipo_tramite?: Database["public"]["Enums"]["tipo_documento_tramite"]
        }
        Update: {
          area_actual_id?: string | null
          asignado_a?: string | null
          asunto?: string
          correo?: string | null
          cut?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_expediente"] | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          folios?: number | null
          id?: string
          registrado_por?: string | null
          remitente_dni_ruc?: string
          remitente_nombres?: string
          telefono?: string | null
          tipo_doc_remitente?: string
          tipo_tramite?: Database["public"]["Enums"]["tipo_documento_tramite"]
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_area_actual_id_fkey"
            columns: ["area_actual_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean | null
          apellidos: string
          area_id: string | null
          correo: string | null
          created_at: string
          dni: string
          id: string
          nombres: string
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          activo?: boolean | null
          apellidos: string
          area_id?: string | null
          correo?: string | null
          created_at?: string
          dni: string
          id: string
          nombres: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          activo?: boolean | null
          apellidos?: string
          area_id?: string | null
          correo?: string | null
          created_at?: string
          dni?: string
          id?: string
          nombres?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      trazabilidad: {
        Row: {
          accion: string
          area_destino_id: string | null
          area_origen_id: string | null
          emisor_id: string | null
          estado_nuevo: Database["public"]["Enums"]["estado_expediente"] | null
          estado_previo: Database["public"]["Enums"]["estado_expediente"] | null
          expediente_id: string | null
          fecha_envio: string
          fecha_recepcion: string | null
          id: string
          proveido: string | null
          receptor_id: string | null
        }
        Insert: {
          accion: string
          area_destino_id?: string | null
          area_origen_id?: string | null
          emisor_id?: string | null
          estado_nuevo?: Database["public"]["Enums"]["estado_expediente"] | null
          estado_previo?:
            | Database["public"]["Enums"]["estado_expediente"]
            | null
          expediente_id?: string | null
          fecha_envio?: string
          fecha_recepcion?: string | null
          id?: string
          proveido?: string | null
          receptor_id?: string | null
        }
        Update: {
          accion?: string
          area_destino_id?: string | null
          area_origen_id?: string | null
          emisor_id?: string | null
          estado_nuevo?: Database["public"]["Enums"]["estado_expediente"] | null
          estado_previo?:
            | Database["public"]["Enums"]["estado_expediente"]
            | null
          expediente_id?: string | null
          fecha_envio?: string
          fecha_recepcion?: string | null
          id?: string
          proveido?: string | null
          receptor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trazabilidad_area_destino_id_fkey"
            columns: ["area_destino_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trazabilidad_area_origen_id_fkey"
            columns: ["area_origen_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trazabilidad_emisor_id_fkey"
            columns: ["emisor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trazabilidad_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trazabilidad_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "vista_consulta_ciudadana"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trazabilidad_receptor_id_fkey"
            columns: ["receptor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_consulta_ciudadana: {
        Row: {
          area_actual: string | null
          area_actual_siglas: string | null
          asunto: string | null
          cut: string | null
          estado: Database["public"]["Enums"]["estado_expediente"] | null
          fecha_actualizacion: string | null
          fecha_ingreso: string | null
          id: string | null
          tipo_tramite:
            | Database["public"]["Enums"]["tipo_documento_tramite"]
            | null
        }
        Relationships: []
      }
      vista_trazabilidad_ciudadana: {
        Row: {
          accion: string | null
          area_destino: string | null
          area_origen: string | null
          estado_nuevo: Database["public"]["Enums"]["estado_expediente"] | null
          expediente_id: string | null
          fecha: string | null
          fecha_envio: string | null
          fecha_recepcion: string | null
          id: string | null
          proveido: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trazabilidad_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trazabilidad_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "vista_consulta_ciudadana"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_expediente:
        | "REGISTRADO"
        | "EN_TRAMITE"
        | "DERIVADO"
        | "RECEPCIONADO"
        | "OBSERVADO"
        | "ATENDIDO"
        | "ARCHIVADO"
      rol_usuario:
        | "ADMIN_TI"
        | "MESA_PARTES"
        | "ESPECIALISTA"
        | "JEFE_AREA"
        | "ASISTENTE_AREA"
      tipo_documento_tramite:
        | "FUT"
        | "CARTA"
        | "OFICIO"
        | "SOLICITUD"
        | "INFORME_TECNICO"
        | "INFORME_LEGAL"
        | "ACTA_FISCALIZACION"
        | "RESOLUCION"
        | "NOTIFICACION"
        | "OTRO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_expediente: [
        "REGISTRADO",
        "EN_TRAMITE",
        "DERIVADO",
        "RECEPCIONADO",
        "OBSERVADO",
        "ATENDIDO",
        "ARCHIVADO",
      ],
      rol_usuario: [
        "ADMIN_TI",
        "MESA_PARTES",
        "ESPECIALISTA",
        "JEFE_AREA",
        "ASISTENTE_AREA",
      ],
      tipo_documento_tramite: [
        "FUT",
        "CARTA",
        "OFICIO",
        "SOLICITUD",
        "INFORME_TECNICO",
        "INFORME_LEGAL",
        "ACTA_FISCALIZACION",
        "RESOLUCION",
        "NOTIFICACION",
        "OTRO",
      ],
    },
  },
} as const

// ============================================================================
// Tipos Auxiliares Estrictos para Dominio y Capa de Aplicación (Cero `any`)
// ============================================================================

export type RolUsuario = Database["public"]["Enums"]["rol_usuario"]
export type EstadoExpediente = Database["public"]["Enums"]["estado_expediente"]
export type TipoDocumentoTramite = Database["public"]["Enums"]["tipo_documento_tramite"]

export type AreaRow = Database["public"]["Tables"]["areas"]["Row"]
export type AreaInsert = Database["public"]["Tables"]["areas"]["Insert"]
export type AreaUpdate = Database["public"]["Tables"]["areas"]["Update"]

export type PerfilRow = Database["public"]["Tables"]["perfiles"]["Row"]
export type PerfilInsert = Database["public"]["Tables"]["perfiles"]["Insert"]
export type PerfilUpdate = Database["public"]["Tables"]["perfiles"]["Update"]

export type ExpedienteRow = Database["public"]["Tables"]["expedientes"]["Row"]
export type ExpedienteInsert = Database["public"]["Tables"]["expedientes"]["Insert"]
export type ExpedienteUpdate = Database["public"]["Tables"]["expedientes"]["Update"]

export type TrazabilidadRow = Database["public"]["Tables"]["trazabilidad"]["Row"]
export type TrazabilidadInsert = Database["public"]["Tables"]["trazabilidad"]["Insert"]
export type TrazabilidadUpdate = Database["public"]["Tables"]["trazabilidad"]["Update"]

export type AdjuntoRow = Database["public"]["Tables"]["adjuntos"]["Row"]
export type AdjuntoInsert = Database["public"]["Tables"]["adjuntos"]["Insert"]
export type AdjuntoUpdate = Database["public"]["Tables"]["adjuntos"]["Update"]

export type VistaConsultaCiudadanaRow = Database["public"]["Views"]["vista_consulta_ciudadana"]["Row"]
export type VistaTrazabilidadCiudadanaRow = Database["public"]["Views"]["vista_trazabilidad_ciudadana"]["Row"]

