import request from './request'

export function uploadFile(file, onUploadProgress) {
  const form = new FormData()
  form.append('file', file)
  return request.post('/file', form, {
    timeout: 0,
    onUploadProgress,
  })
}

export function getFilePreviewUrl(fileId) {
  return `/api/file/${fileId}/preview`
}

export function getFileDownloadUrl(fileId) {
  return `/api/file/${fileId}`
}
