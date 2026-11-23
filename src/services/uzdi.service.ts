import api from './api'

export interface UzdiDto {
  id?: number
  nombre: string
  zona: string
  direccion?: string
  telefono?: string
  correo?: string
  cntn_id?: number
  provincia_id?: number
  activo?: boolean
  estado?: boolean
}

export const uzdiService = {
  async getById(id: number): Promise<UzdiDto> {
    const { data } = await api.get<UzdiDto>(`/uzdi/${id}`)
    return data
  },

  async update(id: number, payload: Partial<UzdiDto>): Promise<UzdiDto> {
    const { data } = await api.patch<UzdiDto>(`/uzdi/${id}`, payload)
    return data
  },
}
