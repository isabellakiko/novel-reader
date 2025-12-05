/**
 * 骨架屏组件
 *
 * 在内容加载时显示占位动画，提升用户体验
 */

import { cn } from '../../lib/utils'

/**
 * 基础骨架屏
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  )
}

/**
 * 书籍卡片骨架屏
 */
export function BookCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      {/* 封面占位 */}
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      {/* 标题占位 */}
      <Skeleton className="h-4 w-3/4" />
      {/* 作者占位 */}
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

/**
 * 书籍列表骨架屏
 */
export function BookListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * 章节列表骨架屏
 */
export function ChapterListSkeleton({ count = 10 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 flex-1" style={{ width: `${60 + Math.random() * 30}%` }} />
        </div>
      ))}
    </div>
  )
}

/**
 * 阅读器内容骨架屏
 */
export function ReaderContentSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* 章节标题 */}
      <Skeleton className="h-8 w-1/3 mx-auto mb-8" />
      {/* 段落 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4" style={{ width: `${70 + Math.random() * 25}%` }} />
        </div>
      ))}
    </div>
  )
}

/**
 * 书签项骨架屏
 */
export function BookmarkItemSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-border">
      <Skeleton className="w-12 h-16 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

/**
 * 书签列表骨架屏
 */
export function BookmarkListSkeleton({ count = 5 }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <BookmarkItemSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * 搜索结果骨架屏
 */
export function SearchResultSkeleton() {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-14 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  )
}

export default Skeleton
