/**
 * 书架页面
 *
 * 显示用户导入的所有书籍，支持搜索和排序
 */

import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, BookOpen, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/library'
import { progressStore } from '../stores/db'
import FileUpload from '../components/FileUpload'
import BookCard from '../components/BookCard'
import { cn } from '../lib/utils'

// 动态导入解析模块（避免打包体积问题）
const parseBook = async (file, onProgress) => {
  const { parseTxtFile } = await import('@novel-reader/core')
  return parseTxtFile(file, { onProgress })
}

export default function Library() {
  const { books, isLoading, loadBooks, addBook, deleteBook, isImporting, setImportProgress } =
    useLibraryStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [readingProgress, setReadingProgress] = useState({})

  // 加载书籍列表和阅读进度
  useEffect(() => {
    loadBooks()
    progressStore.getAll().then(setReadingProgress)
  }, [loadBooks])

  // 过滤书籍
  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      book.title.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query)
    )
  })

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (file) => {
      console.log('[Library] 开始处理文件:', file.name, '大小:', file.size)
      try {
        setImportProgress({ stage: 'reading', percent: 0, message: '准备解析...' })

        console.log('[Library] 开始解析...')
        const book = await parseBook(file, (stage, percent) => {
          console.log('[Library] 解析进度:', stage, percent)
          const messages = {
            reading: '读取文件...',
            detecting_encoding: '检测编码...',
            decoding: '解码内容...',
            extracting_info: '提取信息...',
            detecting_chapters: '识别章节...',
          }
          setImportProgress({
            stage,
            percent,
            message: messages[stage] || '处理中...',
          })
        })

        console.log('[Library] 解析完成，书籍:', book.title, '章节数:', book.chapters?.length)
        console.log('[Library] 开始保存到数据库...')

        await addBook(book)

        console.log('[Library] 保存成功!')
        setImportProgress(null)
        setShowUpload(false)
      } catch (error) {
        console.error('[Library] 处理失败:', error)
        setImportProgress(null)
        alert('文件解析失败: ' + error.message)
      }
    },
    [addBook, setImportProgress]
  )

  // 处理删除
  const handleDelete = useCallback(
    async (id) => {
      if (confirm('确定要删除这本书吗？')) {
        await deleteBook(id)
      }
    },
    [deleteBook]
  )

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            我的书架
          </h1>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索书籍..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-48 pl-9 pr-4 py-2 text-sm rounded-lg',
                  'bg-muted border border-transparent',
                  'focus:bg-background focus:border-primary focus:outline-none',
                  'transition-all'
                )}
              />
            </div>

            {/* 导入按钮 */}
            <motion.button
              onClick={() => setShowUpload(!showUpload)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              导入书籍
            </motion.button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 上传区域 */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <FileUpload
                onFileSelect={handleFileSelect}
                isLoading={isImporting}
                className="max-w-xl mx-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && books.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">书架空空如也</h3>
            <p className="text-muted-foreground mb-6">
              点击上方"导入书籍"按钮，开始你的阅读之旅
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              导入第一本书
            </button>
          </motion.div>
        )}

        {/* 搜索无结果 */}
        {!isLoading && books.length > 0 && filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              没有找到匹配"{searchQuery}"的书籍
            </p>
          </div>
        )}

        {/* 书籍网格 */}
        {!isLoading && filteredBooks.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={handleDelete}
                  progress={readingProgress[book.id]}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* 导入进度浮层 */}
      <AnimatePresence>
        {isImporting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-lg px-6 py-4 flex items-center gap-4"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="font-medium">正在导入书籍</p>
              <p className="text-sm text-muted-foreground">
                {useLibraryStore.getState().importProgress?.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
