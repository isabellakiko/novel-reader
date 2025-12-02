/**
 * 书架状态管理
 */

import { create } from 'zustand'
import { booksStore } from './db'

/**
 * 书架 Store
 */
export const useLibraryStore = create((set, get) => ({
  // 书籍列表
  books: [],

  // 加载状态
  isLoading: false,

  // 导入状态
  isImporting: false,
  importProgress: null, // { stage, percent, message }

  // 错误信息
  error: null,

  /**
   * 加载所有书籍
   */
  loadBooks: async () => {
    console.log('[Store] 开始加载书籍列表...')
    set({ isLoading: true, error: null })
    try {
      const books = await booksStore.getAll()
      console.log('[Store] 加载完成，书籍数量:', books.length, books.map(b => b.title))
      set({ books, isLoading: false })
    } catch (error) {
      console.error('[Store] 加载失败:', error)
      set({ error: error.message, isLoading: false })
    }
  },

  /**
   * 添加书籍
   * @param {Object} book
   */
  addBook: async (book) => {
    try {
      await booksStore.add(book)
      // 重新加载列表
      await get().loadBooks()
      return { success: true }
    } catch (error) {
      console.error('添加书籍失败:', error)
      set({ error: error.message })
      // 重新抛出错误让调用方处理
      throw error
    }
  },

  /**
   * 删除书籍
   * @param {string} id
   */
  deleteBook: async (id) => {
    try {
      await booksStore.delete(id)
      set((state) => ({
        books: state.books.filter((b) => b.id !== id),
      }))
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 设置导入进度
   */
  setImportProgress: (progress) => {
    set({ importProgress: progress, isImporting: !!progress })
  },

  /**
   * 清除错误
   */
  clearError: () => set({ error: null }),
}))
