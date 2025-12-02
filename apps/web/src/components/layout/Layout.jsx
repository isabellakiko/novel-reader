/**
 * 全局布局组件
 *
 * 包含侧边栏导航和主内容区域
 */

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
