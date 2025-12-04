/**
 * Toast 通知状态管理
 *
 * 全局通知管理，支持多种类型（success, error, warning, info）
 */

import { create } from 'zustand'

let toastId = 0

const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * 添加 toast
   */
  addToast: (toast) => {
    const id = ++toastId
    const newToast = {
      id,
      type: 'info',
      duration: 3000,
      ...toast,
    }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // 自动移除
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }

    return id
  },

  /**
   * 移除 toast
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  /**
   * 清除所有 toast
   */
  clearAll: () => set({ toasts: [] }),

  // 便捷方法
  success: (message, options = {}) =>
    get().addToast({ type: 'success', message, ...options }),

  error: (message, options = {}) =>
    get().addToast({ type: 'error', message, duration: 5000, ...options }),

  warning: (message, options = {}) =>
    get().addToast({ type: 'warning', message, ...options }),

  info: (message, options = {}) =>
    get().addToast({ type: 'info', message, ...options }),
}))

export default useToastStore
