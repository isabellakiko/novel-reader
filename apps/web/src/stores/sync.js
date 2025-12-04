/**
 * 数据同步 Store
 *
 * 管理本地数据与云端的同步
 * 支持离线优先策略
 */

import { create } from 'zustand'
import { bookApi, progressApi, bookmarkApi } from '../services/api'
import { db, booksStore, progressStore, bookmarksStore } from './db'
import useAuthStore from './auth'

const useSyncStore = create((set, get) => ({
  // 同步状态
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,

  // 云端书籍列表（缓存）
  cloudBooks: [],

  /**
   * 同步所有数据
   */
  syncAll: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) return

    set({ isSyncing: true, syncError: null })

    try {
      // 并行同步书籍、进度和书签
      await Promise.all([
        get().syncBooks(),
        get().syncProgress(),
        get().syncBookmarks(),
      ])

      set({
        isSyncing: false,
        lastSyncAt: new Date(),
      })
    } catch (error) {
      console.error('[Sync] 同步失败:', error)
      set({
        isSyncing: false,
        syncError: error.message || '同步失败',
      })
    }
  },

  /**
   * 同步书籍列表
   */
  syncBooks: async () => {
    try {
      const response = await bookApi.getList(0, 100)
      const cloudBooks = response.data?.content || []
      set({ cloudBooks })
      return cloudBooks
    } catch (error) {
      console.error('[Sync] 同步书籍失败:', error)
      throw error
    }
  },

  /**
   * 上传书籍到云端
   */
  uploadBook: async (file, onProgress) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw new Error('请先登录')
    }

    try {
      const response = await bookApi.upload(file, onProgress)
      // 刷新云端书籍列表
      await get().syncBooks()
      return response.data
    } catch (error) {
      console.error('[Sync] 上传书籍失败:', error)
      throw error
    }
  },

  /**
   * 从云端获取书籍详情
   */
  getCloudBook: async (bookId) => {
    try {
      const response = await bookApi.getDetail(bookId)
      return response.data
    } catch (error) {
      console.error('[Sync] 获取书籍详情失败:', error)
      throw error
    }
  },

  /**
   * 从云端获取章节内容
   */
  getCloudChapter: async (bookId, chapterIndex) => {
    try {
      const response = await bookApi.getChapter(bookId, chapterIndex)
      return response.data
    } catch (error) {
      console.error('[Sync] 获取章节失败:', error)
      throw error
    }
  },

  /**
   * 删除云端书籍
   */
  deleteCloudBook: async (bookId) => {
    try {
      await bookApi.delete(bookId)
      // 刷新云端书籍列表
      await get().syncBooks()
    } catch (error) {
      console.error('[Sync] 删除书籍失败:', error)
      throw error
    }
  },

  /**
   * 同步阅读进度
   */
  syncProgress: async () => {
    try {
      // 获取云端所有进度
      const response = await progressApi.getAll()
      const cloudProgress = response.data || []

      // 获取本地所有进度
      const localProgress = await progressStore.getAll()

      // 合并策略：取最新的
      for (const cloud of cloudProgress) {
        const local = localProgress[cloud.bookId]
        if (!local || new Date(cloud.lastReadAt) > new Date(local.updatedAt)) {
          // 云端更新，同步到本地
          await progressStore.save(cloud.bookId, {
            chapterIndex: cloud.chapterIndex,
            scrollPosition: cloud.scrollPosition,
            progressPercent: cloud.progressPercent,
          })
        }
      }

      // 上传本地更新的进度到云端
      for (const [bookId, local] of Object.entries(localProgress)) {
        const cloud = cloudProgress.find((p) => p.bookId === parseInt(bookId))
        if (!cloud || new Date(local.updatedAt) > new Date(cloud.lastReadAt)) {
          try {
            await progressApi.update({
              bookId: parseInt(bookId),
              chapterIndex: local.chapterIndex,
              scrollPosition: local.scrollPosition,
              progressPercent: local.progressPercent,
            })
          } catch (e) {
            // 书籍可能不存在于云端，忽略
            console.warn('[Sync] 上传进度失败:', bookId, e.message)
          }
        }
      }
    } catch (error) {
      console.error('[Sync] 同步进度失败:', error)
      throw error
    }
  },

  /**
   * 更新阅读进度（同时保存本地和云端）
   */
  updateProgress: async (bookId, progress, isCloudBook = false) => {
    // 保存到本地
    await progressStore.save(bookId, progress)

    // 如果已登录且是云端书籍，同步到云端
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated && isCloudBook) {
      try {
        await progressApi.update({
          bookId,
          chapterIndex: progress.chapterIndex,
          scrollPosition: progress.scrollPosition,
          progressPercent: progress.progressPercent,
        })
      } catch (error) {
        console.warn('[Sync] 同步进度失败，稍后重试:', error.message)
      }
    }
  },

  /**
   * 同步书签
   */
  syncBookmarks: async () => {
    try {
      // 获取云端所有书签（分页获取全部）
      const response = await bookmarkApi.getAll(0, 1000)
      const cloudBookmarks = response.data?.content || []

      // 这里简化处理：云端书签作为只读同步
      // 完整实现需要更复杂的合并逻辑
      return cloudBookmarks
    } catch (error) {
      console.error('[Sync] 同步书签失败:', error)
      throw error
    }
  },

  /**
   * 创建云端书签
   */
  createCloudBookmark: async (bookmarkData) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw new Error('请先登录')
    }

    try {
      const response = await bookmarkApi.create(bookmarkData)
      return response.data
    } catch (error) {
      console.error('[Sync] 创建书签失败:', error)
      throw error
    }
  },

  /**
   * 删除云端书签
   */
  deleteCloudBookmark: async (bookmarkId) => {
    try {
      await bookmarkApi.delete(bookmarkId)
    } catch (error) {
      console.error('[Sync] 删除书签失败:', error)
      throw error
    }
  },

  /**
   * 搜索云端书籍
   */
  searchCloudBooks: async (keyword) => {
    try {
      const response = await bookApi.search(keyword, 0, 50)
      return response.data?.content || []
    } catch (error) {
      console.error('[Sync] 搜索失败:', error)
      throw error
    }
  },

  /**
   * 获取最近阅读
   */
  getRecentReading: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) return []

    try {
      const response = await progressApi.getRecent(10)
      return response.data || []
    } catch (error) {
      console.error('[Sync] 获取最近阅读失败:', error)
      return []
    }
  },

  /**
   * 清除同步错误
   */
  clearSyncError: () => set({ syncError: null }),
}))

export default useSyncStore
