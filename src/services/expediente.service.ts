import api from './api'
import { USE_MOCK } from './mock/adapter'

export interface ExpedienteAdolescenteRef {
  id: number
  nombre: string
  apellido: string
  cedula: string
}
export interface ExpedienteCatRef {
  id: number
  nombre: string
}

interface AsignacionDto {
  expe_id?: number
  expediente_id?: number
  mdso_id: number
  medida?: ExpedienteCatRef | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  estado_cumplimiento?: string
  estado?: string
}

// Contrato real del Swagger. Los campos `num_causa`/`estado` string son solo del mock.
export interface ExpedienteDto {
  id?: number
  estado?: boolean | string
  fcCrea?: string
  fcMod?: string
  adlc_id?: number
  uzdi_id?: number
  infc_id?: number
  numero_causa?: string
  num_causa?: string
  estado_procesal?: string
  observaciones?: string | null
  fecha_apertura?: string | null
  fecha_inicio_medida?: string | null
  fecha_fin_medida?: string | null
  juzgado?: string
  defensor?: string
  adolescente?: ExpedienteAdolescenteRef
  uzdi?: ExpedienteCatRef
  infraccion?: ExpedienteCatRef
}

export interface ExpedientePayload {
  adlc_id: number
  uzdi_id: number
  infc_id: number
  numero_causa: string
  estado_procesal: string
  observaciones?: string
}

function toTono(estado: string): string {
  const map: Record<string, string> = {
    'En proceso': 'green', 'Atraso': 'amber', 'Incomparecencia': 'red',
    'Concluido': 'slate', 'Archivado': 'slate', 'Cerrado': 'slate',
  }
  return map[estado] ?? 'slate'
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.substring(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function procesal(e: ExpedienteDto): string {
  if (typeof e.estado === 'string') return e.estado
  return e.estado_procesal ?? 'En proceso'
}

export const expedienteService = {
  async getAll() {
    const { data } = await api.get<ExpedienteDto[]>('/expediente')
    const pathAsignaciones = USE_MOCK ? '/asignacion-medida' : '/medida-expediente'
    const { data: asignaciones } = await api.get<AsignacionDto[]>(pathAsignaciones)
    return data.map((e) => {
      const asignacion = asignaciones.find((a) =>
        Number(a.expe_id ?? a.expediente_id) === Number(e.id))
      return {
        id: e.id!,
        codigo: `EXP-${String(e.id!).padStart(4, '0')}`,
        causa: e.numero_causa ?? e.num_causa ?? '—',
        adol: e.adolescente ? `${e.adolescente.nombre} ${e.adolescente.apellido}` : '—',
        ced: e.adolescente?.cedula ?? '—',
        infraccion: e.infraccion?.nombre ?? '—',
        juzgado: '—',
        defensor: '—',
        observaciones: e.observaciones ?? '',
        medida: asignacion?.medida?.nombre ?? 'Sin medida asignada',
        uzdi: e.uzdi?.nombre ?? '—',
        apertura: formatDate(asignacion?.fecha_inicio),
        cierre: '—',
        inicio: formatDate(asignacion?.fecha_inicio),
        fin: formatDate(asignacion?.fecha_fin),
        estado: procesal(e),
        tono: toTono(procesal(e)),
        _raw: {
          ...e,
          num_causa: e.numero_causa ?? e.num_causa,
          estado: procesal(e),
          fecha_apertura: asignacion?.fecha_inicio,
          fecha_inicio_medida: asignacion?.fecha_inicio,
          fecha_fin_medida: asignacion?.fecha_fin,
        },
      }
    })
  },

  async create(payload: ExpedientePayload) {
    const { data } = await api.post<ExpedienteDto>('/expediente', payload)
    return data
  },

  async update(id: number, payload: Partial<ExpedientePayload>) {
    const { data } = await api.patch<ExpedienteDto>(`/expediente/${id}`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`/expediente/${id}`)
  },
}
