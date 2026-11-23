import api from './api'

// Catálogos normalizados del backend (cada uno expone { id, nombre, ... })
export interface CatalogoItem {
  id: number
  nombre: string
}

interface CatalogoBackend extends CatalogoItem {
  estado?: boolean
  activo?: boolean
}

export interface ProvinciaItem extends CatalogoItem {
  activo?: boolean
}

export interface CantonItem extends CatalogoItem {
  provincia_id?: number
  prov_id?: number
  activo?: boolean
}

export interface UzdiItem extends CatalogoItem {
  zona?: string
  cntn_id?: number
  activo?: boolean
}

export interface InfraccionItem extends CatalogoItem {
  categoria?: string
}

export interface MedidaItem extends CatalogoItem {
  duracion_meses?: number | null
  descripcion?: string
  activo?: boolean
}

function activoDe(item: CatalogoBackend): boolean {
  return item.activo ?? item.estado !== false
}

function normalizar<T extends CatalogoBackend>(item: T): T & { activo: boolean } {
  return { ...item, activo: activoDe(item) }
}

async function fetchList<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T[]> {
  const { data } = await api.get<unknown[]>(path, { params })
  if (!Array.isArray(data)) return []
  return data as T[]
}

export const catalogoService = {
  async nacionalidades(): Promise<CatalogoItem[]> {
    return (await fetchList<CatalogoBackend>('/nacionalidad')).map(normalizar)
  },
  async estadosCiviles(): Promise<CatalogoItem[]> {
    return (await fetchList<CatalogoBackend>('/estado-civil')).map(normalizar)
  },
  async etnias(): Promise<CatalogoItem[]> {
    return (await fetchList<CatalogoBackend>('/etnia')).map(normalizar)
  },
  async gdos(): Promise<CatalogoItem[]> {
    return (await fetchList<CatalogoBackend>('/gdo')).map(normalizar)
  },
  async cantones(provId?: number): Promise<CantonItem[]> {
    const lista = await fetchList<CantonBackend>('/canton', provId ? { prov_id: provId } : undefined)
    return lista.map((c) => normalizar({ ...c, provincia_id: c.provincia_id ?? c.prov_id }))
  },
  async provincias(): Promise<ProvinciaItem[]> {
    return (await fetchList<CatalogoBackend>('/provincia')).map(normalizar)
  },
  async uzdis(cntnId?: number): Promise<UzdiItem[]> {
    return (await fetchList<CatalogoBackend & { cntn_id?: number }>('/uzdi', cntnId ? { cntn_id: cntnId } : undefined)).map(normalizar)
  },
  async infracciones(incluirInactivos = false): Promise<InfraccionItem[]> {
    return (await fetchList<CatalogoBackend & { categoria?: string }>('/infraccion',
      incluirInactivos ? { incluirInactivos: true } : undefined)).map(normalizar)
  },
  async medidas(incluirInactivos = false): Promise<MedidaItem[]> {
    return (await fetchList<CatalogoBackend & { duracion_meses?: number | null; descripcion?: string }>('/medida-socioeducativa',
      incluirInactivos ? { incluirInactivos: true } : undefined)).map(normalizar)
  },
}

interface CantonBackend extends CatalogoBackend {
  provincia_id?: number
  prov_id?: number
}
