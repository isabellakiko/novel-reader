/**
 * 搜索结果组件
 *
 * 根据搜索模式显示不同样式的结果：
 * - overview: 章节概览，每章显示一条
 * - detailed: 详细搜索，显示所有匹配
 * - frequency: 频率统计，显示匹配次数
 * - timeline: 时间线，按顺序平铺展示
 */

import { useState, memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  ExternalLink,
  BarChart2,
  TrendingUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Collapsible from '@radix-ui/react-collapsible'
import HighlightedText from './HighlightedText'
import { cn } from '../../lib/utils'

/**
 * 单个匹配项
 */
const MatchItem = memo(function MatchItem({ match, bookId, chapterIndex, onNavigate, compact }) {
  return (
    <button
      onClick={() => onNavigate(bookId, chapterIndex, match.position)}
      className={cn(
        'w-full text-left rounded-lg',
        'bg-muted/50 hover:bg-accent transition-colors',
        'group flex items-start gap-3',
        compact ? 'px-3 py-2' : 'px-4 py-3'
      )}
    >
      <span className="text-xs text-muted-foreground mt-1 w-12 flex-shrink-0">
        L{match.lineNumber}
      </span>
      <span className={cn('flex-1 leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
        <HighlightedText
          text={match.context}
          matchOffset={match.matchOffset}
          matchLength={match.matchLength}
        />
      </span>
      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
    </button>
  )
})

/**
 * 章节结果组（用于 detailed 模式）
 */
const ChapterGroup = memo(function ChapterGroup({
  chapter,
  bookId,
  defaultOpen,
  onNavigate,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
          'hover:bg-accent transition-colors text-sm'
        )}
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left font-medium truncate">
          {chapter.chapterTitle}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {chapter.count || chapter.matches.length} 处
        </span>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="pl-6 pr-2 py-2 space-y-2"
        >
          {chapter.matches.map((match, index) => (
            <MatchItem
              key={index}
              match={match}
              bookId={bookId}
              chapterIndex={chapter.chapterIndex}
              onNavigate={onNavigate}
            />
          ))}
        </motion.div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
})

/**
 * 章节概览项（用于 overview 模式）
 */
const OverviewItem = memo(function OverviewItem({
  chapter,
  bookId,
  bookTitle,
  onNavigate,
  showBookTitle,
}) {
  const match = chapter.matches[0]
  if (!match) return null

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onNavigate(bookId, chapter.chapterIndex, match.position)}
      className={cn(
        'w-full text-left p-4 rounded-xl',
        'bg-card border border-border',
        'hover:border-primary/50 hover:shadow-md transition-all',
        'group'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {showBookTitle && (
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium truncate">
                {bookTitle}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate">
              {chapter.chapterTitle}
            </span>
            {chapter.count > 1 && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                +{chapter.count - 1}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            <HighlightedText
              text={match.context}
              matchOffset={match.matchOffset}
              matchLength={match.matchLength}
            />
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </motion.button>
  )
})

/**
 * 频率统计项（用于 frequency 模式）
 */
const FrequencyItem = memo(function FrequencyItem({
  chapter,
  bookId,
  bookTitle,
  maxCount,
  onNavigate,
  showBookTitle,
}) {
  const percentage = (chapter.count / maxCount) * 100

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onNavigate(bookId, chapter.chapterIndex, 0)}
      className={cn(
        'w-full text-left p-3 rounded-lg',
        'bg-card border border-border',
        'hover:border-primary/50 transition-all',
        'group'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {showBookTitle && (
            <span className="text-xs text-primary font-medium mr-2">
              [{bookTitle}]
            </span>
          )}
          <span className="text-sm font-medium truncate">
            {chapter.chapterTitle}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <span className="text-sm font-semibold text-primary w-12 text-right">
            {chapter.count}
          </span>
        </div>
      </div>
    </motion.button>
  )
})

/**
 * 时间线项（用于 timeline 模式）
 */
const TimelineItem = memo(function TimelineItem({
  match,
  chapter,
  bookId,
  bookTitle,
  onNavigate,
  isFirst,
  isLast,
  showBookTitle,
}) {
  return (
    <div className="flex gap-3">
      {/* 时间线连接线 */}
      <div className="flex flex-col items-center">
        <div className={cn('w-0.5 flex-1', isFirst ? 'bg-transparent' : 'bg-border')} />
        <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
        <div className={cn('w-0.5 flex-1', isLast ? 'bg-transparent' : 'bg-border')} />
      </div>

      {/* 内容 */}
      <motion.button
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onNavigate(bookId, chapter.chapterIndex, match.position)}
        className={cn(
          'flex-1 text-left p-3 rounded-lg mb-2',
          'bg-card border border-border',
          'hover:border-primary/50 transition-all',
          'group'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          {showBookTitle && (
            <>
              <BookOpen className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">
                {bookTitle}
              </span>
              <span className="text-muted-foreground">·</span>
            </>
          )}
          <FileText className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">
            {chapter.chapterTitle}
          </span>
          <span className="text-xs text-muted-foreground">
            L{match.lineNumber}
          </span>
        </div>
        <p className="text-sm">
          <HighlightedText
            text={match.context}
            matchOffset={match.matchOffset}
            matchLength={match.matchLength}
          />
        </p>
      </motion.button>
    </div>
  )
})

/**
 * 书籍结果组（用于 detailed 模式）
 */
const BookGroup = memo(function BookGroup({ result, defaultOpen, onNavigate }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl overflow-hidden bg-card"
    >
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3',
            'hover:bg-accent/50 transition-colors'
          )}
        >
          {open ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="flex-1 text-left font-semibold truncate">
            {result.bookTitle}
          </span>
          <span className="text-sm text-muted-foreground">
            {result.totalMatches} 处匹配
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {result.chapters.length} 章
          </span>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div className="border-t border-border px-2 py-2 space-y-1">
            {result.chapters.map((chapter) => (
              <ChapterGroup
                key={chapter.chapterIndex}
                chapter={chapter}
                bookId={result.bookId}
                defaultOpen={result.chapters.length <= 3}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </motion.div>
  )
})

/**
 * 概览模式渲染
 */
function OverviewResults({ results, onNavigate }) {
  const showBookTitle = results.length > 1

  return (
    <div className="space-y-3">
      {results.map((result) =>
        result.chapters.map((chapter) => (
          <OverviewItem
            key={`${result.bookId}-${chapter.chapterIndex}`}
            chapter={chapter}
            bookId={result.bookId}
            bookTitle={result.bookTitle}
            onNavigate={onNavigate}
            showBookTitle={showBookTitle}
          />
        ))
      )}
    </div>
  )
}

/**
 * 详细模式渲染
 */
function DetailedResults({ results, onNavigate }) {
  return (
    <div className="space-y-4">
      {results.map((result) => (
        <BookGroup
          key={result.bookId}
          result={result}
          defaultOpen={results.length === 1}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

/**
 * 频率统计模式渲染
 */
function FrequencyResults({ results, onNavigate }) {
  // 收集所有章节并按出现次数排序
  const allChapters = useMemo(() => {
    const chapters = []
    results.forEach((result) => {
      result.chapters.forEach((chapter) => {
        chapters.push({
          ...chapter,
          bookId: result.bookId,
          bookTitle: result.bookTitle,
        })
      })
    })
    // 已经在 worker 中按 count 排序，但这里合并多本书需要重新排序
    return chapters.sort((a, b) => b.count - a.count)
  }, [results])

  const maxCount = allChapters[0]?.count || 1
  const showBookTitle = results.length > 1

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BarChart2 className="w-4 h-4" />
        <span>按出现频率排序</span>
        <span className="text-primary font-medium ml-auto">
          最高 {maxCount} 次
        </span>
      </div>

      {/* 频率列表 */}
      <div className="space-y-2">
        {allChapters.slice(0, 50).map((chapter, index) => (
          <FrequencyItem
            key={`${chapter.bookId}-${chapter.chapterIndex}`}
            chapter={chapter}
            bookId={chapter.bookId}
            bookTitle={chapter.bookTitle}
            maxCount={maxCount}
            onNavigate={onNavigate}
            showBookTitle={showBookTitle}
          />
        ))}
      </div>

      {allChapters.length > 50 && (
        <p className="text-center text-sm text-muted-foreground">
          仅显示前 50 个章节，共 {allChapters.length} 个章节有匹配
        </p>
      )}
    </div>
  )
}

/**
 * 时间线模式渲染
 */
function TimelineResults({ results, onNavigate }) {
  // 收集所有匹配并按位置排序
  const allMatches = useMemo(() => {
    const matches = []
    results.forEach((result) => {
      result.chapters.forEach((chapter) => {
        chapter.matches.forEach((match) => {
          matches.push({
            match,
            chapter,
            bookId: result.bookId,
            bookTitle: result.bookTitle,
          })
        })
      })
    })
    return matches
  }, [results])

  const showBookTitle = results.length > 1

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span>按章节顺序展示</span>
        <span className="text-primary font-medium ml-auto">
          共 {allMatches.length} 处
        </span>
      </div>

      {/* 时间线 */}
      <div className="pl-2">
        {allMatches.slice(0, 100).map((item, index) => (
          <TimelineItem
            key={`${item.bookId}-${item.chapter.chapterIndex}-${index}`}
            match={item.match}
            chapter={item.chapter}
            bookId={item.bookId}
            bookTitle={item.bookTitle}
            onNavigate={onNavigate}
            isFirst={index === 0}
            isLast={index === Math.min(allMatches.length, 100) - 1}
            showBookTitle={showBookTitle}
          />
        ))}
      </div>

      {allMatches.length > 100 && (
        <p className="text-center text-sm text-muted-foreground">
          仅显示前 100 条，共 {allMatches.length} 处匹配
        </p>
      )}
    </div>
  )
}

/**
 * 搜索结果主组件
 */
export default function SearchResults({ results, query, searchMode, onNavigate }) {
  const navigate = useNavigate()

  const handleNavigate = (bookId, chapterIndex, position) => {
    // 导航到阅读器页面
    navigate(`/reader/${bookId}?chapter=${chapterIndex}&position=${position}&highlight=${encodeURIComponent(query)}`)
    onNavigate?.()
  }

  if (results.length === 0) {
    return null
  }

  // 根据搜索模式渲染不同的结果视图
  switch (searchMode) {
    case 'overview':
      return <OverviewResults results={results} onNavigate={handleNavigate} />
    case 'frequency':
      return <FrequencyResults results={results} onNavigate={handleNavigate} />
    case 'timeline':
      return <TimelineResults results={results} onNavigate={handleNavigate} />
    case 'detailed':
    default:
      return <DetailedResults results={results} onNavigate={handleNavigate} />
  }
}
