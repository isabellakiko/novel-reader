/**
 * 路由配置
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { Library, Reader, Search, Bookmarks, Settings, Login, Register } from './pages'

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
        path: 'bookmarks',
        element: <Bookmarks />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
])
