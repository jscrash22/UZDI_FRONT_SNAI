import api, { apiMock, USE_MOCK } from './api'

export interface EventoBitacora {
  id: number
  fecha: string
  usuario: string
  tipo: string
  entidad: string
  entidad_id: number | null
  detalle: string
}

interface HistorialReal {
  registros?: {
    id: number
    fecha: string
    usuarioId?: number | null
    tablaAfectada?: string
    registroId?: number | null
    accion?: string
    descripcion?: string
  }[]
}

/**
 * El backend expone /historial. Se publica solo la acción y la entidad: los campos
 * estadoAnterior/estadoNuevo pueden contener datos de adolescentes y no se muestran.
 */
function desdeHistorial(r: NonNullable<HistorialReal['registros']>[number]): EventoBitacora {
  const entidad = r.tablaAfectada ?? 'sistema'
  const id = r.registroId ?? null
  return {
    id: r.id,
    fecha: r.fecha,
    usuario: r.usuarioId ? `#${r.usuarioId}` : 'sistema',
    tipo: r.accion ?? 'EVENTO',
    entidad,
    entidad_id: id,
    detalle: r.descripcion || `${r.accion ?? 'Evento'} en ${entidad}${id ? ` #${id}` : ''}`,
  }
}

export const bitacoraService = {
  async getAll(): Promise<EventoBitacora[]> {
    if (USE_MOCK) {
      const { data } = await apiMock.get<EventoBitacora[]>('/bitacora')
      return data
    }
    const { data } = await api.get<HistorialReal>('/historial')
    return (data.registros ?? []).map(desdeHistorial)
  },
}
