import request from './request'

export function createFeedback(data) {
  return request.post('/feedback', data)
}

export function getFeedbacks(params = {}) {
  return request.get('/feedback/list', { params })
}

export function replyFeedback(id, content) {
  return request.post(`/feedback/${id}/reply`, { content })
}
