/**
 * 搜索状态管理
 *
 * 管理搜索状态，与 Web Worker 交互
 * 支持多种搜索模式
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { booksStore } from './db'

/**
 * 搜索模式定义
 */
export const SEARCH_MODES = {
  overview: {
    id: 'overview',
    name: '章节概览',
    description: '每章显示1条，快速定位包含关键词的章节',
    icon: 'List',
  },
  detailed: {
    id: 'detailed',
    name: '详细搜索',
    description: '显示所有匹配结果，按章节分组',
    icon: 'FileText',
  },
  frequency: {
    id: 'frequency',
    name: '频率统计',
    description: '统计各章节出现次数，按热度排序',
    icon: 'BarChart3',
  },
  timeline: {
    id: 'timeline',
    name: '时间线',
    description: '按章节顺序展示，追踪关键词演变',
    icon: 'Clock',
  },
}

// 创建 Worker 实例
let searchWorker = null

function getSearchWorker() {
  if (!searchWorker) {
    searchWorker = new Worker(
      new URL('../workers/search.worker.js', import.meta.url),
      { type: 'module' }
    )
  }
  return searchWorker
}

/**
 * 生成唯一搜索 ID
 */
function generateSearchId() {
  return `search_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 搜索 Store
 */
export const useSearchStore = create(
  persist(
    (set, get) => ({
  // 搜索状态
  query: '',
  isSearching: false,
  searchId: null,
  progress: 0,

  // 搜索结果
  results: [],
  totalMatches: 0,

  // 搜索模式
  searchMode: 'overview', // overview | detailed | frequency | timeline

  // 搜索选项
  options: {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  },

  // 选中的书籍（null 表示搜索全部）
  selectedBookId: null,

  // 搜索历史
  history: [],

  // 保存的搜索
  savedSearches: [],

  // 搜索建议
  suggestions: [],

  // 错误信息
  error: null,

  /**
   * 设置搜索模式
   */
  setSearchMode: (mode) => {
    set({ searchMode: mode })
    // 如果有当前查询，自动重新搜索
    const { query } = get()
    if (query.trim()) {
      get().search(query)
    }
  },

  /**
   * 设置搜索词
   */
  setQuery: (query) => {
    set({ query })
  },

  /**
   * 设置搜索选项
   */
  setOptions: (options) => {
    set((state) => ({
      options: { ...state.options, ...options },
    }))
  },

  /**
   * 设置选中的书籍
   */
  setSelectedBook: (bookId) => {
    set({ selectedBookId: bookId })
  },

  /**
   * 执行搜索
   */
  search: async (query) => {
    const searchQuery = query || get().query
    if (!searchQuery.trim()) {
      set({ results: [], totalMatches: 0, error: null })
      return
    }

    const { options, selectedBookId, searchId: prevSearchId, searchMode } = get()

    // 取消之前的搜索
    if (prevSearchId) {
      get().cancelSearch()
    }

    const newSearchId = generateSearchId()
    set({
      query: searchQuery,
      searchId: newSearchId,
      isSearching: true,
      progress: 0,
      results: [],
      totalMatches: 0,
      error: null,
    })

    try {
      // 获取书籍数据
      let books
      if (selectedBookId) {
        const book = await booksStore.getById(selectedBookId)
        books = book ? [book] : []
      } else {
        // 获取所有书籍（带内容）
        const allBooks = await booksStore.getAll()
        books = await Promise.all(
          allBooks.map((b) => booksStore.getById(b.id))
        )
        books = books.filter(Boolean)
      }

      if (books.length === 0) {
        set({
          isSearching: false,
          error: '没有可搜索的书籍',
        })
        return
      }

      // 准备 Worker 数据
      const booksData = books.map((book) => ({
        id: book.id,
        title: book.title,
        content: book.content,
        chapters: book.chapters,
      }))

      // 启动 Worker 搜索
      const worker = getSearchWorker()

      // 设置消息处理
      const handleMessage = (e) => {
        const data = e.data

        // 忽略其他搜索的消息
        if (data.searchId !== newSearchId) return

        switch (data.type) {
          case 'started':
            set({ progress: 0 })
            break

          case 'progress':
            // 单本书的进度
            break

          case 'partial':
            // 收到部分结果
            set((state) => ({
              results: [...state.results, data.result],
              totalMatches: state.totalMatches + data.result.totalMatches,
            }))
            break

          case 'bookComplete':
            // 更新整体进度
            set({ progress: data.overallProgress })
            break

          case 'complete':
            // 搜索完成
            set({
              isSearching: false,
              progress: 100,
            })

            // 添加到搜索历史
            if (data.totalMatches > 0) {
              get().addToHistory(searchQuery)
            }

            // 移除监听器
            worker.removeEventListener('message', handleMessage)
            break

          case 'cancelled':
            set({ isSearching: false })
            worker.removeEventListener('message', handleMessage)
            break
        }
      }

      worker.addEventListener('message', handleMessage)

      // 发送搜索请求
      worker.postMessage({
        type: 'search',
        searchId: newSearchId,
        books: booksData,
        query: searchQuery,
        options,
        searchMode,
      })
    } catch (error) {
      set({
        isSearching: false,
        error: error.message,
      })
    }
  },

  /**
   * 取消搜索
   */
  cancelSearch: () => {
    const { searchId } = get()
    if (searchId) {
      const worker = getSearchWorker()
      worker.postMessage({
        type: 'cancel',
        searchId,
      })
      set({ isSearching: false, searchId: null })
    }
  },

  /**
   * 清除结果
   */
  clearResults: () => {
    set({
      query: '',
      results: [],
      totalMatches: 0,
      error: null,
      progress: 0,
    })
  },

  /**
   * 添加到搜索历史
   */
  addToHistory: (query) => {
    set((state) => {
      const history = state.history.filter((h) => h !== query)
      return {
        history: [query, ...history].slice(0, 10), // 保留最近10条
      }
    })
  },

  /**
   * 清除搜索历史
   */
  clearHistory: () => {
    set({ history: [] })
  },

  /**
   * 保存搜索
   */
  saveSearch: (query, name = '') => {
    set((state) => {
      const exists = state.savedSearches.some((s) => s.query === query)
      if (exists) return state

      return {
        savedSearches: [
          ...state.savedSearches,
          {
            id: Date.now(),
            query,
            name: name || query,
            options: { ...state.options },
            searchMode: state.searchMode,
            createdAt: new Date().toISOString(),
          },
        ].slice(0, 20), // 最多保存20条
      }
    })
  },

  /**
   * 删除保存的搜索
   */
  removeSavedSearch: (id) => {
    set((state) => ({
      savedSearches: state.savedSearches.filter((s) => s.id !== id),
    }))
  },

  /**
   * 应用保存的搜索
   */
  applySavedSearch: (savedSearch) => {
    set({
      query: savedSearch.query,
      options: savedSearch.options || {},
      searchMode: savedSearch.searchMode || 'overview',
    })
    // 执行搜索
    setTimeout(() => {
      get().search(savedSearch.query)
    }, 0)
  },

  /**
   * 生成搜索建议（基于历史和已保存）
   */
  getSuggestions: (input) => {
    if (!input || input.length < 1) {
      set({ suggestions: [] })
      return
    }

    const { history, savedSearches } = get()
    const inputLower = input.toLowerCase()

    // 从历史和保存的搜索中匹配
    const fromHistory = history
      .filter((h) => h.toLowerCase().includes(inputLower))
      .map((h) => ({ type: 'history', text: h }))

    const fromSaved = savedSearches
      .filter((s) => s.query.toLowerCase().includes(inputLower))
      .map((s) => ({ type: 'saved', text: s.query, name: s.name }))

    // 去重并限制数量
    const seen = new Set()
    const suggestions = [...fromSaved, ...fromHistory]
      .filter((s) => {
        if (seen.has(s.text)) return false
        seen.add(s.text)
        return true
      })
      .slice(0, 8)

    set({ suggestions })
  },

  /**
   * 导出搜索结果
   */
  exportResults: () => {
    const { query, results, searchMode, options } = get()
    if (results.length === 0) return null

    const exportData = {
      query,
      searchMode,
      options,
      exportedAt: new Date().toISOString(),
      totalMatches: results.reduce((sum, r) => sum + r.totalMatches, 0),
      results: results.map((r) => ({
        bookTitle: r.bookTitle,
        totalMatches: r.totalMatches,
        chapters: r.chapters.map((ch) => ({
          title: ch.chapterTitle,
          count: ch.count,
          matches: ch.matches?.map((m) => ({
            line: m.lineNumber,
            context: m.context,
          })),
        })),
      })),
    }

    // 下载JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-${query.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    return exportData
  },
    }),
    {
      name: 'novel-reader-search',
      // 只持久化历史和保存的搜索
      partialize: (state) => ({
        history: state.history,
        savedSearches: state.savedSearches,
        searchMode: state.searchMode,
        options: state.options,
      }),
    }
  )
)
