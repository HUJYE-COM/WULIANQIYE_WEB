import request from './request'

export function createComment(data) {
  return request.post('/comment', data)
}

export function getCommentList(params = {}) {
  return request.get('/comment/list', { params })
}

export function getCommentReplies(params = {}) {
  return request.get('/comment/replies', { params })
}

export function deleteComment(id) {
  return request.delete(`/comment/${id}`)
}
