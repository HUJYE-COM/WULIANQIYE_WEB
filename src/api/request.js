import axios from 'axios'

import { ErrorCodes } from '@/constants/errorCodes'

export const TOKEN_STORAGE_KEY = 'zbj_token'

export class ApiError extends Error {
  constructor(code, message, data = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

/**
 * axios 实例
 * baseURL 优先读取环境变量 VITE_API_BASE_URL（见 .env.development）
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 请求拦截器：统一附加 token 等头信息
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一解包与错误处理
request.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload?.code && payload.code !== ErrorCodes.SUCCESS) {
      return Promise.reject(new ApiError(payload.code, payload.msg, payload.data))
    }
    return payload?.code === ErrorCodes.SUCCESS ? payload.data : payload
  },
  (error) => {
    const payload = error?.response?.data
    if (payload?.code) {
      return Promise.reject(new ApiError(payload.code, payload.msg, payload.data))
    }
    return Promise.reject(error)
  },
)

export default request
