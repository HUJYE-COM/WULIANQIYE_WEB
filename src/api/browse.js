import request from './request'

export function recordBrowse(data) {
  return request.post('/browse', data)
}

export function getBrowseCount(params = {}) {
  return request.get('/browse/count', { params })
}
