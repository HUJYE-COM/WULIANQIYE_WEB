import request from './request'

export function createLike(data) {
  return request.post('/like', data)
}

export function cancelLike(data) {
  return request.post('/like/cancel', data)
}

export function getLikeSummary(params = {}) {
  return request.get('/like/summary', { params })
}
