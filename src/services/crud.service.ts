import api, { apiMock } from './api'

// Rutas que el Swagger aún no expone: se atienden con el mock de forma explícita.
const MOCK_ONLY_PATHS = new Set([
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /representante
  '/representante',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /vinculo-representante (equivalente a /adolescente-representante)
  '/vinculo-representante',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /contexto-familiar/intervencion
  '/contexto-familiar/intervencion',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /contexto-familiar/ficha
  '/contexto-familiar/ficha',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /ficha-psicologica
  '/ficha-psicologica',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /taller
  '/taller',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /asistencia-taller
  '/asistencia-taller',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /informacion-educativa
  '/informacion-educativa',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /documento
  '/documento',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /alerta-salud
  '/alerta-salud',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /asignacion-caso
  '/asignacion-caso',
  // PENDIENTE BACKEND: GET/POST/PATCH/DELETE /informe-tecnico
  '/informe-tecnico',
])

export interface ListParams {
  activo?: boolean
  estado?: string
}

export interface CrudService<T, P> {
  getAll(params?: ListParams): Promise<T[]>
  create(payload: P): Promise<T>
  update(id: number, payload: Partial<P>): Promise<T>
  deactivate(id: number): Promise<void>
}

function cliente(path: string) {
  return MOCK_ONLY_PATHS.has(path) ? apiMock : api
}

function normalizar<T extends { id: number }>(fila: T): T {
  if (!fila) return fila
  const r = fila as T & { activo?: boolean; estado?: unknown }
  if (r.activo === undefined && typeof r.estado === 'boolean') r.activo = r.estado
  return r
}

function query(params?: ListParams): string {
  if (!params) return ''
  const qs = new URLSearchParams()
  if (params.activo !== undefined) qs.set('activo', String(params.activo))
  if (params.estado) qs.set('estado', params.estado)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

/** Fábrica de servicios CRUD: todos hablan con rutas REST /api/v1 reales. */
export function createCrudService<T extends { id: number }, P>(path: string): CrudService<T, P> {
  return {
    async getAll(params) {
      const { data } = await cliente(path).get<T[]>(`${path}${query(params)}`)
      return (data ?? []).map(normalizar)
    },
    async create(payload) {
      const { data } = await cliente(path).post<T>(path, payload)
      return normalizar(data)
    },
    async update(id, payload) {
      const { data } = await cliente(path).patch<T>(`${path}/${id}`, payload)
      return normalizar(data)
    },
    async deactivate(id) {
      await cliente(path).delete(`${path}/${id}`)
    },
  }
}
