import { reactive } from 'vue'
import { defineStore } from 'pinia'

import { getPublicUser } from '@/api/user'

export const usePublicUserStore = defineStore('public-user', () => {
  const users = reactive({})
  const pendingRequests = new Map()

  function getCachedUser(userId) {
    return users[userId] || null
  }

  async function fetchUser(userId) {
    if (!userId) return null
    if (users[userId]) return users[userId]
    if (pendingRequests.has(userId)) return pendingRequests.get(userId)

    const request = getPublicUser(userId)
      .then((user) => {
        users[userId] = user
        return user
      })
      .finally(() => {
        pendingRequests.delete(userId)
      })
    pendingRequests.set(userId, request)
    return request
  }

  return {
    users,
    getCachedUser,
    fetchUser,
  }
})
