import api from './api'

export interface DirectorioItem {
  id: number
  nombre: string
  login: string
  cargo?: string
  tppr_id: number
  uzdi_id: number
}

/** Directorio mínimo de técnicos activos de la UZDI (RF-23). */
export const directorioService = {
  async getAll(): Promise<DirectorioItem[]> {
    const { data } = await api.get<DirectorioItem[]>('/directorio')
    return data
  },
}
