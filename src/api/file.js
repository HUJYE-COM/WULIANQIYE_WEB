import request from './request'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export function resolveApiUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  let rel = path.startsWith('/') ? path : `/${path}`
  if (apiBaseUrl.endsWith('/api') && (rel === '/api' || rel.startsWith('/api/'))) {
    rel = rel.slice(4)
  }
  return `${apiBaseUrl}${rel}`
}

export function resolveContentUrls(content) {
  if (!content) return ''
  return content.replace(/(!\[[^\]]*]\()([^)\s]+)(\))/g, (match, open, url, close) => {
    if (!/\/(?:api\/)?file\/\d+/i.test(url) && !url.startsWith('/api/')) return match
    return `${open}${resolveApiUrl(url)}${close}`
  })
}

export function uploadFile(file, onUploadProgress) {
  const form = new FormData()
  form.append('file', file)
  return request.post('/file', form, {
    timeout: 0,
    onUploadProgress,
  })
}

export function getFilePreviewUrl(fileId) {
  return resolveApiUrl(`/file/${fileId}/preview`)
}

export function getFileDownloadUrl(fileId) {
  return resolveApiUrl(`/file/${fileId}`)
}
