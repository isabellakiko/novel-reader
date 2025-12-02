/**
 * 阅读器页面
 */

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
  Home,
  Loader2,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReaderStore } from '../stores/reader'
import ChapterList from '../components/reader/ChapterList'
import ReaderSettings from '../components/reader/ReaderSettings'
import { HighlightQuery } from '../components/search/HighlightedText'
import { cn } from '../lib/utils'

export default function Reader() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const contentRef = useRef(null)

  const {
    book,
    isLoading,
    error,
    currentChapterIndex,
    settings,
    loadBook,
    goToChapter,
    prevChapter,
    nextChapter,
    updateSettings,
    clearBook,
  } = useReaderStore()

  // UI 状态
  const [showChapterList, setShowChapterList] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')

  // 从 URL 获取高亮关键词和位置
  const highlightQuery = searchParams.get('highlight')
  const targetPosition = searchParams.get('position')

  // 清除高亮的函数
  const clearHighlight = useCallback(() => {
    searchParams.delete('highlight')
    searchParams.delete('position')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])

  // 加载书籍
  useEffect(() => {
    if (bookId) {
      loadBook(bookId)
    }
    return () => clearBook()
  }, [bookId, loadBook, clearBook])

  // 获取当前章节内容（需要在其他依赖它的 hooks 之前定义）
  const currentChapter = useMemo(() => {
    if (!book || !book.chapters.length) return null
    const chapter = book.chapters[currentChapterIndex]
    if (!chapter) return null

    const content = book.content.slice(chapter.start, chapter.end + 1)
    // 按行分割并过滤空行
    const lines = content.split(/\r?\n/).filter((line) => line.trim())
    return {
      ...chapter,
      lines,
    }
  }, [book, currentChapterIndex])

  // 处理 URL 中的章节跳转参数
  useEffect(() => {
    if (!book) return

    const chapterParam = searchParams.get('chapter')
    if (chapterParam !== null) {
      const chapterIndex = parseInt(chapterParam, 10)
      if (!isNaN(chapterIndex) && chapterIndex !== currentChapterIndex) {
        goToChapter(chapterIndex)
      }
      // 只清除 chapter 参数，保留 highlight 和 position 用于后续滚动
      searchParams.delete('chapter')
      setSearchParams(searchParams, { replace: true })
    }
  }, [book, searchParams, goToChapter, currentChapterIndex, setSearchParams])

  // 章节切换后滚动到顶部
  useEffect(() => {
    // 如果有高亮关键词，让下面的 effect 处理滚动到高亮位置
    if (highlightQuery) return

    // 滚动到顶部
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'instant',
      })
    }
  }, [currentChapterIndex, highlightQuery])

  // 从搜索结果跳转后，滚动到第一个高亮位置
  useEffect(() => {
    if (!highlightQuery || !currentChapter) return

    // 延迟执行，确保内容已渲染
    const timer = setTimeout(() => {
      const firstMark = contentRef.current?.querySelector('mark')
      if (firstMark) {
        firstMark.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        // 添加闪烁动画突出显示
        firstMark.classList.add('animate-pulse')
        setTimeout(() => {
          firstMark.classList.remove('animate-pulse')
        }, 2000)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [highlightQuery, currentChapter, currentChapterIndex])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevChapter()
      } else if (e.key === 'ArrowRight') {
        nextChapter()
      } else if (e.key === 'Escape') {
        setShowChapterList(false)
        setShowSettings(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevChapter, nextChapter])

  // 未选择书籍
  if (!bookId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">请先选择一本书籍</p>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            前往书架
          </button>
        </div>
      </div>
    )
  }

  // 加载中
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // 错误
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            返回书架
          </button>
        </div>
      </div>
    )
  }

  // 无书籍
  if (!book) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">书籍加载失败</p>
      </div>
    )
  }

  const canGoPrev = currentChapterIndex > 0
  const canGoNext = currentChapterIndex < book.chapters.length - 1

  return (
    <div className="h-full flex">
      {/* 章节列表侧边栏 */}
      <AnimatePresence>
        {showChapterList && (
          <ChapterList
            chapters={book.chapters}
            currentIndex={currentChapterIndex}
            onSelect={(index) => {
              goToChapter(index)
              setShowChapterList(false)
            }}
            onClose={() => setShowChapterList(false)}
            searchQuery={chapterSearch}
            onSearchChange={setChapterSearch}
          />
        )}
      </AnimatePresence>

      {/* 主阅读区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="flex-shrink-0 h-12 px-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/library')}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="返回书架"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showChapterList ? 'bg-accent' : 'hover:bg-accent'
              )}
              title="章节目录"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium line-clamp-1 max-w-xs">
              {currentChapter?.title || book.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentChapterIndex + 1} / {book.chapters.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showSettings ? 'bg-accent' : 'hover:bg-accent'
              )}
              title="阅读设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 阅读内容区 */}
        <main className="flex-1 overflow-auto" ref={contentRef}>
          {/* 搜索高亮提示条 */}
          <AnimatePresence>
            {highlightQuery && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="sticky top-0 z-10 bg-yellow-100 dark:bg-yellow-900/50 border-b border-yellow-200 dark:border-yellow-700 px-4 py-2 flex items-center justify-between"
              >
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  正在高亮显示: <strong>"{highlightQuery}"</strong>
                </span>
                <button
                  onClick={clearHighlight}
                  className="p-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                  title="清除高亮"
                >
                  <X className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="mx-auto py-8 px-6"
            style={{ maxWidth: settings.maxWidth }}
          >
            {/* 章节标题 */}
            {currentChapter && (
              <h1 className="text-2xl font-bold mb-8 text-center">
                {currentChapter.title}
              </h1>
            )}

            {/* 章节内容 */}
            <article
              className={cn(
                'reading-content',
                settings.fontFamily === 'sans' ? 'font-sans' : 'font-serif'
              )}
              style={{
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
              }}
            >
              {currentChapter?.lines.map((line, index) => (
                <p key={index} className="mb-4 text-justify indent-8">
                  {highlightQuery ? (
                    <HighlightQuery text={line} query={highlightQuery} />
                  ) : (
                    line
                  )}
                </p>
              ))}
            </article>

            {/* 章节导航 */}
            <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
              <button
                onClick={prevChapter}
                disabled={!canGoPrev}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  canGoPrev
                    ? 'hover:bg-accent'
                    : 'opacity-50 cursor-not-allowed'
                )}
              >
                <ChevronLeft className="w-5 h-5" />
                上一章
              </button>

              <button
                onClick={() => setShowChapterList(true)}
                className="px-4 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                目录
              </button>

              <button
                onClick={nextChapter}
                disabled={!canGoNext}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  canGoNext
                    ? 'hover:bg-accent'
                    : 'opacity-50 cursor-not-allowed'
                )}
              >
                下一章
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 设置侧边栏 */}
      <AnimatePresence>
        {showSettings && (
          <ReaderSettings
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
