/**
 * 移动端底部导航栏
 */

import { NavLink } from 'react-router-dom'
import { Library, BookOpen, Search, Bookmark, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/library', icon: Library, label: '书架' },
  { to: '/reader', icon: BookOpen, label: '阅读' },
  { to: '/search', icon: Search, label: '搜索' },
  { to: '/bookmarks', icon: Bookmark, label: '书签' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom"
      aria-label="主导航"
    >
      <ul className="flex items-center justify-around h-14" role="menubar">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1" role="none">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center h-full gap-0.5 transition-colors relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )
              }
              role="menuitem"
              aria-label={item.label}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
