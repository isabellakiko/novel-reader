/**
 * 认证状态管理
 *
 * 处理用户登录、注册、登出和会话持久化
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

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

          // 保存到 localStorage（供 axios 拦截器使用）
          localStorage.setItem('token', token)

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

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

          localStorage.setItem('token', token)

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return { success: true }
        } catch (err) {
          const message = err.message || '注册失败'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      // 登出
      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      // 检查认证状态（从 localStorage 恢复）
      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null })
          return false
        }

        set({ isLoading: true })
        try {
          const data = await authApi.getMe()
          set({
            user: data.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
          return true
        } catch (err) {
          // Token 无效，清理状态
          localStorage.removeItem('token')
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
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
