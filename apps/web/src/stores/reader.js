/**
 * 阅读器状态管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { booksStore, progressStore } from './db'

/**
 * 阅读器 Store
 */
export const useReaderStore = create(
  persist(
    (set, get) => ({
      // 当前书籍
      book: null,
      isLoading: false,
      error: null,

      // 当前章节
      currentChapterIndex: 0,

      // 阅读设置
      settings: {
        fontSize: 18,
        lineHeight: 1.8,
        fontFamily: 'serif', // 'serif' | 'sans'
        maxWidth: 800,
      },

      /**
       * 加载书籍
       */
      loadBook: async (bookId) => {
        if (!bookId) {
          set({ book: null, error: null })
          return
        }

        set({ isLoading: true, error: null })

        try {
          const book = await booksStore.getById(bookId)
          if (!book) {
            set({ error: '书籍不存在', isLoading: false })
            return
          }

          // 获取阅读进度
          const progress = await progressStore.get(bookId)
          const chapterIndex = progress?.chapterIndex || 0

          set({
            book,
            currentChapterIndex: chapterIndex,
            isLoading: false,
          })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      /**
       * 跳转到章节
       */
      goToChapter: async (index) => {
        const { book } = get()
        if (!book) return

        const maxIndex = book.chapters.length - 1
        const newIndex = Math.max(0, Math.min(index, maxIndex))

        set({ currentChapterIndex: newIndex })

        // 保存进度
        await progressStore.save(book.id, {
          chapterIndex: newIndex,
          scrollPosition: 0,
        })
      },

      /**
       * 上一章
       */
      prevChapter: () => {
        const { currentChapterIndex, goToChapter } = get()
        if (currentChapterIndex > 0) {
          goToChapter(currentChapterIndex - 1)
        }
      },

      /**
       * 下一章
       */
      nextChapter: () => {
        const { book, currentChapterIndex, goToChapter } = get()
        if (book && currentChapterIndex < book.chapters.length - 1) {
          goToChapter(currentChapterIndex + 1)
        }
      },

      /**
       * 更新阅读设置
       */
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }))
      },

      /**
       * 获取当前章节内容
       */
      getCurrentChapter: () => {
        const { book, currentChapterIndex } = get()
        if (!book || !book.chapters.length) return null

        const chapter = book.chapters[currentChapterIndex]
        if (!chapter) return null

        // 提取章节内容
        const content = book.content.slice(chapter.start, chapter.end + 1)
        return {
          ...chapter,
          content,
        }
      },

      /**
       * 清除当前书籍
       */
      clearBook: () => {
        set({ book: null, currentChapterIndex: 0, error: null })
      },
    }),
    {
      name: 'novel-reader-settings',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
)
