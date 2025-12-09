/**
 * 认证状态管理
 *
 * 处理用户登录、注册、登出和会话持久化
 * Token 只通过 Zustand persist 存储，避免双重存储问题
 * 包含自动 Token 刷新机制
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authApi } from '../services/api'

/**
 * 解析 JWT Token 获取过期时间
 * @param {string} token
 * @returns {number|null} 过期时间戳（毫秒）
 */
function getTokenExpiration(token) {
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

// 刷新 Token 的定时器
let refreshTimer = null

// 刷新锁，防止并发刷新
let isRefreshing = false
let refreshPromise = null

/**
 * 设置 Token 自动刷新定时器
 * 在过期前 5 分钟刷新
 */
function setupRefreshTimer(token, refreshFn) {
  // 清除旧的定时器
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }

  const expiration = getTokenExpiration(token)
  if (!expiration) return

  // 计算距离过期还有多久
  const now = Date.now()
  const timeUntilExpiry = expiration - now

  // 在过期前 5 分钟刷新（如果不足 5 分钟则立即刷新）
  const refreshBuffer = 5 * 60 * 1000 // 5 分钟
  const refreshIn = Math.max(0, timeUntilExpiry - refreshBuffer)

  // 如果已过期，不设置定时器
  if (timeUntilExpiry <= 0) return

  // FIXED: 如果已在缓冲区内（refreshIn === 0），立即刷新而非设置 0ms 定时器
  if (refreshIn === 0) {
    // 使用 setTimeout(0) 避免同步调用导致的问题
    setTimeout(() => refreshFn(), 0)
    return
  }

  refreshTimer = setTimeout(() => {
    refreshFn()
  }, refreshIn)
}

// FIXED: 简化存储，移除双重 token key，统一使用 auth-storage
const authStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.login(credentials)
          const { token, user } = data.data

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          // 设置 Token 自动刷新
          setupRefreshTimer(token, () => get().refreshToken())

          return { success: true }
        } catch (err) {
          const message = err.message || '登录失败'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      // 注册
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.register(userData)
          const { token, user } = data.data

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          // 设置 Token 自动刷新
          setupRefreshTimer(token, () => get().refreshToken())

          return { success: true }
        } catch (err) {
          const message = err.message || '注册失败'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      // 登出
      logout: () => {
        // 清理刷新定时器
        if (refreshTimer) {
          clearTimeout(refreshTimer)
          refreshTimer = null
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      // 刷新 Token（带并发保护）
      refreshToken: async () => {
        const { token, isAuthenticated } = get()
        if (!token || !isAuthenticated) return false

        // 如果已经在刷新中，返回当前的 Promise
        if (isRefreshing && refreshPromise) {
          return refreshPromise
        }

        isRefreshing = true
        refreshPromise = (async () => {
          try {
            const data = await authApi.refresh()
            const { token: newToken, user } = data.data

            set({
              user,
              token: newToken,
              isAuthenticated: true,
            })

            // 设置下一次刷新
            setupRefreshTimer(newToken, () => get().refreshToken())

            return true
          } catch (err) {
            // 刷新失败，可能是 token 已过期，清理状态
            console.error('Token refresh failed:', err)
            // 不自动登出，让 401 拦截器处理
            return false
          } finally {
            isRefreshing = false
            refreshPromise = null
          }
        })()

        return refreshPromise
      },

      // 获取当前 token（供其他模块使用）
      getToken: () => {
        return get().token
      },

      // 检查认证状态（从存储恢复后验证 token 有效性）
      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null })
          return false
        }

        // 检查 token 是否已过期
        const expiration = getTokenExpiration(token)
        if (expiration && Date.now() >= expiration) {
          // Token 已过期，清理状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
          return false
        }

        set({ isLoading: true })
        try {
          const data = await authApi.getMe()
          set({
            user: data.data,
            isAuthenticated: true,
            isLoading: false,
          })

          // 设置 Token 自动刷新
          setupRefreshTimer(token, () => get().refreshToken())

          return true
        } catch (err) {
          // Token 无效，清理状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
          return false
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // FIXED: 移除 onRehydrateStorage 中的 auth-token 同步，统一使用 auth-storage
    }
  )
)

export default useAuthStore
