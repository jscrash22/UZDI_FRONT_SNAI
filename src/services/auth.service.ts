import api from './api'
import { tpprDesdePerfil } from '../router/access'

export interface PerfilBackend {
  id: number
  codigo: string
  nombre: string
}

export interface LoginResponse {
  message: string
  token: string
  sesion?: { id: number; inicio: string }
  perfil: PerfilBackend
  perfilesDisponibles?: PerfilBackend | PerfilBackend[]
  user: Record<string, unknown>
}

interface LoginBackend {
  message: string
  token: string
  sesion?: { id: number; inicio: string }
  perfil: PerfilBackend
  perfilesDisponibles?: PerfilBackend | PerfilBackend[]
  user: Record<string, unknown>
}

export const authService = {
  async login(login: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginBackend>('/auth/login', { login, password })
    const perfil = data.perfil
    return {
      message: data.message,
      token: data.token,
      sesion: data.sesion,
      perfil,
      perfilesDisponibles: data.perfilesDisponibles,
      // El id de rol del mock se deriva del perfil real en un único punto.
      user: { ...data.user, perfil, tppr_id: tpprDesdePerfil(perfil) },
    }
  },

  async logout(sesionId?: number): Promise<void> {
    if (!sesionId) return
    await api.post('/auth/logout', { sesionId })
  },
}
