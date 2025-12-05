/**
 * 主题状态管理
 *
 * 支持四种主题：system（跟随系统）、light（白天）、dark（夜间）、sepia（护眼）
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 主题类型
 * @typedef {'system' | 'light' | 'dark' | 'sepia' | 'green' | 'mint' | 'purple'} Theme
 */

/**
 * 主题配置
 */
export const THEMES = {
  system: {
    name: '自动',
    icon: 'Monitor',
    group: 'system',
  },
  light: {
    name: '白天',
    icon: 'Sun',
    group: 'light',
  },
  dark: {
    name: '夜间',
    icon: 'Moon',
    group: 'dark',
  },
  sepia: {
    name: '暖黄',
    icon: 'Eye',
    group: 'light',
  },
  green: {
    name: '豆沙绿',
    icon: 'Leaf',
    group: 'light',
  },
  mint: {
    name: '薄荷蓝',
    icon: 'Droplets',
    group: 'light',
  },
  purple: {
    name: '暗紫',
    icon: 'Moon',
    group: 'dark',
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
  root.classList.remove('light', 'dark', 'sepia', 'green', 'mint', 'purple')

  // 添加新主题类
  root.classList.add(actualTheme)

  // 根据主题组设置 color-scheme
  const themeConfig = THEMES[actualTheme]
  if (themeConfig?.group === 'dark' || actualTheme === 'dark' || actualTheme === 'purple') {
    root.style.colorScheme = 'dark'
  } else {
    root.style.colorScheme = 'light'
  }
}

// 全局存储系统主题监听器，确保只有一个
let systemThemeListener = null
let systemThemeMediaQuery = null

/**
 * 设置系统主题变化监听器（单例模式）
 * @param {Function} getTheme - 获取当前主题的函数
 */
function setupSystemThemeListener(getTheme) {
  if (typeof window === 'undefined') return

  // 移除旧的监听器（如果存在）
  cleanupSystemThemeListener()

  // 创建新的监听器
  systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemThemeListener = () => {
    const currentTheme = getTheme()
    if (currentTheme === 'system') {
      applyTheme('system', true)
    }
  }

  // 添加监听器
  systemThemeMediaQuery.addEventListener('change', systemThemeListener)
}

/**
 * 清理系统主题监听器
 */
function cleanupSystemThemeListener() {
  if (systemThemeMediaQuery && systemThemeListener) {
    systemThemeMediaQuery.removeEventListener('change', systemThemeListener)
    systemThemeListener = null
    systemThemeMediaQuery = null
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

        // 根据新主题决定是否需要系统主题监听
        if (theme === 'system') {
          setupSystemThemeListener(() => get().theme)
        } else {
          cleanupSystemThemeListener()
        }
      },

      /**
       * 切换到下一个主题
       */
      cycleTheme: () => {
        const themes = Object.keys(THEMES)
        const currentIndex = themes.indexOf(get().theme)
        const nextIndex = (currentIndex + 1) % themes.length
        const nextTheme = themes[nextIndex]

        applyTheme(nextTheme, nextTheme === 'system')
        set({ theme: nextTheme })

        // 根据新主题决定是否需要系统主题监听
        if (nextTheme === 'system') {
          setupSystemThemeListener(() => get().theme)
        } else {
          cleanupSystemThemeListener()
        }
      },

      /**
       * 初始化主题（从存储恢复后应用到 DOM）
       */
      initTheme: () => {
        const { theme } = get()
        applyTheme(theme, theme === 'system')

        // 如果是系统模式，设置监听器
        if (theme === 'system') {
          setupSystemThemeListener(() => get().theme)
        }
      },

      /**
       * 获取实际应用的主题（处理 system 模式）
       */
      getActualTheme: () => {
        const { theme } = get()
        return theme === 'system' ? getSystemTheme() : theme
      },

      /**
       * 清理资源（组件卸载时调用）
       */
      cleanup: () => {
        cleanupSystemThemeListener()
      },
    }),
    {
      name: 'novel-reader-theme',
      onRehydrateStorage: () => (state) => {
        // 存储恢复后应用主题
        if (state) {
          applyTheme(state.theme, state.theme === 'system')

          // 如果是系统模式，设置监听器（使用单例确保不重复）
          if (state.theme === 'system' && typeof window !== 'undefined') {
            // 延迟设置，确保 store 完全初始化
            setTimeout(() => {
              setupSystemThemeListener(() => useThemeStore.getState().theme)
            }, 0)
          }
        }
      },
    }
  )
)
