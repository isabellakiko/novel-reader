/**
 * 全局布局组件
 *
 * 响应式设计：
 * - 桌面端：左侧侧边栏 + 右侧内容
 * - 移动端：底部导航栏 + 全屏内容
 */

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* 桌面端侧边栏 - 移动端隐藏 */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto pb-14 md:pb-0">
        <Outlet />
      </main>

      {/* 移动端底部导航 - 桌面端隐藏 */}
      <MobileNav />
    </div>
  )
}
