import api from './api'

// Catálogos normalizados del backend (cada uno expone { id, nombre, ... })
export interface CatalogoItem {
  id: number
  nombre: string
}

export interface ProvinciaItem extends CatalogoItem {
  activo?: boolean
}

export interface CantonItem extends CatalogoItem {
  provincia_id?: number
  activo?: boolean
}

export interface UzdiItem extends CatalogoItem {
  zona?: string
  cntn_id?: number
  provincia_id?: number
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

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const { data } = await api.get<T[]>(path)
    return data
  } catch {
    return []
  }
}

export const catalogoService = {
  nacionalidades: () => fetchList<CatalogoItem>('/nacionalidad'),
  estadosCiviles: () => fetchList<CatalogoItem>('/estado-civil'),
  etnias: () => fetchList<CatalogoItem>('/etnia'),
  gdos: () => fetchList<CatalogoItem>('/gdo'),
  cantones: () => fetchList<CantonItem>('/canton'),
  provincias: () => fetchList<ProvinciaItem>('/provincia'),
  uzdis: () => fetchList<UzdiItem>('/uzdi'),
  infracciones: () => fetchList<InfraccionItem>('/infraccion'),
  medidas: () => fetchList<MedidaItem>('/medida-socioeducativa'),
}
