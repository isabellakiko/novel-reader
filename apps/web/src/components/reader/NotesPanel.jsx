/**
 * 笔记面板组件
 *
 * 显示和管理书籍的所有高亮和笔记
 */

import { useState, memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  FileText,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Highlighter,
} from 'lucide-react'
import { useHighlightStore, HIGHLIGHT_COLORS } from '../../stores/highlight'
import { cn } from '../../lib/utils'
import useToastStore from '../../stores/toast'

/**
 * 单个高亮/笔记项
 */
const HighlightItem = memo(function HighlightItem({
  highlight,
  onClick,
  onDelete,
  onNavigate,
}) {
  const colorConfig = HIGHLIGHT_COLORS[highlight.color] || HIGHLIGHT_COLORS.yellow

  return (
    <div
      className={cn(
        'p-3 rounded-lg border-l-4 transition-colors cursor-pointer',
        'hover:bg-accent/50',
        highlight.color === 'yellow' && 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
        highlight.color === 'green' && 'border-green-400 bg-green-50 dark:bg-green-900/20',
        highlight.color === 'blue' && 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
        highlight.color === 'pink' && 'border-pink-400 bg-pink-50 dark:bg-pink-900/20',
        highlight.color === 'purple' && 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
      )}
      onClick={() => onNavigate?.(highlight)}
    >
      {/* 高亮文本 */}
      <p className="text-sm line-clamp-3 mb-2">"{highlight.text}"</p>

      {/* 笔记 */}
      {highlight.note && (
        <div className="flex items-start gap-2 mt-2 p-2 bg-background/50 rounded">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">{highlight.note}</p>
        </div>
      )}

      {/* 元信息 */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          第 {highlight.chapterIndex + 1} 章
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(highlight)
          }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
})

/**
 * 章节分组
 */
const ChapterGroup = memo(function ChapterGroup({
  chapterIndex,
  highlights,
  defaultOpen,
  onNavigate,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="font-medium text-sm">第 {chapterIndex + 1} 章</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {highlights.length} 条
        </span>
      </button>

      {isOpen && (
        <div className="p-2 space-y-2">
          {highlights.map((highlight) => (
            <HighlightItem
              key={highlight.id}
              highlight={highlight}
              onNavigate={onNavigate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
})

/**
 * 筛选标签
 */
const FilterTabs = memo(function FilterTabs({ active, onChange, stats }) {
  const tabs = [
    { id: 'all', label: '全部', count: stats.total },
    { id: 'notes', label: '有笔记', count: stats.withNotes },
    ...Object.entries(HIGHLIGHT_COLORS).map(([id, config]) => ({
      id,
      label: config.name,
      count: stats.byColor[id] || 0,
      color: id,
    })),
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-3 py-1 text-xs rounded-full transition-colors',
            active === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent',
            tab.color === 'yellow' && active !== tab.id && 'bg-yellow-100 dark:bg-yellow-900/30',
            tab.color === 'green' && active !== tab.id && 'bg-green-100 dark:bg-green-900/30',
            tab.color === 'blue' && active !== tab.id && 'bg-blue-100 dark:bg-blue-900/30',
            tab.color === 'pink' && active !== tab.id && 'bg-pink-100 dark:bg-pink-900/30',
            tab.color === 'purple' && active !== tab.id && 'bg-purple-100 dark:bg-purple-900/30'
          )}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  )
})

/**
 * 笔记面板主组件
 */
export default function NotesPanel({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  onNavigateToHighlight,
}) {
  const {
    getBookHighlights,
    getNotesHighlights,
    deleteHighlight,
    exportHighlights,
    getStats,
  } = useHighlightStore()

  const toast = useToastStore()
  const [filter, setFilter] = useState('all')

  // 获取高亮数据
  const allHighlights = useMemo(() => getBookHighlights(bookId), [bookId, getBookHighlights])
  const stats = useMemo(() => getStats(bookId), [bookId, getStats])

  // 筛选高亮
  const filteredHighlights = useMemo(() => {
    if (filter === 'all') return allHighlights
    if (filter === 'notes') return allHighlights.filter((h) => h.note?.trim())
    return allHighlights.filter((h) => h.color === filter)
  }, [allHighlights, filter])

  // 按章节分组
  const groupedHighlights = useMemo(() => {
    const groups = {}
    filteredHighlights.forEach((h) => {
      if (!groups[h.chapterIndex]) {
        groups[h.chapterIndex] = []
      }
      groups[h.chapterIndex].push(h)
    })
    return groups
  }, [filteredHighlights])

  // 删除高亮
  const handleDelete = (highlight) => {
    deleteHighlight(highlight.bookId, highlight.id)
    toast.success('已删除')
  }

  // 导出
  const handleExport = () => {
    const result = exportHighlights(bookId, bookTitle)
    if (result) {
      toast.success(`已导出 ${result.highlights.length} 条笔记`)
    } else {
      toast.error('没有可导出的内容')
    }
  }

  // 导航到高亮位置
  const handleNavigate = (highlight) => {
    onNavigateToHighlight?.(highlight)
    onClose()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-full sm:w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Highlighter className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">笔记和高亮</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            title="导出笔记"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            共 {stats.total} 条高亮，{stats.withNotes} 条笔记
          </span>
        </div>
        <FilterTabs active={filter} onChange={setFilter} stats={stats} />
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto p-4">
        {filteredHighlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {filter === 'all' ? '还没有添加高亮或笔记' : '没有符合筛选条件的内容'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              选中文字即可添加高亮
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedHighlights)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([chapterIndex, highlights]) => (
                <ChapterGroup
                  key={chapterIndex}
                  chapterIndex={Number(chapterIndex)}
                  highlights={highlights}
                  defaultOpen={Object.keys(groupedHighlights).length <= 3}
                  onNavigate={handleNavigate}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
