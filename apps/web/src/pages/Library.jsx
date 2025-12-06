/**
 * 书架页面
 *
 * 显示用户导入的所有书籍，支持搜索和排序
 * 支持本地书籍和云端书籍
 */

import { useEffect, useState, useCallback } from 'react'
import { Plus, BookOpen, Cloud, HardDrive, RefreshCw, Search, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/library'
import { progressStore } from '../stores/db'
import useAuthStore from '../stores/auth'
import useSyncStore from '../stores/sync'
import { useTagStore } from '../stores/tags'
import useToastStore from '../stores/toast'
import FileUpload from '../components/FileUpload'
import BookCard from '../components/BookCard'
import { FilterBar } from '../components/library/TagComponents'
import EmptyState, { NoSearchResults } from '../components/ui/EmptyState'
import { BookListSkeleton } from '../components/ui/Skeleton'
import { listContainerVariants, listItemVariants } from '../lib/animations'
import { cn } from '../lib/utils'

// 动态导入解析模块（避免打包体积问题）
const parseBook = async (file, onProgress) => {
  const { parseTxtFile } = await import('@novel-reader/core')
  return parseTxtFile(file, { onProgress })
}

export default function Library() {
  const { books, isLoading, loadBooks, addBook, deleteBook, isImporting, setImportProgress } =
    useLibraryStore()
  const { isAuthenticated } = useAuthStore()
  const { cloudBooks, syncBooks, isSyncing, uploadBook } = useSyncStore()

  const [showUpload, setShowUpload] = useState(false)
  const [readingProgress, setReadingProgress] = useState({})
  const [viewMode, setViewMode] = useState('all') // 'all' | 'local' | 'cloud'
  const [uploadMode, setUploadMode] = useState('local') // 'local' | 'cloud'

  // 筛选状态
  const [filters, setFilters] = useState({
    search: '',
    favoritesOnly: false,
    category: null,
    tagIds: [],
  })

  const { filterBooks: applyTagFilters, cleanupOrphanedData } = useTagStore()
  const toast = useToastStore()

  // 加载书籍列表和阅读进度
  useEffect(() => {
    loadBooks()
    progressStore.getAll().then(setReadingProgress)
  }, [loadBooks])

  // 登录后同步云端书籍
  useEffect(() => {
    if (isAuthenticated) {
      syncBooks()
    }
  }, [isAuthenticated, syncBooks])

  // 合并本地和云端书籍
  const allBooks = [
    ...books.map((b) => ({ ...b, source: 'local' })),
    ...cloudBooks.map((b) => ({ ...b, source: 'cloud' })),
  ]

  // 清理无效的标签关联
  useEffect(() => {
    if (allBooks.length > 0) {
      cleanupOrphanedData(allBooks.map((b) => b.id))
    }
  }, [allBooks.length])

  // 过滤书籍
  const filteredBooks = (() => {
    // 先按来源筛选
    let result = allBooks.filter((book) => {
      if (viewMode === 'local' && book.source !== 'local') return false
      if (viewMode === 'cloud' && book.source !== 'cloud') return false
      return true
    })

    // 再应用标签和分类筛选
    result = applyTagFilters(result, filters)

    return result
  })()

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (file) => {
      console.log('[Library] 开始处理文件:', file.name, '大小:', file.size)

      // 云端上传
      if (uploadMode === 'cloud' && isAuthenticated) {
        try {
          setImportProgress({ stage: 'uploading', percent: 0, message: '上传中...' })
          await uploadBook(file, (percent) => {
            setImportProgress({ stage: 'uploading', percent, message: `上传中 ${percent}%` })
          })
          setImportProgress(null)
          setShowUpload(false)
        } catch (error) {
          console.error('[Library] 上传失败:', error)
          setImportProgress(null)
          toast.error('上传失败: ' + (error?.message || '请检查网络连接'))
        }
        return
      }

      // 本地导入
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
        toast.error('文件解析失败: ' + (error?.message || '未知错误'))
      }
    },
    [addBook, setImportProgress, uploadMode, isAuthenticated, uploadBook]
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
      <header className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-border">
        {/* 标题行 */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            我的书架
          </h1>

          <div className="flex items-center gap-2">
            {/* 同步按钮 */}
            {isAuthenticated && (
              <motion.button
                onClick={syncBooks}
                disabled={isSyncing}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
                title="同步云端"
              >
                <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
              </motion.button>
            )}

            {/* 导入按钮 */}
            <motion.button
              onClick={() => setShowUpload(!showUpload)}
              className={cn(
                'flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">导入书籍</span>
              <span className="sm:hidden">导入</span>
            </motion.button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索书籍..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className={cn(
                'w-full md:w-64 pl-9 pr-4 py-2 text-sm rounded-lg',
                'bg-muted border border-transparent',
                'focus:bg-background focus:border-primary focus:outline-none',
                'transition-all'
              )}
            />
          </div>

          {/* 来源筛选（仅登录用户显示） */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  viewMode === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                全部
              </button>
              <button
                onClick={() => setViewMode('local')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1',
                  viewMode === 'local'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <HardDrive className="w-3 h-3" />
                本地
              </button>
              <button
                onClick={() => setViewMode('cloud')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1',
                  viewMode === 'cloud'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Cloud className="w-3 h-3" />
                云端
              </button>
            </div>
          )}
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
              <div className="max-w-xl mx-auto">
                {/* 上传模式切换（仅登录用户显示） */}
                {isAuthenticated && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                      onClick={() => setUploadMode('local')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                        uploadMode === 'local'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <HardDrive className="w-4 h-4" />
                      本地导入
                    </button>
                    <button
                      onClick={() => setUploadMode('cloud')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                        uploadMode === 'cloud'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Cloud className="w-4 h-4" />
                      上传云端
                    </button>
                  </div>
                )}
                <FileUpload
                  onFileSelect={handleFileSelect}
                  isLoading={isImporting}
                />
                {uploadMode === 'cloud' && isAuthenticated && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    上传到云端后，可在任何设备访问
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 筛选栏 */}
        {!isLoading && allBooks.length > 0 && (
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            bookCount={filteredBooks.length}
            totalCount={allBooks.length}
          />
        )}

        {/* 加载状态 - 骨架屏 */}
        {isLoading && <BookListSkeleton count={12} />}

        {/* 空状态 */}
        {!isLoading && allBooks.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="书架空空如也"
            description="点击上方「导入书籍」按钮，开始你的阅读之旅"
            action={
              <button
                onClick={() => setShowUpload(true)}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                导入第一本书
              </button>
            }
          />
        )}

        {/* 搜索无结果 */}
        {!isLoading && allBooks.length > 0 && filteredBooks.length === 0 && (
          <NoSearchResults query={filters.search} />
        )}

        {/* 书籍网格 */}
        {!isLoading && filteredBooks.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6"
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  variants={listItemVariants}
                  layout
                >
                  <BookCard
                    book={book}
                    onDelete={handleDelete}
                    progress={readingProgress[book.id]}
                  />
                </motion.div>
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
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-lg px-6 py-4 flex items-center gap-4 z-40"
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
