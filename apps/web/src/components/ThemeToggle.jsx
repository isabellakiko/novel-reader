/**
 * 主题切换组件
 *
 * 支持多种主题：自动、白天、夜间、暖黄、豆沙绿、薄荷蓝、暗紫
 */

import { Sun, Moon, Eye, Monitor, Leaf, Droplets } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore, THEMES } from '../stores/theme'
import { cn } from '../lib/utils'

const icons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
  sepia: Eye,
  green: Leaf,
  mint: Droplets,
  purple: Moon,
}

export default function ThemeToggle({ className }) {
  const { theme, cycleTheme } = useThemeStore()
  const Icon = icons[theme]
  const themeConfig = THEMES[theme]

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'relative p-2 rounded-lg transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      title={`当前: ${themeConfig.name} - 点击切换`}
      aria-label={`切换主题，当前: ${themeConfig.name}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </AnimatePresence>
    </button>
  )
}

/**
 * 主题选择器（下拉菜单版本）
 */
export function ThemeSelector({ className }) {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
      {Object.entries(THEMES).map(([key, config]) => {
        const Icon = icons[key]
        const isActive = theme === key

        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all',
              'text-sm font-medium',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={isActive}
            aria-label={`${config.name}主题`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{config.name}</span>
          </button>
        )
      })}
    </div>
  )
}
