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
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReaderStore } from '../stores/reader'
import { useBookmarkStore } from '../stores/bookmark'
import { useStatsStore } from '../stores/stats'
import ChapterList from '../components/reader/ChapterList'
import ReaderSettings from '../components/reader/ReaderSettings'
import { HighlightQuery } from '../components/search/HighlightedText'
import { cn } from '../lib/utils'

// 字体映射
const FONT_FAMILY_MAP = {
  serif: 'ui-serif, Georgia, serif',
  sans: 'ui-sans-serif, system-ui, sans-serif',
  kai: '"楷体", "KaiTi", "STKaiti", serif',
  fangsong: '"仿宋", "FangSong", "STFangsong", serif',
}

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
    scrollPosition,
    settings,
    loadBook,
    goToChapter,
    prevChapter,
    nextChapter,
    updateSettings,
    saveScrollPosition,
    clearBook,
  } = useReaderStore()

  const {
    bookmarks,
    loadBookmarks,
    addBookmark,
    getChapterBookmarks,
  } = useBookmarkStore()

  const { startSession, endSession, addCharacters } = useStatsStore()

  // UI 状态
  const [showChapterList, setShowChapterList] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')
  const [bookmarkToast, setBookmarkToast] = useState(null)

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
      loadBookmarks(bookId)
    }
    return () => clearBook()
  }, [bookId, loadBook, loadBookmarks, clearBook])

  // 阅读统计：开始/结束会话
  useEffect(() => {
    if (book?.id) {
      startSession(book.id)
    }
    return () => {
      endSession()
    }
  }, [book?.id, startSession, endSession])

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

  // 阅读统计：追踪阅读字数（章节切换时计算）
  useEffect(() => {
    if (currentChapter?.lines) {
      const chars = currentChapter.lines.reduce((sum, line) => sum + line.length, 0)
      addCharacters(chars)
    }
  }, [currentChapterIndex]) // 仅在章节切换时触发

  // 当前章节是否有书签
  const chapterBookmarks = useMemo(() => {
    return getChapterBookmarks(currentChapterIndex)
  }, [getChapterBookmarks, currentChapterIndex, bookmarks])

  // 添加书签
  const handleAddBookmark = useCallback(async () => {
    if (!book || !currentChapter) return

    const chapter = book.chapters[currentChapterIndex]
    const excerpt = currentChapter.lines.slice(0, 2).join(' ').slice(0, 100) + '...'

    const result = await addBookmark({
      bookId: book.id,
      bookTitle: book.title,
      chapterIndex: currentChapterIndex,
      chapterTitle: currentChapter.title,
      position: chapter.start,
      excerpt,
    })

    if (result.success) {
      setBookmarkToast({ type: 'success', message: '书签已添加' })
    } else {
      setBookmarkToast({ type: 'info', message: result.message })
    }

    // 3秒后隐藏提示
    setTimeout(() => setBookmarkToast(null), 3000)
  }, [book, currentChapter, currentChapterIndex, addBookmark])

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

  // 用于追踪是否是初次加载（需要恢复滚动位置）
  const isInitialLoadRef = useRef(true)
  const scrollSaveTimerRef = useRef(null)

  // 章节切换后滚动到顶部或恢复位置
  useEffect(() => {
    // 如果有高亮关键词，让下面的 effect 处理滚动到高亮位置
    if (highlightQuery) return

    if (contentRef.current) {
      // 初次加载时恢复之前的滚动位置
      if (isInitialLoadRef.current && scrollPosition > 0) {
        const scrollHeight = contentRef.current.scrollHeight
        const clientHeight = contentRef.current.clientHeight
        const maxScroll = scrollHeight - clientHeight
        const targetScroll = (scrollPosition / 100) * maxScroll

        // 延迟执行确保内容已渲染
        setTimeout(() => {
          contentRef.current?.scrollTo({
            top: targetScroll,
            behavior: 'instant',
          })
        }, 100)

        isInitialLoadRef.current = false
      } else {
        // 非初次加载（切换章节），滚动到顶部
        contentRef.current.scrollTo({
          top: 0,
          behavior: 'instant',
        })
      }
    }
  }, [currentChapterIndex, highlightQuery, scrollPosition])

  // 滚动时保存进度（防抖）
  useEffect(() => {
    const container = contentRef.current
    if (!container || !book) return

    const handleScroll = () => {
      // 清除之前的定时器
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current)
      }

      // 1秒后保存（防抖）
      scrollSaveTimerRef.current = setTimeout(() => {
        const scrollTop = container.scrollTop
        const scrollHeight = container.scrollHeight
        const clientHeight = container.clientHeight
        const maxScroll = scrollHeight - clientHeight

        if (maxScroll > 0) {
          const percent = Math.round((scrollTop / maxScroll) * 100)
          saveScrollPosition(percent)
        }
      }, 1000)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current)
      }
    }
  }, [book, saveScrollPosition])

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
              onClick={handleAddBookmark}
              className={cn(
                'p-2 rounded-lg transition-colors',
                chapterBookmarks.length > 0
                  ? 'text-primary bg-primary/10'
                  : 'hover:bg-accent'
              )}
              title={chapterBookmarks.length > 0 ? '本章已有书签' : '添加书签'}
            >
              {chapterBookmarks.length > 0 ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
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

        {/* 书签提示 */}
        <AnimatePresence>
          {bookmarkToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'absolute top-14 right-4 px-4 py-2 rounded-lg shadow-lg z-20',
                bookmarkToast.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
              )}
            >
              {bookmarkToast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 阅读内容区 */}
        <main
          className="flex-1 overflow-auto transition-colors duration-200"
          ref={contentRef}
          style={{
            backgroundColor: settings.backgroundColor || undefined,
            color: settings.textColor || undefined,
          }}
        >
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
              className="reading-content"
              style={{
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
                fontFamily: FONT_FAMILY_MAP[settings.fontFamily] || FONT_FAMILY_MAP.serif,
              }}
            >
              {currentChapter?.lines.map((line, index) => (
                <p
                  key={index}
                  className="indent-8"
                  style={{
                    marginBottom: `${settings.paragraphSpacing || 1.5}em`,
                    textAlign: settings.textAlign || 'left',
                  }}
                >
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
