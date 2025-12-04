import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useThemeStore } from './stores/theme'
import useAuthStore from './stores/auth'
import './index.css'

// 初始化主题
useThemeStore.getState().initTheme()

// 初始化认证状态（检查 token 有效性）
useAuthStore.getState().checkAuth()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
