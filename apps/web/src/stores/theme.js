/**
 * 主题状态管理
 *
 * 支持四种主题：system（跟随系统）、light（白天）、dark（夜间）、sepia（护眼）
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 主题类型
 * @typedef {'system' | 'light' | 'dark' | 'sepia'} Theme
 */

/**
 * 主题配置
 */
export const THEMES = {
  system: {
    name: '自动',
    icon: 'Monitor',
  },
  light: {
    name: '白天',
    icon: 'Sun',
  },
  dark: {
    name: '夜间',
    icon: 'Moon',
  },
  sepia: {
    name: '护眼',
    icon: 'Eye',
  },
}

/**
 * 获取系统偏好的主题
 */
function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * 应用主题到 DOM
 * @param {Theme} theme - 用户选择的主题
 * @param {boolean} isSystem - 是否为系统主题模式
 */
function applyTheme(theme, isSystem = false) {
  const root = document.documentElement

  // 如果是系统模式，获取实际主题
  const actualTheme = isSystem ? getSystemTheme() : theme

  // 移除所有主题类
  root.classList.remove('light', 'dark', 'sepia')

  // 添加新主题类
  root.classList.add(actualTheme)

  // 更新 color-scheme
  if (actualTheme === 'dark') {
    root.style.colorScheme = 'dark'
  } else {
    root.style.colorScheme = 'light'
  }
}

/**
 * 主题 Store
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 默认跟随系统

      /**
       * 设置主题
       * @param {Theme} theme
       */
      setTheme: (theme) => {
        applyTheme(theme, theme === 'system')
        set({ theme })
      },

      /**
       * 切换到下一个主题
       */
      cycleTheme: () => {
        const themes = ['system', 'light', 'dark', 'sepia']
        const currentIndex = themes.indexOf(get().theme)
        const nextIndex = (currentIndex + 1) % themes.length
        const nextTheme = themes[nextIndex]
        applyTheme(nextTheme, nextTheme === 'system')
        set({ theme: nextTheme })
      },

      /**
       * 初始化主题（从存储恢复后应用到 DOM）
       */
      initTheme: () => {
        const { theme } = get()
        applyTheme(theme, theme === 'system')

        // 监听系统主题变化
        if (theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = () => {
            const currentTheme = get().theme
            if (currentTheme === 'system') {
              applyTheme('system', true)
            }
          }
          mediaQuery.addEventListener('change', handleChange)
        }
      },

      /**
       * 获取实际应用的主题（处理 system 模式）
       */
      getActualTheme: () => {
        const { theme } = get()
        return theme === 'system' ? getSystemTheme() : theme
      },
    }),
    {
      name: 'novel-reader-theme',
      onRehydrateStorage: () => (state) => {
        // 存储恢复后应用主题
        if (state) {
          applyTheme(state.theme, state.theme === 'system')

          // 监听系统主题变化
          if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handleChange = () => {
              if (state.theme === 'system') {
                applyTheme('system', true)
              }
            }
            mediaQuery.addEventListener('change', handleChange)
          }
        }
      },
    }
  )
)
