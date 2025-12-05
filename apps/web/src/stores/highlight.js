/**
 * 高亮和笔记状态管理
 *
 * 功能：
 * - 文本高亮（多种颜色）
 * - 段落笔记
 * - 持久化存储
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 高亮颜色定义
 */
export const HIGHLIGHT_COLORS = {
  yellow: {
    id: 'yellow',
    name: '黄色',
    bg: 'bg-yellow-200 dark:bg-yellow-500/40',
    bgHex: '#fef08a',
    bgHexDark: 'rgba(234, 179, 8, 0.4)',
  },
  green: {
    id: 'green',
    name: '绿色',
    bg: 'bg-green-200 dark:bg-green-500/40',
    bgHex: '#bbf7d0',
    bgHexDark: 'rgba(34, 197, 94, 0.4)',
  },
  blue: {
    id: 'blue',
    name: '蓝色',
    bg: 'bg-blue-200 dark:bg-blue-500/40',
    bgHex: '#bfdbfe',
    bgHexDark: 'rgba(59, 130, 246, 0.4)',
  },
  pink: {
    id: 'pink',
    name: '粉色',
    bg: 'bg-pink-200 dark:bg-pink-500/40',
    bgHex: '#fbcfe8',
    bgHexDark: 'rgba(236, 72, 153, 0.4)',
  },
  purple: {
    id: 'purple',
    name: '紫色',
    bg: 'bg-purple-200 dark:bg-purple-500/40',
    bgHex: '#e9d5ff',
    bgHexDark: 'rgba(168, 85, 247, 0.4)',
  },
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return `hl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 高亮和笔记 Store
 */
export const useHighlightStore = create(
  persist(
    (set, get) => ({
      // 按书籍 ID 存储高亮
      // { [bookId]: { [highlightId]: Highlight } }
      highlights: {},

      // 当前选中的高亮（用于编辑）
      selectedHighlight: null,

      // 最近使用的颜色
      lastColor: 'yellow',

      /**
       * 添加高亮
       */
      addHighlight: ({
        bookId,
        chapterIndex,
        startOffset,
        endOffset,
        text,
        color = null,
        note = '',
      }) => {
        const id = generateId()
        const useColor = color || get().lastColor

        const highlight = {
          id,
          bookId,
          chapterIndex,
          startOffset,
          endOffset,
          text,
          color: useColor,
          note,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          highlights: {
            ...state.highlights,
            [bookId]: {
              ...state.highlights[bookId],
              [id]: highlight,
            },
          },
          lastColor: useColor,
        }))

        return highlight
      },

      /**
       * 更新高亮
       */
      updateHighlight: (bookId, highlightId, updates) => {
        set((state) => {
          const bookHighlights = state.highlights[bookId]
          if (!bookHighlights || !bookHighlights[highlightId]) return state

          return {
            highlights: {
              ...state.highlights,
              [bookId]: {
                ...bookHighlights,
                [highlightId]: {
                  ...bookHighlights[highlightId],
                  ...updates,
                  updatedAt: new Date().toISOString(),
                },
              },
            },
          }
        })
      },

      /**
       * 删除高亮
       */
      deleteHighlight: (bookId, highlightId) => {
        set((state) => {
          const bookHighlights = { ...state.highlights[bookId] }
          delete bookHighlights[highlightId]

          return {
            highlights: {
              ...state.highlights,
              [bookId]: bookHighlights,
            },
            selectedHighlight:
              state.selectedHighlight?.id === highlightId
                ? null
                : state.selectedHighlight,
          }
        })
      },

      /**
       * 获取书籍的所有高亮
       */
      getBookHighlights: (bookId) => {
        const bookHighlights = get().highlights[bookId]
        if (!bookHighlights) return []
        return Object.values(bookHighlights).sort(
          (a, b) => a.chapterIndex - b.chapterIndex || a.startOffset - b.startOffset
        )
      },

      /**
       * 获取章节的高亮
       */
      getChapterHighlights: (bookId, chapterIndex) => {
        const bookHighlights = get().highlights[bookId]
        if (!bookHighlights) return []
        return Object.values(bookHighlights)
          .filter((h) => h.chapterIndex === chapterIndex)
          .sort((a, b) => a.startOffset - b.startOffset)
      },

      /**
       * 获取有笔记的高亮
       */
      getNotesHighlights: (bookId) => {
        const bookHighlights = get().highlights[bookId]
        if (!bookHighlights) return []
        return Object.values(bookHighlights)
          .filter((h) => h.note && h.note.trim())
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      },

      /**
       * 设置选中的高亮
       */
      setSelectedHighlight: (highlight) => {
        set({ selectedHighlight: highlight })
      },

      /**
       * 设置最近使用的颜色
       */
      setLastColor: (color) => {
        set({ lastColor: color })
      },

      /**
       * 检查位置是否在高亮范围内
       */
      getHighlightAt: (bookId, chapterIndex, offset) => {
        const chapterHighlights = get().getChapterHighlights(bookId, chapterIndex)
        return chapterHighlights.find(
          (h) => offset >= h.startOffset && offset <= h.endOffset
        )
      },

      /**
       * 清除书籍的所有高亮
       */
      clearBookHighlights: (bookId) => {
        set((state) => {
          const { [bookId]: _, ...rest } = state.highlights
          return { highlights: rest }
        })
      },

      /**
       * 导出高亮和笔记
       */
      exportHighlights: (bookId, bookTitle) => {
        const highlights = get().getBookHighlights(bookId)
        if (highlights.length === 0) return null

        const exportData = {
          bookId,
          bookTitle,
          exportedAt: new Date().toISOString(),
          highlights: highlights.map((h) => ({
            chapter: h.chapterIndex + 1,
            text: h.text,
            color: HIGHLIGHT_COLORS[h.color]?.name || h.color,
            note: h.note || '',
            createdAt: h.createdAt,
          })),
        }

        // 生成 Markdown 格式
        let markdown = `# ${bookTitle} - 阅读笔记\n\n`
        markdown += `导出时间: ${new Date().toLocaleString()}\n\n`
        markdown += `共 ${highlights.length} 条高亮/笔记\n\n---\n\n`

        let currentChapter = -1
        for (const h of highlights) {
          if (h.chapterIndex !== currentChapter) {
            currentChapter = h.chapterIndex
            markdown += `## 第 ${currentChapter + 1} 章\n\n`
          }

          const colorName = HIGHLIGHT_COLORS[h.color]?.name || h.color
          markdown += `> ${h.text}\n`
          markdown += `> \n`
          markdown += `> *[${colorName}]*\n`

          if (h.note) {
            markdown += `\n**笔记:** ${h.note}\n`
          }

          markdown += '\n---\n\n'
        }

        // 下载文件
        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${bookTitle}-笔记-${Date.now()}.md`
        a.click()
        URL.revokeObjectURL(url)

        return exportData
      },

      /**
       * 统计信息
       */
      getStats: (bookId) => {
        const highlights = get().getBookHighlights(bookId)
        const withNotes = highlights.filter((h) => h.note?.trim())

        return {
          total: highlights.length,
          withNotes: withNotes.length,
          byColor: Object.keys(HIGHLIGHT_COLORS).reduce((acc, color) => {
            acc[color] = highlights.filter((h) => h.color === color).length
            return acc
          }, {}),
        }
      },
    }),
    {
      name: 'novel-reader-highlights',
    }
  )
)

export default useHighlightStore
