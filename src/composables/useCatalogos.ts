import { ref } from 'vue'
import {
  catalogoService,
  type CatalogoItem,
  type CantonItem,
  type ProvinciaItem,
  type UzdiItem,
  type InfraccionItem,
  type MedidaItem,
} from '../services/catalogo.service'

// Estado global compartido: los catálogos se cargan una sola vez por sesión.
const nacionalidades = ref<CatalogoItem[]>([])
const estadosCiviles = ref<CatalogoItem[]>([])
const etnias = ref<CatalogoItem[]>([])
const gdos = ref<CatalogoItem[]>([])
const cantones = ref<CantonItem[]>([])
const provincias = ref<ProvinciaItem[]>([])
const uzdis = ref<UzdiItem[]>([])
const infracciones = ref<InfraccionItem[]>([])
const medidas = ref<MedidaItem[]>([])
let cargado = false

export function useCatalogos() {
  async function cargarCatalogos(force = false) {
    if (cargado && !force) return
    const [n, ec, et, g, c, p, u, i, m] = await Promise.all([
      catalogoService.nacionalidades(),
      catalogoService.estadosCiviles(),
      catalogoService.etnias(),
      catalogoService.gdos(),
      catalogoService.cantones(),
      catalogoService.provincias(),
      catalogoService.uzdis(),
      catalogoService.infracciones(),
      catalogoService.medidas(),
    ])
    nacionalidades.value = n
    estadosCiviles.value = ec
    etnias.value = et
    gdos.value = g
    cantones.value = c
    provincias.value = p
    uzdis.value = u
    infracciones.value = i
    medidas.value = m
    cargado = true
  }

  return {
    nacionalidades,
    estadosCiviles,
    etnias,
    gdos,
    cantones,
    provincias,
    uzdis,
    infracciones,
    medidas,
    cargarCatalogos,
  }
}
