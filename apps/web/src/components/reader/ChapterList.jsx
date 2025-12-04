/**
 * 章节列表组件（虚拟滚动版）
 *
 * 使用 react-window 实现虚拟滚动，支持 7000+ 章节流畅渲染
 */

import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { X, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { FixedSizeList } from 'react-window'
import { cn } from '../../lib/utils'

const ITEM_HEIGHT = 40 // 每个章节项的高度

export default function ChapterList({
  chapters,
  currentIndex,
  onSelect,
  onClose,
  searchQuery,
  onSearchChange,
}) {
  const listRef = useRef(null)
  const containerRef = useRef(null)

  // 过滤章节（带原始索引）
  const filteredChapters = useMemo(() => {
    if (!searchQuery) {
      return chapters.map((chapter, index) => ({ ...chapter, originalIndex: index }))
    }
    const query = searchQuery.toLowerCase()
    return chapters
      .map((chapter, index) => ({ ...chapter, originalIndex: index }))
      .filter((chapter) => chapter.title.toLowerCase().includes(query))
  }, [chapters, searchQuery])

  // 找到当前章节在过滤后列表中的位置
  const currentFilteredIndex = useMemo(() => {
    return filteredChapters.findIndex((ch) => ch.originalIndex === currentIndex)
  }, [filteredChapters, currentIndex])

  // 滚动到当前章节
  const scrollToCurrentChapter = useCallback(() => {
    if (listRef.current && currentFilteredIndex >= 0) {
      listRef.current.scrollToItem(currentFilteredIndex, 'center')
    }
  }, [currentFilteredIndex])

  // 组件挂载时滚动到当前章节
  useEffect(() => {
    // 延迟一下确保列表已渲染
    const timer = setTimeout(scrollToCurrentChapter, 100)
    return () => clearTimeout(timer)
  }, [scrollToCurrentChapter])

  // 快速跳转按钮
  const jumpToStart = () => {
    listRef.current?.scrollToItem(0, 'start')
  }

  const jumpToEnd = () => {
    listRef.current?.scrollToItem(filteredChapters.length - 1, 'end')
  }

  // 渲染单个章节项
  const ChapterItem = useCallback(
    ({ index, style }) => {
      const chapter = filteredChapters[index]
      const isCurrent = chapter.originalIndex === currentIndex

      return (
        <div style={style} className="px-2">
          <button
            onClick={() => onSelect(chapter.originalIndex)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              'hover:bg-accent',
              isCurrent
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground'
            )}
          >
            <span className="line-clamp-1">{chapter.title}</span>
          </button>
        </div>
      )
    },
    [filteredChapters, currentIndex, onSelect]
  )

  // 计算列表高度
  const [listHeight, setListHeight] = useState(400)

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setListHeight(containerRef.current.clientHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  return (
    <>
      {/* 移动端遮罩层 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* 章节列表面板 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          'h-full bg-card border-r border-border flex flex-col z-50',
          // 移动端全屏，桌面端固定宽度
          'fixed md:relative inset-y-0 left-0 w-[85vw] max-w-sm md:w-72'
        )}
      >
        {/* 头部 */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">目录</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索章节..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={cn(
                'w-full pl-9 pr-4 py-2 text-sm rounded-lg',
                'bg-muted border border-transparent',
                'focus:bg-background focus:border-primary focus:outline-none'
              )}
            />
          </div>

          {/* 章节统计和快捷操作 */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              共 {chapters.length} 章
              {searchQuery && ` · 找到 ${filteredChapters.length} 章`}
            </p>
            <div className="flex gap-1">
              <button
                onClick={jumpToStart}
                className="p-1 rounded hover:bg-accent text-muted-foreground"
                title="跳到开头"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToCurrentChapter}
                className="px-2 py-0.5 text-xs rounded hover:bg-accent text-muted-foreground"
                title="回到当前"
              >
                当前
              </button>
              <button
                onClick={jumpToEnd}
                className="p-1 rounded hover:bg-accent text-muted-foreground"
                title="跳到结尾"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 虚拟滚动章节列表 */}
        <div className="flex-1 overflow-hidden" ref={containerRef}>
          {filteredChapters.length > 0 ? (
            <FixedSizeList
              ref={listRef}
              height={listHeight}
              itemCount={filteredChapters.length}
              itemSize={ITEM_HEIGHT}
              width="100%"
              className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              {ChapterItem}
            </FixedSizeList>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">
              没有找到匹配的章节
            </p>
          )}
        </div>

        {/* 当前章节指示器 */}
        {currentFilteredIndex >= 0 && (
          <div className="flex-shrink-0 px-4 py-2 border-t border-border bg-muted/50">
            <p className="text-xs text-muted-foreground truncate">
              当前: {chapters[currentIndex]?.title}
            </p>
          </div>
        )}
      </motion.div>
    </>
  )
}
