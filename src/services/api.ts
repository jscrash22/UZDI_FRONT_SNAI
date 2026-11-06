import axios from 'axios'
import { USE_MOCK, mockAdapter } from './mock/adapter'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Modo demo: sin backend, con datos ficticios en memoria (VITE_USE_MOCK=true).
if (USE_MOCK) api.defaults.adapter = mockAdapter

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uzdi_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Un 401 en el propio login significa "credenciales inválidas": no se recarga la página
    // (antes se perdía el mensaje de error al redirigir a /login).
    const isLogin = String(error.config?.url ?? '').includes('/auth/login')
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem('uzdi_token')
      localStorage.removeItem('uzdi_user')
      window.location.href = import.meta.env.VITE_ROUTER_MODE === 'hash'
        ? `${import.meta.env.BASE_URL}#/login`
        : '/login'
    }
    return Promise.reject(error)
  }
)

export default api
