/**
 * 阅读统计状态管理
 */

import { create } from 'zustand'
import { statsStore } from './db'

/**
 * 格式化时长（秒 -> 可读字符串）
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins}分钟`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (mins === 0) {
    return `${hours}小时`
  }
  return `${hours}小时${mins}分`
}

/**
 * 格式化字数
 */
export function formatCharacters(chars) {
  if (chars < 1000) {
    return `${chars}字`
  }
  if (chars < 10000) {
    return `${(chars / 1000).toFixed(1)}千字`
  }
  return `${(chars / 10000).toFixed(1)}万字`
}

/**
 * 阅读统计 Store
 */
export const useStatsStore = create((set, get) => ({
  // 统计数据
  todayStats: null,
  weekStats: null,
  allStats: null,
  isLoading: false,

  // 阅读会话追踪
  currentSession: null, // { bookId, startTime, characters }

  /**
   * 加载所有统计数据
   */
  loadStats: async () => {
    set({ isLoading: true })
    try {
      const [todayStats, weekStats, allStats] = await Promise.all([
        statsStore.getTodayStats(),
        statsStore.getWeekStats(),
        statsStore.getAllStats(),
      ])
      set({ todayStats, weekStats, allStats, isLoading: false })
    } catch (error) {
      console.error('加载统计数据失败:', error)
      set({ isLoading: false })
    }
  },

  /**
   * 开始阅读会话
   */
  startSession: (bookId) => {
    set({
      currentSession: {
        bookId,
        startTime: Date.now(),
        characters: 0,
      },
    })
  },

  /**
   * 更新阅读字数
   */
  addCharacters: (chars) => {
    const { currentSession } = get()
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          characters: currentSession.characters + chars,
        },
      })
    }
  },

  /**
   * 结束阅读会话并保存
   */
  endSession: async () => {
    const { currentSession } = get()
    if (!currentSession) return

    const duration = Math.floor((Date.now() - currentSession.startTime) / 1000)

    // 只记录超过 10 秒的阅读
    if (duration >= 10) {
      await statsStore.recordReading(
        currentSession.bookId,
        duration,
        currentSession.characters
      )
      // 重新加载统计
      get().loadStats()
    }

    set({ currentSession: null })
  },

  /**
   * 获取书籍统计
   */
  getBookStats: async (bookId) => {
    return statsStore.getBookStats(bookId)
  },
}))
