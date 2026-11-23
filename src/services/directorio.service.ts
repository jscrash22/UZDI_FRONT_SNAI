import api, { USE_MOCK } from './api'

export interface DirectorioItem {
  id: number
  nombre: string
  login: string
  tppr_id: number
  uzdi_id: number | null
  cargo?: string
}

interface UsuarioBackend {
  id: number
  nombres?: string
  apellidos?: string
  nombre?: string
  login: string
  tppr_id?: number
  uzdi_id?: number | null
  cargo?: string
  estado?: boolean | string
}

/** Directorio mínimo de técnicos activos de la UZDI (RF-23). */
export const directorioService = {
  async getAll(): Promise<DirectorioItem[]> {
    // PENDIENTE BACKEND: no existe GET /directorio; se usa /users/search con un término amplio.
    const path = USE_MOCK ? '/directorio' : '/users/search'
    const { data } = await api.get<DirectorioItem[] | UsuarioBackend[]>(path,
      USE_MOCK ? undefined : { params: { q: '@' } })
    if (USE_MOCK) return data as DirectorioItem[]
    return (data as UsuarioBackend[])
      .filter((u) => u.estado !== false)
      .map((u) => ({
        id: u.id,
        nombre: [u.nombres, u.apellidos].filter(Boolean).join(' ') || u.nombre || u.login,
        login: u.login,
        tppr_id: Number(u.tppr_id ?? 0),
        uzdi_id: u.uzdi_id ?? null,
        ...(u.cargo ? { cargo: u.cargo } : {}),
      }))
  },
}
