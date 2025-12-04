/**
 * 侧边栏导航组件
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { Library, BookOpen, Search, Bookmark, Settings, User, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import ThemeToggle from '../ThemeToggle'
import useAuthStore from '../../stores/auth'

const navItems = [
  { to: '/library', icon: Library, label: '书架' },
  { to: '/reader', icon: BookOpen, label: '阅读' },
  { to: '/search', icon: Search, label: '搜索' },
  { to: '/bookmarks', icon: Bookmark, label: '书签' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/library')
  }

  return (
    <aside className="w-16 md:w-56 bg-sidebar border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <BookOpen className="w-6 h-6 text-primary" />
        <span className="ml-3 font-semibold text-lg hidden md:block">
          Novel Reader
        </span>
      </div>

      {/* 导航链接 */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2.5 rounded-lg transition-colors relative',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute inset-0 bg-primary/10 rounded-lg"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                    <item.icon className="w-5 h-5 relative z-10" />
                    <span className="ml-3 hidden md:block relative z-10">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 用户区域 */}
      <div className="px-2 pb-2 border-t border-border pt-2">
        {isAuthenticated ? (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium truncate hidden md:block">
                {user?.username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center px-3 py-2.5 rounded-lg text-muted-foreground
                     hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="ml-3 hidden md:block">登录同步</span>
          </NavLink>
        )}
      </div>

      {/* 底部：主题切换 + 版本 */}
      <div className="p-3 border-t border-border flex items-center justify-between">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground hidden md:block">
          v0.1.0
        </span>
      </div>
    </aside>
  )
}
