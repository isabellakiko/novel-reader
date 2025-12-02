/**
 * 主题状态管理
 *
 * 支持三种主题：light（白天）、dark（夜间）、sepia（护眼）
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 主题类型
 * @typedef {'light' | 'dark' | 'sepia'} Theme
 */

/**
 * 主题配置
 */
export const THEMES = {
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
 * 应用主题到 DOM
 * @param {Theme} theme
 */
function applyTheme(theme) {
  const root = document.documentElement

  // 移除所有主题类
  root.classList.remove('light', 'dark', 'sepia')

  // 添加新主题类
  root.classList.add(theme)

  // 更新 color-scheme
  if (theme === 'dark') {
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
      theme: 'light',

      /**
       * 设置主题
       * @param {Theme} theme
       */
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },

      /**
       * 切换到下一个主题
       */
      cycleTheme: () => {
        const themes = ['light', 'dark', 'sepia']
        const currentIndex = themes.indexOf(get().theme)
        const nextIndex = (currentIndex + 1) % themes.length
        const nextTheme = themes[nextIndex]
        applyTheme(nextTheme)
        set({ theme: nextTheme })
      },

      /**
       * 初始化主题（从存储恢复后应用到 DOM）
       */
      initTheme: () => {
        const { theme } = get()
        applyTheme(theme)
      },
    }),
    {
      name: 'novel-reader-theme',
      onRehydrateStorage: () => (state) => {
        // 存储恢复后应用主题
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)
