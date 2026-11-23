import api, { apiMock } from './api'
import { perfilBackendDesdeTppr, tpprDesdePerfil, ROLE_LABEL } from '../router/access'

export interface RolDto {
  id: number
  nombre: string
  codigo?: string
}

export interface UsuarioDto {
  id?: number
  uzdi_id?: number
  tppr_id?: number
  tppr_ids?: number[]
  perfiles_ids?: number[]
  cedula?: string
  cargo?: string
  nombres: string
  apellidos: string
  login: string
  correo?: string
  telefono?: string
  password?: string
  activo?: boolean
  debe_cambiar_clave?: boolean
  perfiles?: RolDto[]
  sexo?: string
  direccion?: string
  observaciones?: string
}

export interface UsuarioRow {
  id: number
  nombre: string
  login: string
  correo: string
  cedula: string
  cargo: string
  uzdi_id?: number
  roles: RolDto[]
  estado: string
  tono: string
  debeCambiarClave: boolean
  _raw: UsuarioDto
}

interface ApiUser {
  id: number
  uzdi_id?: number | null
  tppr_id?: number
  nombres: string
  apellidos: string
  correo?: string | null
  login: string
  telefono?: string | null
  estado?: boolean
  debe_cambiar_clave?: boolean
  sexo?: string | null
  direccion?: string | null
  observaciones?: string | null
}

interface PerfilApi {
  id: number
  codigo?: string
  nombre: string
}

function perfilesDe(usuario: ApiUser): Promise<RolDto[]> {
  return api.get<PerfilApi[]>(`/users/${usuario.id}/perfiles`)
    .then(({ data }) => data.map((p) => ({
      id: tpprDesdePerfil(p),
      nombre: p.nombre || ROLE_LABEL[tpprDesdePerfil(p)],
      codigo: p.codigo,
    })))
    .catch(() => [])
}

function payload(dto: Partial<UsuarioDto>): Record<string, unknown> {
  const roles = dto.perfiles_ids ?? dto.tppr_ids ?? []
  const result: Record<string, unknown> = {}
  const simples: (keyof UsuarioDto)[] = [
    'nombres', 'apellidos', 'login', 'correo', 'telefono', 'password',
    'uzdi_id', 'sexo', 'direccion', 'observaciones',
  ]
  for (const clave of simples) {
    if (dto[clave] !== undefined) result[clave] = dto[clave]
  }
  if (roles.length) {
    const perfiles = roles.map(perfilBackendDesdeTppr)
    result.perfiles_ids = perfiles
    result.tppr_id = perfiles[0]
  }
  return result
}

export const usuarioService = {
  async getAll(activo: 'true' | 'false' = 'true'): Promise<UsuarioRow[]> {
    const { data } = await api.get<ApiUser[]>('/users', {
      params: activo === 'true' ? undefined : { activo },
    })
    const perfiles = await Promise.all(data.map(perfilesDe))
    return data.map((u, i) => {
      const roles = perfiles[i]
      const tppr_ids = roles.map((r) => r.id)
      return {
        id: u.id,
        nombre: `${u.nombres} ${u.apellidos}`,
        login: u.login,
        correo: u.correo ?? '—',
        cedula: '—',
        cargo: '—',
        uzdi_id: u.uzdi_id ?? undefined,
        roles,
        estado: u.estado === false ? 'Inactivo' : 'Activo',
        tono: u.estado === false ? 'slate' : 'green',
        debeCambiarClave: !!u.debe_cambiar_clave,
        _raw: {
          id: u.id,
          uzdi_id: u.uzdi_id ?? undefined,
          tppr_id: tppr_ids[0],
          tppr_ids,
          perfiles_ids: roles.map((r) => perfilBackendDesdeTppr(r.id)),
          nombres: u.nombres,
          apellidos: u.apellidos,
          login: u.login,
          correo: u.correo ?? undefined,
          telefono: u.telefono ?? undefined,
          activo: u.estado !== false,
          debe_cambiar_clave: !!u.debe_cambiar_clave,
          sexo: u.sexo ?? undefined,
          direccion: u.direccion ?? undefined,
          observaciones: u.observaciones ?? undefined,
        },
      }
    })
  },

  async create(dto: Omit<UsuarioDto, 'id'>): Promise<UsuarioDto> {
    const { data } = await api.post<Record<string, unknown>>('/users', payload(dto))
    return data as unknown as UsuarioDto
  },

  async update(id: number, dto: Partial<UsuarioDto>): Promise<UsuarioDto> {
    const { data } = await api.patch<Record<string, unknown>>(`/users/${id}`, payload(dto))
    return data as unknown as UsuarioDto
  },

  async deactivate(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async resetPassword(id: number): Promise<string> {
    // PENDIENTE BACKEND: POST /api/v1/users/:id/reset-password con contraseña temporal.
    const { data } = await apiMock.post<{ temporal: string }>(`/users/${id}/reset-password`)
    return data.temporal
  },
}
