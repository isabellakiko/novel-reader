/**
 * 书签状态管理
 */

import { create } from 'zustand'
import { bookmarksStore } from './db'

/**
 * 书签 Store
 */
export const useBookmarkStore = create((set, get) => ({
  // 当前书籍的书签列表
  bookmarks: [],
  // 所有书签（用于书签页面）
  allBookmarks: [],
  // 加载状态
  isLoading: false,

  /**
   * 加载书籍的书签
   * @param {string} bookId
   */
  loadBookmarks: async (bookId) => {
    set({ isLoading: true })
    try {
      const bookmarks = await bookmarksStore.getByBookId(bookId)
      set({ bookmarks, isLoading: false })
    } catch (error) {
      console.error('加载书签失败:', error)
      set({ bookmarks: [], isLoading: false })
    }
  },

  /**
   * 加载所有书签
   */
  loadAllBookmarks: async () => {
    set({ isLoading: true })
    try {
      const allBookmarks = await bookmarksStore.getAll()
      set({ allBookmarks, isLoading: false })
    } catch (error) {
      console.error('加载所有书签失败:', error)
      set({ allBookmarks: [], isLoading: false })
    }
  },

  /**
   * 添加书签
   * @param {Object} bookmark
   */
  addBookmark: async (bookmark) => {
    try {
      // 检查是否已存在
      const existing = await bookmarksStore.exists(
        bookmark.bookId,
        bookmark.chapterIndex,
        bookmark.position
      )
      if (existing) {
        return { success: false, message: '该位置已有书签' }
      }

      const id = await bookmarksStore.add(bookmark)
      const newBookmark = { ...bookmark, id, createdAt: new Date() }

      set((state) => ({
        bookmarks: [newBookmark, ...state.bookmarks],
      }))

      return { success: true, bookmark: newBookmark }
    } catch (error) {
      console.error('添加书签失败:', error)
      return { success: false, message: error.message }
    }
  },

  /**
   * 删除书签
   * @param {number} id
   */
  deleteBookmark: async (id) => {
    try {
      await bookmarksStore.delete(id)
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
        allBookmarks: state.allBookmarks.filter((b) => b.id !== id),
      }))
      return { success: true }
    } catch (error) {
      console.error('删除书签失败:', error)
      return { success: false, message: error.message }
    }
  },

  /**
   * 更新书签备注
   * @param {number} id
   * @param {string} note
   */
  updateNote: async (id, note) => {
    try {
      await bookmarksStore.updateNote(id, note)
      set((state) => ({
        bookmarks: state.bookmarks.map((b) =>
          b.id === id ? { ...b, note } : b
        ),
        allBookmarks: state.allBookmarks.map((b) =>
          b.id === id ? { ...b, note } : b
        ),
      }))
      return { success: true }
    } catch (error) {
      console.error('更新备注失败:', error)
      return { success: false, message: error.message }
    }
  },

  /**
   * 检查当前位置是否有书签
   * @param {number} chapterIndex
   * @param {number} position
   */
  hasBookmarkAt: (chapterIndex, position) => {
    const { bookmarks } = get()
    return bookmarks.some(
      (b) => b.chapterIndex === chapterIndex && b.position === position
    )
  },

  /**
   * 获取当前章节的书签
   * @param {number} chapterIndex
   */
  getChapterBookmarks: (chapterIndex) => {
    const { bookmarks } = get()
    return bookmarks.filter((b) => b.chapterIndex === chapterIndex)
  },

  /**
   * 清空书籍书签
   * @param {string} bookId
   */
  clearBookmarks: async (bookId) => {
    try {
      await bookmarksStore.deleteByBookId(bookId)
      set((state) => ({
        bookmarks: [],
        allBookmarks: state.allBookmarks.filter((b) => b.bookId !== bookId),
      }))
      return { success: true }
    } catch (error) {
      console.error('清空书签失败:', error)
      return { success: false, message: error.message }
    }
  },
}))
