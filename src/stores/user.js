import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getCurrentUser, loginUser, registerUser } from '@/api/user'
import { TOKEN_STORAGE_KEY } from '@/api/request'

const USER_STORAGE_KEY = 'zbj_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const user = ref(readStoredUser())
  const initialized = ref(false)
  const isLoggedIn = computed(() => Boolean(token.value && user.value))
  const isWebmaster = computed(() => user.value?.role === 'webmaster')

  function persistSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
  }

  function clearSession() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }

  async function login(credentials) {
    const data = await loginUser(credentials)
    persistSession(data.token, data.user)
    return data.user
  }

  async function register(profile) {
    await registerUser(profile)
    return login({
      account: profile.account,
      password: profile.password,
    })
  }

  async function initialize() {
    if (initialized.value) return
    initialized.value = true
    if (!token.value) {
      clearSession()
      return
    }
    try {
      const currentUser = await getCurrentUser()
      persistSession(token.value, currentUser)
    } catch {
      clearSession()
    }
  }

  function logout() {
    clearSession()
  }

  return {
    token,
    user,
    initialized,
    isLoggedIn,
    isWebmaster,
    login,
    register,
    initialize,
    logout,
  }
})
