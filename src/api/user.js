import request from './request'

export function registerUser(data) {
  return request.post('/user', data)
}

export function loginUser(data) {
  return request.post('/user/login', data)
}

export function getCurrentUser() {
  return request.get('/user/me')
}

export function getPublicUser(userId) {
  return request.get(`/user/public/${userId}`)
}
