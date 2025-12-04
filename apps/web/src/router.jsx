/**
 * 路由配置
 *
 * 使用 React.lazy 实现路由懒加载，减少首屏加载时间
 */

import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Layout from './components/layout/Layout'

// ==================== 懒加载页面组件 ====================

// 核心页面（预加载）
const Library = lazy(() => import('./pages/Library'))
const Reader = lazy(() => import('./pages/Reader'))

// 次要页面（按需加载）
const Search = lazy(() => import('./pages/Search'))
const Bookmarks = lazy(() => import('./pages/Bookmarks'))
const Settings = lazy(() => import('./pages/Settings'))

// 认证页面
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

// ==================== 加载占位符 ====================

/**
 * 页面加载中状态
 */
function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}

/**
 * 带 Suspense 的懒加载包装器
 */
function LazyPage({ component: Component }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// ==================== 路由配置 ====================

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/library" replace />,
      },
      {
        path: 'library',
        element: <LazyPage component={Library} />,
      },
      {
        path: 'reader/:bookId?',
        element: <LazyPage component={Reader} />,
      },
      {
        path: 'search',
        element: <LazyPage component={Search} />,
      },
      {
        path: 'bookmarks',
        element: <LazyPage component={Bookmarks} />,
      },
      {
        path: 'settings',
        element: <LazyPage component={Settings} />,
      },
    ],
  },
  {
    path: '/login',
    element: <LazyPage component={Login} />,
  },
  {
    path: '/register',
    element: <LazyPage component={Register} />,
  },
])

// ==================== 预加载函数 ====================

/**
 * 预加载核心页面
 * 在应用空闲时调用，提前加载常用页面
 */
export function preloadCorePages() {
  // 使用 requestIdleCallback 在浏览器空闲时预加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('./pages/Library')
      import('./pages/Reader')
    })
  } else {
    // 降级：延迟 2 秒后加载
    setTimeout(() => {
      import('./pages/Library')
      import('./pages/Reader')
    }, 2000)
  }
}
