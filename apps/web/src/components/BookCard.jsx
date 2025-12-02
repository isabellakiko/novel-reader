/**
 * 书籍卡片组件
 *
 * 仿真书籍封面设计，带有 3D 悬浮效果
 */

import { useNavigate } from 'react-router-dom'
import { MoreVertical, Trash2, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '../lib/utils'

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

/**
 * 生成书籍封面配色方案
 */
function generateCoverTheme(title) {
  const themes = [
    { bg: 'from-slate-700 to-slate-900', accent: 'bg-amber-500', text: 'text-amber-100' },
    { bg: 'from-blue-800 to-blue-950', accent: 'bg-cyan-400', text: 'text-cyan-100' },
    { bg: 'from-emerald-800 to-emerald-950', accent: 'bg-lime-400', text: 'text-lime-100' },
    { bg: 'from-purple-800 to-purple-950', accent: 'bg-pink-400', text: 'text-pink-100' },
    { bg: 'from-rose-800 to-rose-950', accent: 'bg-orange-400', text: 'text-orange-100' },
    { bg: 'from-indigo-800 to-indigo-950', accent: 'bg-violet-400', text: 'text-violet-100' },
    { bg: 'from-teal-800 to-teal-950', accent: 'bg-emerald-400', text: 'text-emerald-100' },
    { bg: 'from-amber-800 to-amber-950', accent: 'bg-yellow-400', text: 'text-yellow-100' },
  ]
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return themes[Math.abs(hash) % themes.length]
}

export default function BookCard({ book, onDelete }) {
  const navigate = useNavigate()
  const theme = generateCoverTheme(book.title)
  const totalChapters = book.metadata?.totalChapters || book.chapters?.length || 0

  const handleClick = () => {
    navigate(`/reader/${book.id}`)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(book.id)
  }

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      layout
    >
      {/* 书籍主体 - 3D 效果容器 */}
      <div
        className="relative cursor-pointer perspective-1000"
        onClick={handleClick}
        style={{ perspective: '1000px' }}
      >
        {/* 书籍卡片 */}
        <motion.div
          className="relative"
          whileHover={{
            rotateY: -8,
            translateX: 8,
            transition: { duration: 0.3 }
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* 书脊阴影 */}
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-3 rounded-l-sm',
              'bg-gradient-to-r from-black/40 to-transparent',
              'transform -translate-x-1 origin-left'
            )}
            style={{ transform: 'rotateY(90deg) translateX(-1px)' }}
          />

          {/* 封面主体 */}
          <div
            className={cn(
              'relative rounded-lg overflow-hidden',
              'shadow-lg group-hover:shadow-2xl transition-shadow duration-300',
              'border border-white/10'
            )}
          >
            {/* 封面背景 */}
            <div
              className={cn(
                'aspect-[2/3] bg-gradient-to-br p-4 flex flex-col',
                theme.bg
              )}
            >
              {/* 顶部装饰线 */}
              <div className={cn('h-1 w-12 rounded-full mb-4', theme.accent)} />

              {/* 书名 */}
              <h3
                className={cn(
                  'font-bold text-base leading-tight line-clamp-3 flex-grow',
                  theme.text
                )}
              >
                {book.title}
              </h3>

              {/* 作者 */}
              <p className="text-white/60 text-xs mt-2 line-clamp-1">
                {book.author || '佚名'}
              </p>

              {/* 底部信息 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-white/50 text-xs">
                  {totalChapters} 章
                </span>
                <span className="text-white/50 text-xs">
                  {formatFileSize(book.metadata?.fileSize)}
                </span>
              </div>

              {/* 装饰图案 */}
              <div
                className={cn(
                  'absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-10',
                  theme.accent
                )}
              />
              <div
                className={cn(
                  'absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-5',
                  theme.accent
                )}
              />
            </div>

            {/* 悬浮时的光泽效果 */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                'pointer-events-none'
              )}
            />
          </div>

          {/* 书籍厚度效果（右侧） */}
          <div
            className={cn(
              'absolute top-0 -right-1 w-2 h-full rounded-r-sm',
              'bg-gradient-to-l from-black/30 to-black/10',
              'group-hover:-right-2 transition-all duration-300'
            )}
          />

          {/* 书籍底部阴影 */}
          <div
            className={cn(
              'absolute -bottom-2 left-2 right-2 h-4 rounded-full',
              'bg-black/20 blur-md',
              'group-hover:-bottom-3 group-hover:bg-black/30 transition-all duration-300'
            )}
          />
        </motion.div>
      </div>

      {/* 操作菜单 */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-lg z-10',
              'bg-black/40 backdrop-blur-sm text-white',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={cn(
              'min-w-[140px] bg-popover rounded-lg p-1 shadow-xl border border-border',
              'animate-in fade-in-0 zoom-in-95'
            )}
            sideOffset={5}
          >
            <DropdownMenu.Item
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer',
                'hover:bg-accent hover:text-accent-foreground outline-none'
              )}
              onClick={handleClick}
            >
              <BookOpen className="w-4 h-4" />
              开始阅读
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-1" />

            <DropdownMenu.Item
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer',
                'text-destructive hover:bg-destructive/10 outline-none'
              )}
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              删除书籍
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </motion.div>
  )
}
