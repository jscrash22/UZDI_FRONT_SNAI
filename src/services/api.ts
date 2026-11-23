import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ref } from 'vue'
import { USE_MOCK, mockAdapter } from './mock/adapter'
import { useToast } from '../composables/useToast'

export { USE_MOCK } from './mock/adapter'

/** Se activa cuando una petición supera los 5 s (arranque en frío de Render). */
export const conectandoLento = ref(false)

export interface ApiError extends Error {
  status?: number
  errores?: string[]
  mensajeUsuario: string
}

interface Envelope {
  ok?: boolean
  message?: unknown
  data?: unknown
  errors?: unknown
}

const TIEMPO_ESPERA_MS = 60_000
const AVISO_LENTO_MS = 5_000

function urlBase(): string {
  const configurada = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
  if (!configurada) return 'https://uzdi-backend-api.onrender.com/api/v1'
  const limpia = String(configurada).replace(/\/+$/, '')
  // Compatibilidad temporal: VITE_API_BASE_URL llegaba sin el prefijo /api/v1.
  if (import.meta.env.VITE_API_URL || limpia.endsWith('/api/v1')) return limpia
  return `${limpia}/api/v1`
}

function texto(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    for (const clave of ['message', 'msg', 'detalle', 'error']) {
      if (typeof obj[clave] === 'string' && obj[clave]) return String(obj[clave])
    }
  }
  return ''
}

function listaErrores(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => texto(item)).filter(Boolean)
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((item) => texto(item) || (Array.isArray(item) ? item.map(texto).filter(Boolean).join(', ') : ''))
      .filter(Boolean)
  }
  return []
}

function esEnvelope(value: unknown): value is Envelope {
  return !!value && typeof value === 'object' && 'ok' in value && 'data' in value
}

export function mensajeError(error: unknown): string {
  const err = error as Partial<ApiError> & {
    response?: { status?: number; data?: unknown }
    config?: { url?: string }
  }
  if (err?.mensajeUsuario) return err.mensajeUsuario
  const body = err?.response?.data
  const status = err?.response?.status ?? err?.status
  const partes: string[] = []
  if (body && typeof body === 'object') {
    const obj = body as Envelope & Record<string, unknown>
    const mensaje = texto(obj.message)
    if (mensaje) partes.push(mensaje)
    partes.push(...listaErrores(obj.errors))
  }
  if (!partes.length && status === 403) return 'No tiene permisos para realizar esta acción.'
  if (!partes.length && !status) return 'No se pudo conectar con el servidor. Intente nuevamente.'
  return partes.join('. ') || 'No se pudo completar la operación. Intente nuevamente.'
}

function normalizar(error: unknown): ApiError {
  const err = error as Partial<ApiError> & { response?: { status?: number; data?: unknown } }
  const status = err?.response?.status ?? err?.status
  const original = error instanceof Error ? error : new Error(mensajeError(error))
  const mensaje = status === 403 && !texto((err?.response?.data as Envelope | undefined)?.message)
    ? 'No tiene permisos para realizar esta acción.'
    : mensajeError(error)
  return Object.assign(original, {
    status,
    errores: listaErrores((err?.response?.data as Envelope | undefined)?.errors),
    mensajeUsuario: mensaje,
  }) as ApiError
}

let peticionesPendientes = 0
let temporizadorAviso: ReturnType<typeof setTimeout> | undefined

function iniciarCarga(): void {
  peticionesPendientes += 1
  if (peticionesPendientes === 1) {
    temporizadorAviso = setTimeout(() => {
      conectandoLento.value = true
      useToast().info('Conectando con el servidor, puede tardar unos segundos…')
    }, AVISO_LENTO_MS)
  }
}

function finalizarCarga(): void {
  peticionesPendientes = Math.max(0, peticionesPendientes - 1)
  if (peticionesPendientes === 0) {
    if (temporizadorAviso) clearTimeout(temporizadorAviso)
    temporizadorAviso = undefined
    conectandoLento.value = false
  }
}

function esLogin(config: InternalAxiosRequestConfig): boolean {
  return String(config.url ?? '').includes('/auth/login')
}

function alRecibir(response: AxiosResponse): AxiosResponse {
  finalizarCarga()
  const contenido = response.data
  if (esEnvelope(contenido)) {
    if (contenido.ok === false) {
      throw normalizar(Object.assign(new Error(mensajeError(contenido)), {
        response: { status: response.status, data: contenido },
      }))
    }
    response.data = contenido.data
  }
  return response
}

function alFallar(error: unknown): Promise<never> {
  finalizarCarga()
  const normalizeError = normalizar(error)
  const config = (error as { config?: InternalAxiosRequestConfig })?.config
  const status = normalizeError.status
  if (status === 401 && !config?.url?.includes('/auth/login')) {
    localStorage.removeItem('uzdi_token')
    localStorage.removeItem('uzdi_user')
    const destino = import.meta.env.VITE_ROUTER_MODE === 'hash'
      ? `${import.meta.env.BASE_URL}#/login`
      : '/login'
    window.location.href = destino
  } else if (!esLogin(config ?? { url: '' } as InternalAxiosRequestConfig)) {
    useToast().error(normalizeError.mensajeUsuario)
  }
  return Promise.reject(normalizeError)
}

function configurar(cliente: AxiosInstance, conTokenReal: boolean): void {
  cliente.interceptors.request.use((config) => {
    const token = conTokenReal
      ? localStorage.getItem('uzdi_token')
      : tokenDemoParaMock()
    if (token) config.headers.Authorization = `Bearer ${token}`
    iniciarCarga()
    return config
  })
  cliente.interceptors.response.use(alRecibir, alFallar)
}

/** Usuario demo equivalente al perfil real, para los módulos que siguen en mock. */
function tokenDemoParaMock(): string {
  const PERFIL_DEMO: Record<string, number> = {
    ADM: 2, CORD: 3, LEGAL: 7, TSOC: 4, PSIC: 5, EDUC: 6, CONS: 8, JUEZ: 7,
  }
  const ROLES_DEMO: Record<number, number> = {
    1: 4, 2: 3, 3: 2, 4: 1, 5: 8, 6: 5, 7: 6, 8: 7,
  }
  try {
    const usuario = JSON.parse(localStorage.getItem('uzdi_user') ?? 'null') as {
      id?: number
      tppr_id?: number
      perfil?: { codigo?: string }
    } | null
    const codigo = String(usuario?.perfil?.codigo ?? '').toUpperCase()
    const id = PERFIL_DEMO[codigo] ?? ROLES_DEMO[Number(usuario?.tppr_id)] ?? Number(usuario?.id)
    return `demo-token-${Number(id) || 2}`
  } catch {
    return 'demo-token-2'
  }
}

export const api = axios.create({
  baseURL: urlBase(),
  timeout: TIEMPO_ESPERA_MS,
  headers: { 'Content-Type': 'application/json' },
})

// Modo demo: sin backend, con datos ficticios en memoria (VITE_USE_MOCK=true).
if (USE_MOCK) api.defaults.adapter = mockAdapter
configurar(api, true)

/**
 * Cliente exclusivo de los módulos cuyo endpoint aún no existe en el backend.
 * Sigue usando el mock aunque VITE_USE_MOCK=false, sin caer en silencio.
 */
export const apiMock = axios.create({
  baseURL: urlBase(),
  timeout: TIEMPO_ESPERA_MS,
  headers: { 'Content-Type': 'application/json' },
})
apiMock.defaults.adapter = mockAdapter
configurar(apiMock, false)

export default api
