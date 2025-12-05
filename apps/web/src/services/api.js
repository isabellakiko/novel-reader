/**
 * API 服务层
 *
 * 封装后端 API 调用，处理认证和错误
 */

import axios from 'axios'
import useToastStore from '../stores/toast'

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加 Token
api.interceptors.request.use(
  (config) => {
    // 从 auth store 同步的独立 key 读取 token
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const toast = useToastStore.getState()

    if (error.response) {
      const { status, data } = error.response

      // Token 过期或无效
      if (status === 401) {
        // 清理 auth store 的持久化数据
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('auth-token')
        toast.warning('登录已过期，请重新登录')
        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      } else if (status === 403) {
        toast.error('没有权限执行此操作')
      } else if (status === 404) {
        // 404 不显示全局提示，让调用方处理
      } else if (status >= 500) {
        toast.error('服务器错误，请稍后重试')
      }

      // 返回服务端错误信息
      return Promise.reject({
        status,
        message: data?.message || '请求失败',
        ...data,
      })
    }

    // 网络错误
    if (error.code === 'ECONNABORTED') {
      toast.error('请求超时，请检查网络连接')
    } else if (!navigator.onLine) {
      toast.warning('网络已断开，请检查连接')
    } else {
      toast.error('网络错误，请检查连接')
    }

    return Promise.reject({
      status: 0,
      message: '网络错误，请检查连接',
    })
  }
)

// ==================== 认证 API ====================

export const authApi = {
  /**
   * 用户注册
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * 用户登录
   */
  login: (data) => api.post('/auth/login', data),

  /**
   * 获取当前用户信息
   */
  getMe: () => api.get('/auth/me'),

  /**
   * 刷新 Token
   */
  refresh: () => api.post('/auth/refresh'),
}

// ==================== 书籍 API ====================

export const bookApi = {
  /**
   * 上传书籍
   */
  upload: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/books/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
  },

  /**
   * 获取书籍列表
   */
  getList: (page = 0, size = 20) =>
    api.get('/books', { params: { page, size } }),

  /**
   * 获取书籍详情
   */
  getDetail: (bookId) => api.get(`/books/${bookId}`),

  /**
   * 获取章节内容
   */
  getChapter: (bookId, chapterIndex) =>
    api.get(`/books/${bookId}/chapters/${chapterIndex}`),

  /**
   * 删除书籍
   */
  delete: (bookId) => api.delete(`/books/${bookId}`),

  /**
   * 搜索书籍
   */
  search: (keyword, page = 0, size = 20) =>
    api.get('/books/search', { params: { keyword, page, size } }),
}

// ==================== 阅读进度 API ====================

export const progressApi = {
  /**
   * 更新阅读进度
   */
  update: (data) => api.post('/progress', data),

  /**
   * 获取书籍阅读进度
   */
  getByBook: (bookId) => api.get(`/progress/book/${bookId}`),

  /**
   * 获取所有阅读进度
   */
  getAll: () => api.get('/progress'),

  /**
   * 获取最近阅读
   */
  getRecent: (limit = 10) =>
    api.get('/progress/recent', { params: { limit } }),
}

// ==================== 书签 API ====================

export const bookmarkApi = {
  /**
   * 创建书签
   */
  create: (data) => api.post('/progress/bookmarks', data),

  /**
   * 获取书籍书签
   */
  getByBook: (bookId) => api.get(`/progress/bookmarks/book/${bookId}`),

  /**
   * 获取所有书签
   */
  getAll: (page = 0, size = 20) =>
    api.get('/progress/bookmarks', { params: { page, size } }),

  /**
   * 删除书签
   */
  delete: (bookmarkId) => api.delete(`/progress/bookmarks/${bookmarkId}`),
}

export default api
