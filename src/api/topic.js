import request from './request'

export function createTopic(data) {
  return request.post('/topic', data)
}

export function getTopicList(params = {}) {
  return request.get('/topic/list', { params })
}

export function getHotTopicTags(params = {}) {
  return request.get('/topic/tags', { params })
}

export function getTopic(id) {
  return request.get(`/topic/${id}`)
}

export function updateTopic(id, data) {
  return request.put(`/topic/${id}`, data)
}

export function deleteTopic(id) {
  return request.delete(`/topic/${id}`)
}
