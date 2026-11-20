// tests/mocks/MockExpedienteRepositories.ts

import type {
  EstadoExpediente,
  IAdjuntoRegistro,
  IExpedienteIdentidad,
  IExpedienteLectura,
  IExpedienteRadicacion,
  ITrazabilidadRegistro,
} from '@/lib/domain/contracts/expediente.contracts'
import type {
  IAdjuntoRepository,
  IExpedienteRepository,
  IStorageProvider,
  ITrazabilidadRepository,
} from '@/lib/domain/repositories/expediente.repository'

/**
 * [DIP] Implementación Mock en memoria de `IExpedienteRepository` para pruebas unitarias y BDD
 * sin acoplamiento ni conexión a la base de datos real (Supabase).
 */
export class MockExpedienteRepository implements IExpedienteRepository {
  private readonly expedientes = new Map<string, IExpedienteLectura>()
  private sequence = 1

  sembrar(expediente: IExpedienteLectura): void {
    this.expedientes.set(expediente.id, { ...expediente })
  }

  async obtenerPorId(id: string): Promise<IExpedienteLectura | null> {
    const encontrado = this.expedientes.get(id)
    return encontrado ? { ...encontrado } : null
  }

  async crear(datos: IExpedienteRadicacion): Promise<IExpedienteIdentidad> {
    const num = String(this.sequence++).padStart(6, '0')
    const id = `exp-uuid-${num}`
    const cut = `EXP-2026-${num}-MDLO`

    const nuevo: IExpedienteLectura = {
      id,
      cut,
      remitente_nombres: datos.remitente_nombres,
      remitente_dni_ruc: datos.remitente_dni_ruc,
      asunto: datos.asunto,
      estado: 'REGISTRADO',
      area_actual_id: datos.area_actual_id,
      asignado_a: null,
      fecha_actualizacion: new Date().toISOString(),
    }

    this.expedientes.set(id, nuevo)
    return { id, cut }
  }

  async actualizarEstadoYArea(
    id: string,
    nuevoEstado: EstadoExpediente,
    nuevaAreaId?: string | null,
    asignadoA?: string | null
  ): Promise<IExpedienteLectura> {
    const actual = this.expedientes.get(id)
    if (!actual) {
      throw new Error('Expediente no encontrado en el repositorio Mock.')
    }

    const actualizado: IExpedienteLectura = {
      ...actual,
      estado: nuevoEstado,
      area_actual_id:
        nuevaAreaId !== undefined ? nuevaAreaId : actual.area_actual_id,
      asignado_a:
        asignadoA !== undefined ? asignadoA : actual.asignado_a ?? null,
      fecha_actualizacion: new Date().toISOString(),
    }

    this.expedientes.set(id, actualizado)
    return { ...actualizado }
  }

  obtenerTodos(): IExpedienteLectura[] {
    return Array.from(this.expedientes.values())
  }

  obtenerPorArea(areaId: string): IExpedienteLectura[] {
    return Array.from(this.expedientes.values()).filter(
      (e) => e.area_actual_id === areaId
    )
  }
}

/**
 * [DIP] Implementación Mock en memoria de `ITrazabilidadRepository`.
 */
export class MockTrazabilidadRepository implements ITrazabilidadRepository {
  private readonly registros: Array<ITrazabilidadRegistro & { id: string }> = []
  private sequence = 1

  async registrar(evento: ITrazabilidadRegistro): Promise<{ id: string }> {
    const id = `traz-${this.sequence++}`
    this.registros.push({ ...evento, id })
    return { id }
  }

  async marcarRecepcionAbierta(
    expedienteId: string,
    receptorId: string,
    fechaRecepcion: string = new Date().toISOString()
  ): Promise<void> {
    for (let i = this.registros.length - 1; i >= 0; i--) {
      if (
        this.registros[i].expediente_id === expedienteId &&
        !this.registros[i].fecha_recepcion
      ) {
        this.registros[i] = {
          ...this.registros[i],
          fecha_recepcion: fechaRecepcion,
          receptor_id: receptorId,
        }
        break
      }
    }
  }

  async obtenerPorExpediente(
    expedienteId: string
  ): Promise<ITrazabilidadRegistro[]> {
    return this.registros.filter((r) => r.expediente_id === expedienteId)
  }

  obtenerTodos(): Array<ITrazabilidadRegistro & { id: string }> {
    return [...this.registros]
  }
}

/**
 * [DIP] Implementación Mock en memoria de `IAdjuntoRepository`.
 */
export class MockAdjuntoRepository implements IAdjuntoRepository {
  private readonly adjuntos: Array<IAdjuntoRegistro & { id: string }> = []
  private sequence = 1

  async registrar(adjunto: IAdjuntoRegistro): Promise<{ id: string }> {
    const id = `adj-${this.sequence++}`
    this.adjuntos.push({ ...adjunto, id })
    return { id }
  }

  obtenerTodos(): Array<IAdjuntoRegistro & { id: string }> {
    return [...this.adjuntos]
  }
}

/**
 * [DIP] Implementación Mock en memoria de `IStorageProvider`.
 */
export class MockStorageProvider implements IStorageProvider {
  public readonly archivosSubidos: Array<{
    ruta: string
    tipoMime: string
    tamano: number
  }> = []
  public simularFallo = false

  async subirArchivo(
    ruta: string,
    contenido: ArrayBuffer,
    tipoMime: string
  ): Promise<{ path: string; publicUrl: string }> {
    if (this.simularFallo) {
      throw new Error('Fallo simulado de red en Storage')
    }
    this.archivosSubidos.push({
      ruta,
      tipoMime,
      tamano: contenido.byteLength,
    })
    return {
      path: ruta,
      publicUrl: `https://storage.munilosolivos.gob.pe/documentos/${ruta}`,
    }
  }
}
