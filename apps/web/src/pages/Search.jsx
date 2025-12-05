/**
 * 搜索页面
 *
 * 全局搜索功能：
 * - 跨书籍全文搜索
 * - 多种搜索模式
 * - 高亮匹配文本
 * - 点击跳转到阅读位置
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search as SearchIcon,
  X,
  Loader2,
  History,
  Settings2,
  BookOpen,
  AlertCircle,
  List,
  FileText,
  BarChart3,
  Clock,
  Star,
  StarOff,
  Download,
  HelpCircle,
  Bookmark,
  Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Switch from '@radix-ui/react-switch'
import { useSearchStore, SEARCH_MODES } from '../stores/search'
import { useLibraryStore } from '../stores/library'
import SearchResults from '../components/search/SearchResults'
import { cn } from '../lib/utils'
import useToastStore from '../stores/toast'

// 搜索语法提示
const SEARCH_TIPS = [
  { pattern: '"词组"', desc: '精确匹配（如 "武林盟主"）' },
  { pattern: 'A|B', desc: '匹配 A 或 B（如 张三|李四）' },
  { pattern: '张.*三', desc: '模糊匹配（如 张 和 三 之间任意字符）' },
  { pattern: '^第.*章', desc: '行首匹配章节标题' },
  { pattern: '[一二三]', desc: '匹配任一字符' },
]

// 搜索模式图标映射
const MODE_ICONS = {
  List,
  FileText,
  BarChart3,
  Clock,
}

export default function Search() {
  const {
    query,
    setQuery,
    isSearching,
    progress,
    results,
    totalMatches,
    searchMode,
    setSearchMode,
    options,
    setOptions,
    selectedBookId,
    setSelectedBook,
    history,
    savedSearches,
    suggestions,
    getSuggestions,
    error,
    search,
    cancelSearch,
    clearResults,
    saveSearch,
    removeSavedSearch,
    applySavedSearch,
    exportResults,
  } = useSearchStore()

  const toast = useToastStore()

  const { books, loadBooks } = useLibraryStore()

  const [showOptions, setShowOptions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [localQuery, setLocalQuery] = useState(query)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // 判断当前搜索是否已保存
  const isSearchSaved = savedSearches.some((s) => s.query === query)

  // 加载书籍列表
  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // 同步 query
  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  // 处理搜索（带防抖）
  const handleSearch = useCallback(() => {
    if (!localQuery.trim()) {
      clearResults()
      return
    }
    search(localQuery)
  }, [localQuery, search, clearResults])

  // 实时搜索（防抖）+ 搜索建议
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 生成搜索建议
    getSuggestions(localQuery)

    if (localQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        handleSearch()
      }, 500)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localQuery, getSuggestions])

  // 处理回车
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      if (localQuery) {
        setLocalQuery('')
        clearResults()
      } else {
        inputRef.current?.blur()
      }
    }
  }

  // 选择历史记录
  const selectHistory = (item) => {
    setLocalQuery(item)
    setShowHistory(false)
    search(item)
  }

  // 清除输入
  const clearInput = () => {
    setLocalQuery('')
    clearResults()
    inputRef.current?.focus()
  }

  // 保存/取消保存搜索
  const handleToggleSave = () => {
    if (!query.trim()) return

    if (isSearchSaved) {
      const saved = savedSearches.find((s) => s.query === query)
      if (saved) {
        removeSavedSearch(saved.id)
        toast.success('已取消收藏')
      }
    } else {
      saveSearch(query)
      toast.success('已收藏搜索')
    }
  }

  // 导出结果
  const handleExport = () => {
    const data = exportResults()
    if (data) {
      toast.success(`已导出 ${data.totalMatches} 条搜索结果`)
    } else {
      toast.error('没有可导出的结果')
    }
  }

  // 计算统计信息
  const totalChaptersWithMatches = results.reduce(
    (sum, r) => sum + (r.totalChaptersWithMatches || r.chapters?.length || 0),
    0
  )

  return (
    <div className="h-full flex flex-col">
      {/* 搜索头部 */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {/* 搜索框 */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => history.length > 0 && setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              placeholder="搜索书籍内容..."
              className={cn(
                'w-full pl-12 pr-24 py-3 text-lg rounded-xl',
                'bg-muted border-2 border-transparent',
                'focus:bg-background focus:border-primary focus:outline-none',
                'transition-all'
              )}
            />

            {/* 右侧操作按钮 */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progress}%</span>
                </div>
              )}

              {localQuery && !isSearching && (
                <button
                  onClick={clearInput}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {isSearching && (
                <button
                  onClick={cancelSearch}
                  className="px-3 py-1 text-sm bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                >
                  取消
                </button>
              )}

              <button
                onClick={() => setShowOptions(!showOptions)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  showOptions ? 'bg-accent' : 'hover:bg-accent'
                )}
                title="搜索选项"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowTips(!showTips)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  showTips ? 'bg-accent' : 'hover:bg-accent'
                )}
                title="搜索语法帮助"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* 搜索建议下拉 */}
            <AnimatePresence>
              {showHistory && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10"
                >
                  <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-1 border-b border-border">
                    <SearchIcon className="w-3 h-3" />
                    搜索建议
                  </div>
                  {suggestions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => selectHistory(item.text)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      {item.type === 'saved' ? (
                        <Star className="w-3 h-3 text-yellow-500" />
                      ) : (
                        <History className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="flex-1 truncate">{item.text}</span>
                      {item.type === 'saved' && item.name !== item.text && (
                        <span className="text-xs text-muted-foreground">
                          {item.name}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 搜索历史下拉（当没有建议时显示） */}
            <AnimatePresence>
              {showHistory && suggestions.length === 0 && history.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10"
                >
                  <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-1 border-b border-border">
                    <History className="w-3 h-3" />
                    搜索历史
                  </div>
                  {history.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => selectHistory(item)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 搜索模式选择 */}
          <div className="mt-4 flex gap-2">
            {Object.values(SEARCH_MODES).map((mode) => {
              const Icon = MODE_ICONS[mode.icon]
              const isActive = searchMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setSearchMode(mode.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                  )}
                  title={mode.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.name}</span>
                </button>
              )
            })}
          </div>

          {/* 搜索选项 */}
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 flex flex-wrap items-center gap-6">
                  {/* 书籍选择 */}
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={selectedBookId || ''}
                      onChange={(e) => setSelectedBook(e.target.value || null)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-muted border-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">全部书籍</option>
                      {books.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 区分大小写 */}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch.Root
                      checked={options.caseSensitive}
                      onCheckedChange={(checked) =>
                        setOptions({ caseSensitive: checked })
                      }
                      className={cn(
                        'w-9 h-5 rounded-full relative transition-colors',
                        options.caseSensitive ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <Switch.Thumb
                        className={cn(
                          'block w-4 h-4 bg-white rounded-full transition-transform',
                          'translate-x-0.5',
                          options.caseSensitive && 'translate-x-4'
                        )}
                      />
                    </Switch.Root>
                    区分大小写
                  </label>

                  {/* 全词匹配 */}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch.Root
                      checked={options.wholeWord}
                      onCheckedChange={(checked) =>
                        setOptions({ wholeWord: checked })
                      }
                      className={cn(
                        'w-9 h-5 rounded-full relative transition-colors',
                        options.wholeWord ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <Switch.Thumb
                        className={cn(
                          'block w-4 h-4 bg-white rounded-full transition-transform',
                          'translate-x-0.5',
                          options.wholeWord && 'translate-x-4'
                        )}
                      />
                    </Switch.Root>
                    全词匹配
                  </label>

                  {/* 正则表达式 */}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch.Root
                      checked={options.useRegex}
                      onCheckedChange={(checked) =>
                        setOptions({ useRegex: checked })
                      }
                      className={cn(
                        'w-9 h-5 rounded-full relative transition-colors',
                        options.useRegex ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <Switch.Thumb
                        className={cn(
                          'block w-4 h-4 bg-white rounded-full transition-transform',
                          'translate-x-0.5',
                          options.useRegex && 'translate-x-4'
                        )}
                      />
                    </Switch.Root>
                    正则表达式
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 搜索语法帮助 */}
          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">正则表达式语法（需开启正则选项）</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SEARCH_TIPS.map((tip, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <code className="px-2 py-0.5 bg-background rounded text-primary text-xs font-mono">
                            {tip.pattern}
                          </code>
                          <span className="text-muted-foreground text-xs">
                            {tip.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 收藏的搜索 */}
          {savedSearches.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                <span>收藏的搜索 ({savedSearches.length})</span>
              </button>

              <AnimatePresence>
                {showSaved && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 flex flex-wrap gap-2"
                  >
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        className="group flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-sm"
                      >
                        <button
                          onClick={() => applySavedSearch(saved)}
                          className="flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{saved.name}</span>
                        </button>
                        <button
                          onClick={() => removeSavedSearch(saved.id)}
                          className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* 搜索结果区 */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-destructive/10 text-destructive rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* 结果统计 */}
          {!isSearching && totalMatches > 0 && (
            <div className="mb-4 p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  找到{' '}
                  <span className="font-semibold text-foreground text-lg">
                    {totalMatches.toLocaleString()}
                  </span>{' '}
                  处匹配，分布在{' '}
                  <span className="font-semibold text-foreground text-lg">
                    {totalChaptersWithMatches.toLocaleString()}
                  </span>{' '}
                  个章节，来自{' '}
                  <span className="font-semibold text-foreground">
                    {results.length}
                  </span>{' '}
                  本书籍
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSave}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isSearchSaved
                        ? 'text-yellow-500 hover:bg-yellow-500/10'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                    title={isSearchSaved ? '取消收藏' : '收藏搜索'}
                  >
                    {isSearchSaved ? (
                      <Star className="w-4 h-4 fill-current" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    title="导出搜索结果"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground ml-2">
                    {SEARCH_MODES[searchMode]?.name}模式
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 搜索中 */}
          {isSearching && results.length === 0 && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">正在搜索... {progress}%</p>
            </div>
          )}

          {/* 无结果 */}
          {!isSearching && query && totalMatches === 0 && !error && (
            <div className="text-center py-12">
              <SearchIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                没有找到包含 "{query}" 的内容
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                试试其他关键词，或检查搜索选项
              </p>
            </div>
          )}

          {/* 空状态 */}
          {!query && results.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <SearchIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">全局搜索</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                在所有书籍中搜索内容，支持按角色名、关键情节等搜索
              </p>

              {/* 模式说明 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
                {Object.values(SEARCH_MODES).map((mode) => {
                  const Icon = MODE_ICONS[mode.icon]
                  return (
                    <div
                      key={mode.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{mode.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mode.description}
                      </p>
                    </div>
                  )
                })}
              </div>

              {books.length === 0 && (
                <p className="text-sm text-muted-foreground mt-6">
                  还没有导入书籍，请先去书架导入
                </p>
              )}
            </div>
          )}

          {/* 搜索结果 */}
          <SearchResults
            results={results}
            query={query}
            searchMode={searchMode}
          />
        </div>
      </main>
    </div>
  )
}
