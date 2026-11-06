import api from './api'

interface LoginResponse {
  message: string
  token: string
  user: Record<string, unknown>
}

export const authService = {
  async login(login: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { login, password })
    return data
  },
}
