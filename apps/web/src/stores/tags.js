/**
 * 标签和分类状态管理
 *
 * 功能：
 * - 自定义标签创建和管理
 * - 书籍标签关联
 * - 收藏功能
 * - 标签筛选
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 预设标签颜色
 */
export const TAG_COLORS = [
  { id: 'red', name: '红色', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { id: 'orange', name: '橙色', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { id: 'yellow', name: '黄色', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { id: 'green', name: '绿色', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { id: 'blue', name: '蓝色', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { id: 'purple', name: '紫色', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { id: 'pink', name: '粉色', class: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { id: 'gray', name: '灰色', class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
]

/**
 * 预设分类
 */
export const DEFAULT_CATEGORIES = [
  { id: 'reading', name: '在读', icon: 'BookOpen', color: 'blue' },
  { id: 'finished', name: '已读完', icon: 'CheckCircle', color: 'green' },
  { id: 'paused', name: '暂停', icon: 'PauseCircle', color: 'yellow' },
  { id: 'wishlist', name: '想读', icon: 'Heart', color: 'pink' },
]

/**
 * 生成唯一 ID
 */
function generateId() {
  return `tag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * 标签 Store
 */
export const useTagStore = create(
  persist(
    (set, get) => ({
      // 所有标签 { [id]: Tag }
      tags: {},

      // 书籍-标签关联 { [bookId]: Set<tagId> }
      bookTags: {},

      // 收藏的书籍 Set<bookId>
      favorites: [],

      // 书籍分类 { [bookId]: categoryId }
      bookCategories: {},

      // ===== 标签管理 =====

      /**
       * 创建标签
       */
      createTag: (name, color = 'gray') => {
        const id = generateId()
        const tag = {
          id,
          name: name.trim(),
          color,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          tags: { ...state.tags, [id]: tag },
        }))

        return tag
      },

      /**
       * 更新标签
       */
      updateTag: (id, updates) => {
        set((state) => {
          if (!state.tags[id]) return state
          return {
            tags: {
              ...state.tags,
              [id]: { ...state.tags[id], ...updates },
            },
          }
        })
      },

      /**
       * 删除标签
       */
      deleteTag: (id) => {
        set((state) => {
          const { [id]: _, ...restTags } = state.tags

          // 同时从所有书籍中移除该标签
          const newBookTags = { ...state.bookTags }
          Object.keys(newBookTags).forEach((bookId) => {
            newBookTags[bookId] = newBookTags[bookId].filter((tagId) => tagId !== id)
          })

          return { tags: restTags, bookTags: newBookTags }
        })
      },

      /**
       * 获取所有标签列表
       */
      getAllTags: () => {
        return Object.values(get().tags).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      },

      // ===== 书籍-标签关联 =====

      /**
       * 为书籍添加标签
       */
      addTagToBook: (bookId, tagId) => {
        set((state) => {
          const bookTagList = state.bookTags[bookId] || []
          if (bookTagList.includes(tagId)) return state

          return {
            bookTags: {
              ...state.bookTags,
              [bookId]: [...bookTagList, tagId],
            },
          }
        })
      },

      /**
       * 从书籍移除标签
       */
      removeTagFromBook: (bookId, tagId) => {
        set((state) => {
          const bookTagList = state.bookTags[bookId] || []
          return {
            bookTags: {
              ...state.bookTags,
              [bookId]: bookTagList.filter((id) => id !== tagId),
            },
          }
        })
      },

      /**
       * 设置书籍的所有标签
       */
      setBookTags: (bookId, tagIds) => {
        set((state) => ({
          bookTags: {
            ...state.bookTags,
            [bookId]: tagIds,
          },
        }))
      },

      /**
       * 获取书籍的标签
       */
      getBookTags: (bookId) => {
        const { tags, bookTags } = get()
        const tagIds = bookTags[bookId] || []
        return tagIds.map((id) => tags[id]).filter(Boolean)
      },

      /**
       * 获取拥有指定标签的书籍ID列表
       */
      getBooksByTag: (tagId) => {
        const { bookTags } = get()
        return Object.entries(bookTags)
          .filter(([_, tags]) => tags.includes(tagId))
          .map(([bookId]) => bookId)
      },

      // ===== 收藏功能 =====

      /**
       * 切换收藏状态
       */
      toggleFavorite: (bookId) => {
        set((state) => {
          const favorites = [...state.favorites]
          const index = favorites.indexOf(bookId)
          if (index === -1) {
            favorites.push(bookId)
          } else {
            favorites.splice(index, 1)
          }
          return { favorites }
        })
      },

      /**
       * 检查是否已收藏
       */
      isFavorite: (bookId) => {
        return get().favorites.includes(bookId)
      },

      /**
       * 获取所有收藏的书籍ID
       */
      getFavorites: () => {
        return get().favorites
      },

      // ===== 分类功能 =====

      /**
       * 设置书籍分类
       */
      setBookCategory: (bookId, categoryId) => {
        set((state) => ({
          bookCategories: {
            ...state.bookCategories,
            [bookId]: categoryId,
          },
        }))
      },

      /**
       * 获取书籍分类
       */
      getBookCategory: (bookId) => {
        return get().bookCategories[bookId] || null
      },

      /**
       * 获取某分类下的书籍ID列表
       */
      getBooksByCategory: (categoryId) => {
        const { bookCategories } = get()
        return Object.entries(bookCategories)
          .filter(([_, cat]) => cat === categoryId)
          .map(([bookId]) => bookId)
      },

      // ===== 筛选和排序 =====

      /**
       * 根据条件筛选书籍
       */
      filterBooks: (books, filters) => {
        const { tags, bookTags, favorites, bookCategories } = get()
        let result = [...books]

        // 按收藏筛选
        if (filters.favoritesOnly) {
          result = result.filter((book) => favorites.includes(book.id))
        }

        // 按分类筛选
        if (filters.category) {
          result = result.filter((book) => bookCategories[book.id] === filters.category)
        }

        // 按标签筛选（任一匹配）
        if (filters.tagIds && filters.tagIds.length > 0) {
          result = result.filter((book) => {
            const bookTagList = bookTags[book.id] || []
            return filters.tagIds.some((tagId) => bookTagList.includes(tagId))
          })
        }

        // 按搜索词筛选
        if (filters.search) {
          const search = filters.search.toLowerCase()
          result = result.filter(
            (book) =>
              book.title?.toLowerCase().includes(search) ||
              book.author?.toLowerCase().includes(search)
          )
        }

        return result
      },

      // ===== 统计 =====

      /**
       * 获取标签使用统计
       */
      getTagStats: () => {
        const { tags, bookTags } = get()
        const stats = {}

        Object.keys(tags).forEach((tagId) => {
          stats[tagId] = 0
        })

        Object.values(bookTags).forEach((tagList) => {
          tagList.forEach((tagId) => {
            if (stats[tagId] !== undefined) {
              stats[tagId]++
            }
          })
        })

        return stats
      },

      /**
       * 清理无效的关联（书籍已删除）
       */
      cleanupOrphanedData: (existingBookIds) => {
        const bookIdSet = new Set(existingBookIds)

        set((state) => {
          const newBookTags = {}
          const newBookCategories = {}
          const newFavorites = []

          Object.entries(state.bookTags).forEach(([bookId, tags]) => {
            if (bookIdSet.has(bookId)) {
              newBookTags[bookId] = tags
            }
          })

          Object.entries(state.bookCategories).forEach(([bookId, cat]) => {
            if (bookIdSet.has(bookId)) {
              newBookCategories[bookId] = cat
            }
          })

          state.favorites.forEach((bookId) => {
            if (bookIdSet.has(bookId)) {
              newFavorites.push(bookId)
            }
          })

          return {
            bookTags: newBookTags,
            bookCategories: newBookCategories,
            favorites: newFavorites,
          }
        })
      },
    }),
    {
      name: 'novel-reader-tags',
    }
  )
)

export default useTagStore
