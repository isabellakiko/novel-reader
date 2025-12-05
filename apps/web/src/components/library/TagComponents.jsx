/**
 * 标签相关组件
 *
 * - TagBadge: 显示单个标签
 * - TagSelector: 选择/创建标签
 * - BookTagsEditor: 编辑书籍标签
 * - FilterBar: 书架筛选栏
 */

import { useState, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag,
  Plus,
  X,
  Check,
  Heart,
  BookOpen,
  CheckCircle,
  PauseCircle,
  ChevronDown,
  Search,
  Filter,
  Star,
} from 'lucide-react'
import { useTagStore, TAG_COLORS, DEFAULT_CATEGORIES } from '../../stores/tags'
import { cn } from '../../lib/utils'

/**
 * 获取分类图标
 */
const CategoryIcons = {
  BookOpen,
  CheckCircle,
  PauseCircle,
  Heart,
}

/**
 * 标签徽章
 */
export const TagBadge = memo(function TagBadge({
  tag,
  size = 'sm',
  onRemove,
  onClick,
}) {
  const colorConfig = TAG_COLORS.find((c) => c.id === tag.color) || TAG_COLORS[7]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        colorConfig.class,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        onClick && 'cursor-pointer hover:opacity-80'
      )}
      onClick={onClick}
    >
      <Tag className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag)
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
})

/**
 * 标签选择器
 */
