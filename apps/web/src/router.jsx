/**
 * 路由配置
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { Library, Reader, Search, Settings } from './pages'

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
        element: <Library />,
      },
      {
        path: 'reader/:bookId?',
        element: <Reader />,
      },
      {
        path: 'search',
        element: <Search />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
])
