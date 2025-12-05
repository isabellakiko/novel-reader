/**
 * 阅读进度组件
 *
 * 显示：
 * - 当前章节进度百分比
 * - 全书进度百分比
 * - 预计剩余阅读时间
 * - 已读/总字数
 */

import { useState, useEffect, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, BookOpen, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'

// 平均阅读速度（中文字/分钟）
const READING_SPEED = 500

/**
 * 格式化时间
 */
function formatTime(minutes) {
  if (minutes < 1) return '不到 1 分钟'
  if (minutes < 60) return `${Math.round(minutes)} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (mins === 0) return `${hours} 小时`
  return `${hours} 小时 ${mins} 分钟`
}

/**
 * 格式化字数
 */
function formatChars(chars) {
  if (chars < 1000) return `${chars}`
  if (chars < 10000) return `${(chars / 1000).toFixed(1)}K`
  return `${(chars / 10000).toFixed(1)}万`
}

/**
 * 进度条组件
 */
const ProgressBar = memo(function ProgressBar({
  progress,
  className,
  height = 'h-1',
  showLabel = false,
  color = 'bg-primary'
}) {
  return (
    <div className={cn('relative', className)}>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', height)}>
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-5 text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
})

/**
 * 底部进度条（始终显示）
 */
export const BottomProgressBar = memo(function BottomProgressBar({
  chapterProgress,
  bookProgress,
  onClick,
}) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 cursor-pointer group"
      onClick={onClick}
    >
      {/* 章节进度 */}
      <div className="h-1 bg-muted/50">
        <motion.div
          className="h-full bg-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${chapterProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      {/* 全书进度（更细的线） */}
      <div className="h-0.5 bg-muted/30">
        <motion.div
          className="h-full bg-primary/40"
          initial={{ width: 0 }}
          animate={{ width: `${bookProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      {/* 悬停提示 */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronUp className="w-4 h-4 text-muted-foreground animate-bounce" />
      </div>
    </div>
  )
})

/**
 * 详细进度面板
 */
export const ProgressPanel = memo(function ProgressPanel({
  isOpen,
  onClose,
  chapterProgress,
  bookProgress,
  currentChapter,
  totalChapters,
  chapterChars,
  readChars,
  totalChars,
  remainingChars,
}) {
  // 计算剩余时间
  const remainingTime = useMemo(() => {
    return remainingChars / READING_SPEED
  }, [remainingChars])

  // 本章剩余时间
  const chapterRemainingTime = useMemo(() => {
    const remaining = chapterChars * (1 - chapterProgress / 100)
    return remaining / READING_SPEED
  }, [chapterChars, chapterProgress])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* 面板 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl"
          >
            {/* 拖动指示器 */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* 章节进度 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">本章进度</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(chapterProgress)}%
                  </span>
                </div>
                <ProgressBar progress={chapterProgress} height="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{formatChars(Math.round(chapterChars * chapterProgress / 100))} 字</span>
                  <span>剩余 {formatTime(chapterRemainingTime)}</span>
                </div>
              </div>

              {/* 全书进度 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">全书进度</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(bookProgress)}%
                  </span>
                </div>
                <ProgressBar
                  progress={bookProgress}
                  height="h-2"
                  color="bg-green-500"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>第 {currentChapter} / {totalChapters} 章</span>
                  <span>{formatChars(readChars)} / {formatChars(totalChars)} 字</span>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">预计剩余</span>
                  </div>
                  <p className="text-lg font-semibold">{formatTime(remainingTime)}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs">剩余字数</span>
                  </div>
                  <p className="text-lg font-semibold">{formatChars(remainingChars)}</p>
                </div>
              </div>

              {/* 阅读速度说明 */}
              <p className="text-xs text-center text-muted-foreground">
                按平均 {READING_SPEED} 字/分钟计算
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

/**
 * 顶部迷你进度指示器
 */
export const MiniProgress = memo(function MiniProgress({
  bookProgress,
  remainingTime,
  className,
}) {
  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${bookProgress}%` }}
        />
      </div>
      <span>{Math.round(bookProgress)}%</span>
      {remainingTime > 0 && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <Clock className="w-3 h-3" />
          <span>{formatTime(remainingTime)}</span>
        </>
      )}
    </div>
  )
})

/**
 * 阅读进度 Hook
 */
export function useReadingProgress(book, currentChapterIndex, scrollProgress = 0) {
  const stats = useMemo(() => {
    if (!book || !book.chapters?.length) {
      return {
        chapterProgress: 0,
        bookProgress: 0,
        currentChapter: 0,
        totalChapters: 0,
        chapterChars: 0,
        readChars: 0,
        totalChars: 0,
        remainingChars: 0,
      }
    }

    const totalChapters = book.chapters.length
    const currentChapter = currentChapterIndex + 1

    // 计算各章节字数
    const chapterSizes = book.chapters.map((ch, i) => {
      const start = ch.start
      const end = ch.end
      return end - start + 1
    })

    const totalChars = chapterSizes.reduce((a, b) => a + b, 0)
    const currentChapterChars = chapterSizes[currentChapterIndex] || 0

    // 已读字数 = 之前章节 + 当前章节已读部分
    const prevChaptersChars = chapterSizes.slice(0, currentChapterIndex).reduce((a, b) => a + b, 0)
    const currentReadChars = Math.round(currentChapterChars * (scrollProgress / 100))
    const readChars = prevChaptersChars + currentReadChars
    const remainingChars = totalChars - readChars

    // 章节进度
    const chapterProgress = scrollProgress

    // 全书进度
    const bookProgress = totalChars > 0 ? (readChars / totalChars) * 100 : 0

    return {
      chapterProgress,
      bookProgress,
      currentChapter,
      totalChapters,
      chapterChars: currentChapterChars,
      readChars,
      totalChars,
      remainingChars,
    }
  }, [book, currentChapterIndex, scrollProgress])

  return stats
}

export default {
  BottomProgressBar,
  ProgressPanel,
  MiniProgress,
  useReadingProgress,
}
