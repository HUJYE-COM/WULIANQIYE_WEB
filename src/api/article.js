import request from './request'

export function createArticle(data) {
  return request.post('/article', data)
}

export function getMyArticles(params = {}) {
  return request.get('/article/mine', { params })
}

export function getPublishedArticles(params = {}) {
  return request.get('/article/list', { params })
}

export function getHotArticles(params = {}) {
  return request.get('/article/hot', { params })
}

export function getArticle(id) {
  return request.get(`/article/${id}`)
}

export function updateArticle(id, data) {
  return request.put(`/article/${id}`, data)
}

export function publishArticle(id) {
  return request.post(`/article/${id}/publish`)
}

export function withdrawArticle(id) {
  return request.post(`/article/${id}/withdraw`)
}

export function deleteArticle(id) {
  return request.delete(`/article/${id}`)
}
