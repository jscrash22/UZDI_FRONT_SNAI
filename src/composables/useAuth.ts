import { ref, computed } from 'vue'

const token = ref<string>(localStorage.getItem('uzdi_token') ?? '')
const user = ref<Record<string, unknown> | null>(
  JSON.parse(localStorage.getItem('uzdi_user') ?? 'null')
)

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value)

  function setSession(newToken: string, newUser: Record<string, unknown>) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('uzdi_token', newToken)
    localStorage.setItem('uzdi_user', JSON.stringify(newUser))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('uzdi_token')
    localStorage.removeItem('uzdi_user')
  }

  return { token, user, isLoggedIn, setSession, logout }
}