export const TagSelector = memo(function TagSelector({
  selectedTags = [],
  onTagsChange,
  bookId,
}) {
  const {
    getAllTags,
    createTag,
    addTagToBook,
    removeTagFromBook,
    getBookTags,
  } = useTagStore()

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const containerRef = useRef(null)

  const allTags = getAllTags()
  const bookTags = bookId ? getBookTags(bookId) : selectedTags

  // 筛选标签
  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  )

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 切换标签
  const handleToggleTag = (tag) => {
    const isSelected = bookTags.some((t) => t.id === tag.id)
    if (bookId) {
      if (isSelected) {
        removeTagFromBook(bookId, tag.id)
      } else {
        addTagToBook(bookId, tag.id)
      }
    } else {
      if (isSelected) {
        onTagsChange?.(selectedTags.filter((t) => t.id !== tag.id))
      } else {
        onTagsChange?.([...selectedTags, tag])
      }
    }
  }

  // 创建新标签
  const handleCreateTag = () => {
    if (!newTagName.trim()) return

    const tag = createTag(newTagName.trim(), newTagColor)
    if (bookId) {
      addTagToBook(bookId, tag.id)
    } else {
      onTagsChange?.([...selectedTags, tag])
    }

    setNewTagName('')
    setShowCreateForm(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-accent transition-colors"
      >
        <Tag className="w-4 h-4" />
        <span>标签</span>
        {bookTags.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
            {bookTags.length}
          </span>
        )}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-xl shadow-xl z-50"
          >
            {/* 搜索框 */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索或创建标签..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* 标签列表 */}
            <div className="max-h-48 overflow-auto p-2">
              {filteredTags.length === 0 && !search ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  暂无标签
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map((tag) => {
                    const isSelected = bookTags.some((t) => t.id === tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleToggleTag(tag)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
                          isSelected ? 'bg-primary/10' : 'hover:bg-accent'
                        )}
                      >
                        <TagBadge tag={tag} />
                        <span className="flex-1" />
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 创建新标签提示 */}
              {search && !filteredTags.some((t) => t.name === search) && (
                <button
                  onClick={() => {
                    setNewTagName(search)
                    setShowCreateForm(true)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 mt-1 rounded-lg hover:bg-accent text-sm"
                >
                  <Plus className="w-4 h-4" />
                  创建 "{search}"
                </button>
              )}
            </div>

            {/* 创建标签表单 */}
            {showCreateForm && (
              <div className="p-2 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="标签名称"
                    className="flex-1 px-2 py-1 text-sm bg-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setNewTagColor(color.id)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-all',
                        color.class,
                        newTagColor === color.id && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-2 py-1 text-sm rounded-lg hover:bg-accent"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateTag}
                    className="flex-1 px-2 py-1 text-sm bg-primary text-primary-foreground rounded-lg"
                  >
                    创建
                  </button>
                </div>
              </div>
            )}

            {/* 底部：新建标签按钮 */}
            {!showCreateForm && (
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm rounded-lg hover:bg-accent"
                >
                  <Plus className="w-4 h-4" />
                  新建标签
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

/**
 * 分类选择器
 */
export const CategorySelector = memo(function CategorySelector({
  bookId,
  currentCategory,
  onChange,
}) {
  const { setBookCategory, getBookCategory } = useTagStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const category = bookId ? getBookCategory(bookId) : currentCategory

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (categoryId) => {
    if (bookId) {
      setBookCategory(bookId, categoryId)
    } else {
      onChange?.(categoryId)
    }
    setIsOpen(false)
  }

  const currentCat = DEFAULT_CATEGORIES.find((c) => c.id === category)

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-accent transition-colors"
      >
        {currentCat ? (
          <>
            {(() => {
              const Icon = CategoryIcons[currentCat.icon]
              return Icon ? <Icon className="w-4 h-4" /> : null
            })()}
            <span>{currentCat.name}</span>
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4" />
            <span>分类</span>
          </>
        )}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 w-40 bg-popover border border-border rounded-xl shadow-xl z-50 p-1"
          >
            {/* 清除分类 */}
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                !category ? 'bg-accent' : 'hover:bg-accent'
              )}
            >
              <X className="w-4 h-4" />
              <span className="text-sm">无分类</span>
            </button>

            {DEFAULT_CATEGORIES.map((cat) => {
              const Icon = CategoryIcons[cat.icon]
              const colorClass = TAG_COLORS.find((c) => c.id === cat.color)?.class || ''

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    category === cat.id ? 'bg-accent' : 'hover:bg-accent'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="text-sm">{cat.name}</span>
                  {category === cat.id && (
                    <Check className="w-4 h-4 ml-auto text-primary" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

/**
 * 收藏按钮
 */
export const FavoriteButton = memo(function FavoriteButton({
  bookId,
  size = 'md',
}) {
  const { isFavorite, toggleFavorite } = useTagStore()
  const favorite = isFavorite(bookId)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(bookId)
      }}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        favorite
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-muted-foreground hover:bg-accent'
      )}
      title={favorite ? '取消收藏' : '收藏'}
    >
      <Heart
        className={cn(
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-5 h-5',
          favorite && 'fill-current'
        )}
      />
    </button>
  )
})

/**
 * 筛选栏
 */
export const FilterBar = memo(function FilterBar({
  filters,
  onFiltersChange,
}) {
  const { getAllTags, getTagStats } = useTagStore()
  const [showFilters, setShowFilters] = useState(false)

  const allTags = getAllTags()
  const tagStats = getTagStats()

  const activeFiltersCount =
    (filters.favoritesOnly ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.tagIds?.length || 0)

  return (
    <div className="space-y-3">
      {/* 搜索和筛选按钮 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="搜索书名或作者..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors',
            showFilters || activeFiltersCount > 0
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent'
          )}
        >
          <Filter className="w-4 h-4" />
          筛选
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* 筛选选项 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-muted/50 rounded-xl space-y-4">
              {/* 快捷筛选 */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly })
                  }
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                    filters.favoritesOnly
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-background hover:bg-accent'
                  )}
                >
                  <Heart className={cn('w-4 h-4', filters.favoritesOnly && 'fill-current')} />
                  收藏
                </button>

                {DEFAULT_CATEGORIES.map((cat) => {
                  const Icon = CategoryIcons[cat.icon]
                  const isActive = filters.category === cat.id

                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          category: isActive ? null : cat.id,
                        })
                      }
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                        isActive
                          ? TAG_COLORS.find((c) => c.id === cat.color)?.class
                          : 'bg-background hover:bg-accent'
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {cat.name}
                    </button>
                  )
                })}
              </div>

              {/* 标签筛选 */}
              {allTags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">标签</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const isActive = filters.tagIds?.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            const newTagIds = isActive
                              ? filters.tagIds.filter((id) => id !== tag.id)
                              : [...(filters.tagIds || []), tag.id]
                            onFiltersChange({ ...filters, tagIds: newTagIds })
                          }}
                          className={cn(
                            'transition-all',
                            isActive && 'ring-2 ring-primary ring-offset-1'
                          )}
                        >
                          <TagBadge tag={tag} />
                          {tagStats[tag.id] > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({tagStats[tag.id]})
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 清除筛选 */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() =>
                    onFiltersChange({
                      search: filters.search,
                      favoritesOnly: false,
                      category: null,
                      tagIds: [],
                    })
                  }
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  清除所有筛选
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default {
  TagBadge,
  TagSelector,
  CategorySelector,
  FavoriteButton,
  FilterBar,
}
