/**
 * 书签页面
 *
 * 显示所有书签，支持跳转和删除
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  BookOpen,
  Trash2,
  FileText,
  Calendar,
  MoreVertical,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useBookmarkStore } from '../stores/bookmark'
import EmptyState from '../components/ui/EmptyState'
import { BookmarkListSkeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/utils'

/**
 * 格式化日期
 */
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d

  // 今天
  if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) {
    return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.getDate() === yesterday.getDate()) {
    return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  // 今年
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  // 其他
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

/**
 * 书签卡片
 */
function BookmarkCard({ bookmark, onNavigate, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        {/* 书签图标 */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bookmark className="w-5 h-5 text-primary" />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {/* 书名 */}
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate">
              {bookmark.bookTitle}
            </span>
          </div>

          {/* 章节 */}
          <button
            onClick={() => onNavigate(bookmark)}
            className="text-left w-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium hover:text-primary transition-colors truncate">
                {bookmark.chapterTitle}
              </span>
            </div>
          </button>

          {/* 摘录 */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {bookmark.excerpt}
          </p>

          {/* 备注 */}
          {bookmark.note && (
            <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2 mb-2">
              {bookmark.note}
            </p>
          )}

          {/* 时间 */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(bookmark.createdAt)}
          </div>
        </div>

        {/* 操作菜单 */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                'p-1.5 rounded-lg',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={cn(
                'min-w-[120px] bg-popover rounded-lg p-1 shadow-xl border border-border',
                'animate-in fade-in-0 zoom-in-95'
              )}
              sideOffset={5}
            >
              <DropdownMenu.Item
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground outline-none'
                )}
                onClick={() => onNavigate(bookmark)}
              >
                <BookOpen className="w-4 h-4" />
                跳转阅读
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-border my-1" />

              <DropdownMenu.Item
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer',
                  'text-destructive hover:bg-destructive/10 outline-none'
                )}
                onClick={() => onDelete(bookmark.id)}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </motion.div>
  )
}

export default function Bookmarks() {
  const navigate = useNavigate()
  const { allBookmarks, isLoading, loadAllBookmarks, deleteBookmark } =
    useBookmarkStore()

  const [groupByBook, setGroupByBook] = useState(false)

  // 加载书签
  useEffect(() => {
    loadAllBookmarks()
  }, [loadAllBookmarks])

  // 按书籍分组
  const groupedBookmarks = groupByBook
    ? allBookmarks.reduce((groups, bookmark) => {
        const key = bookmark.bookId
        if (!groups[key]) {
          groups[key] = {
            bookId: bookmark.bookId,
            bookTitle: bookmark.bookTitle,
            bookmarks: [],
          }
        }
        groups[key].bookmarks.push(bookmark)
        return groups
      }, {})
    : null

  // 跳转到阅读器
  const handleNavigate = (bookmark) => {
    navigate(
      `/reader/${bookmark.bookId}?chapter=${bookmark.chapterIndex}&position=${bookmark.position}`
    )
  }

  // 删除书签
  const handleDelete = async (id) => {
    if (confirm('确定要删除这个书签吗？')) {
      await deleteBookmark(id)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-primary" />
            我的书签
          </h1>

          {/* 分组切换 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupByBook(false)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                !groupByBook
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              按时间
            </button>
            <button
              onClick={() => setGroupByBook(true)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                groupByBook
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              按书籍
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* 加载中 - 骨架屏 */}
          {isLoading && <BookmarkListSkeleton count={5} />}

          {/* 空状态 */}
          {!isLoading && allBookmarks.length === 0 && (
            <EmptyState
              icon={Bookmark}
              title="还没有书签"
              description="在阅读时点击书签按钮，收藏喜欢的段落"
              action={
                <button
                  onClick={() => navigate('/library')}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  前往书架
                </button>
              }
            />
          )}

          {/* 按时间显示 */}
          {!isLoading && !groupByBook && allBookmarks.length > 0 && (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {allBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onNavigate={handleNavigate}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* 按书籍分组显示 */}
          {!isLoading && groupByBook && groupedBookmarks && (
            <div className="space-y-8">
              {Object.values(groupedBookmarks).map((group) => (
                <div key={group.bookId}>
                  {/* 书籍标题 */}
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">{group.bookTitle}</h2>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {group.bookmarks.length} 个书签
                    </span>
                  </div>

                  {/* 书签列表 */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {group.bookmarks.map((bookmark) => (
                        <BookmarkCard
                          key={bookmark.id}
                          bookmark={bookmark}
                          onNavigate={handleNavigate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
