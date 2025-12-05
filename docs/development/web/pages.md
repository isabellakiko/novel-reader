# 前端页面文档

> apps/web 页面结构与路由说明

**最后更新**: 2025-12-05

---

## 页面概览

| 页面 | 路由 | 状态 | 说明 |
|------|------|------|------|
| 书架页 | `/library` | ✅ 完成 | 首页，书籍列表 |
| 阅读页 | `/reader/:bookId?` | ✅ 完成 | 阅读器 |
| 搜索页 | `/search` | ✅ 完成 | 全局搜索 |
| 书签页 | `/bookmarks` | ✅ 完成 | 书签管理 |
| 设置页 | `/settings` | ✅ 完成 | 应用设置、统计 |
| 登录页 | `/login` | ✅ 完成 | 用户登录 |
| 注册页 | `/register` | ✅ 完成 | 用户注册 |

---

## 路由配置

**文件**: `src/router.jsx`

```jsx
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/library" /> },
      { path: 'library', element: <Library /> },
      { path: 'reader/:bookId?', element: <Reader /> },
      { path: 'search', element: <Search /> },
      { path: 'bookmarks', element: <Bookmarks /> },
      { path: 'settings', element: <Settings /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
]
```

---

## 书架页（Library）✅

**位置**: `pages/Library.jsx`
**路由**: `/library`（默认首页）

**功能**:
- 书籍网格展示（响应式 2-7 列）
- 3D 书籍卡片（悬浮效果）
- 阅读进度显示（章节/百分比/进度条）
- 搜索过滤书籍
- 文件上传（拖拽/点击）
- 导入进度浮层
- 删除书籍确认

**状态**:
- 书籍列表: `useLibraryStore`
- 阅读进度: `progressStore.getAll()`

**核心组件**:
- `BookCard` - 书籍卡片
- `FileUpload` - 上传组件

---

## 阅读页（Reader）✅

**位置**: `pages/Reader.jsx`
**路由**: `/reader/:bookId?`

**功能**:
- 章节内容渲染
- 章节导航侧边栏（可搜索）
- 阅读设置面板（字体/行高/宽度）
- 进度自动保存（防抖 1s）
- 滚动位置恢复
- 书签功能
- 键盘快捷键（← → 翻页，Esc 关闭面板）
- 搜索高亮跳转

**状态**:
- 书籍/章节: `useReaderStore`
- 书签: `useBookmarkStore`
- URL 参数: `highlight`, `position`, `chapter`

**核心组件**:
- `ChapterList` - 章节列表
- `ReaderSettings` - 设置面板
- `HighlightQuery` - 搜索高亮

**URL 参数**:
| 参数 | 说明 |
|------|------|
| `chapter` | 跳转到指定章节 |
| `highlight` | 高亮显示关键词 |
| `position` | 滚动到指定位置 |

---

## 搜索页（Search）✅

**位置**: `pages/Search.jsx`
**路由**: `/search`

**功能**:
- 关键词搜索输入
- 书籍选择下拉
- 4 种搜索模式切换
  - 概览：每章 1 条，快速定位
  - 详细：按章节分组，可折叠
  - 频率：按出现次数排序
  - 时间线：按顺序平铺
- Web Worker 后台搜索
- 搜索统计显示
- 点击跳转阅读器（带高亮）

**状态**:
- 搜索: `useSearchStore`
- 书籍列表: `useLibraryStore`

**核心组件**:
- `SearchResults` - 搜索结果（4 种视图）
- `HighlightedText` - 结果高亮

---

## 书签页（Bookmarks）✅

**位置**: `pages/Bookmarks.jsx`
**路由**: `/bookmarks`

**功能**:
- 所有书签列表
- 分组方式切换（按时间/按书籍）
- 书签卡片（书名、章节、摘录、时间）
- 点击跳转阅读位置
- 删除书签

**状态**:
- 书签: `useBookmarkStore.allBookmarks`

**分组方式**:
| 模式 | 说明 |
|------|------|
| 按时间 | 今天、昨天、本周、更早 |
| 按书籍 | 按书籍名称分组 |

---

## 设置页（Settings）✅

**位置**: `pages/Settings.jsx`
**路由**: `/settings`

**功能**:
- 主题设置（7 种主题：自动/白天/夜间/暖黄/豆沙绿/薄荷蓝/暗紫）
- 阅读设置（字体/行高/宽度）
- 阅读统计（今日/本周/累计）
- 数据导入导出（完整备份/选择性恢复）
- 关于信息

**状态**:
- 主题: `useThemeStore`
- 阅读设置: `useReaderStore.settings`
- 统计: `useStatsStore`

---

## 登录页（Login）✅

**位置**: `pages/Login.jsx`
**路由**: `/login`

**功能**:
- 用户名/密码登录
- 记住登录状态
- 跳转到注册页
- 登录成功自动跳转

**状态**:
- 认证: `useAuthStore`

---

## 注册页（Register）✅

**位置**: `pages/Register.jsx`
**路由**: `/register`

**功能**:
- 用户名/邮箱/密码注册
- 密码强度检测
- 密码确认
- 跳转到登录页
- 注册成功自动登录

**状态**:
- 认证: `useAuthStore`

---

## 布局结构

```
┌─────────────────────────────────────────┐
│            Sidebar    │   MainContent   │
│  ┌───────────────┐    │                 │
│  │    Logo       │    │                 │
│  ├───────────────┤    │    <Outlet />   │
│  │   书架        │    │                 │
│  │   阅读        │    │   (页面内容)    │
│  │   搜索        │    │                 │
│  │   书签        │    │                 │
│  │   设置        │    │                 │
│  ├───────────────┤    │                 │
│  │ ThemeToggle   │    │                 │
│  │   v0.1.0      │    │                 │
│  └───────────────┘    │                 │
└─────────────────────────────────────────┘
```

---

## 状态管理

### Stores（完整列表见 [CONTEXT.md](../../ai-context/CONTEXT.md)）

| Store | 文件 | 用途 |
|-------|------|------|
| `useLibraryStore` | `stores/library.js` | 书架、导入 |
| `useReaderStore` | `stores/reader.js` | 阅读器、设置 |
| `useSearchStore` | `stores/search.js` | 搜索状态、Worker 通信 |
| `useBookmarkStore` | `stores/bookmark.js` | 书签 CRUD |
| `useHighlightStore` | `stores/highlight.js` | 文本高亮、笔记 |
| `useTagStore` | `stores/tags.js` | 标签分类、收藏 |
| `useThemeStore` | `stores/theme.js` | 主题切换 |
| `useAuthStore` | `stores/auth.js` | 用户认证、Token |
| `useSyncStore` | `stores/sync.js` | 云端同步 |
| `useStatsStore` | `stores/stats.js` | 阅读统计 |
| `useToastStore` | `stores/toast.js` | 全局提示 |
| `useOfflineQueueStore` | `stores/offlineQueue.js` | 离线操作队列 |
| `db` | `stores/db.js` | IndexedDB Schema |

### 数据库（IndexedDB）

| 表 | 文件 | 用途 |
|-----|------|------|
| `books` | `stores/db.js` | 书籍元数据 |
| `bookContents` | `stores/db.js` | 书籍内容（大文本分离） |
| `readingProgress` | `stores/db.js` | 阅读进度 |
| `bookmarks` | `stores/db.js` | 书签 |
| `readingStats` | `stores/db.js` | 阅读统计 |

---

## 更新记录

| 日期 | 页面 | 变更 |
|------|------|------|
| 2025-12-05 | Login/Register | 新增登录注册页面文档 |
| 2025-12-05 | Settings | 更新功能描述（统计、导入导出） |
| 2025-12-05 | Stores | 完善 Stores 列表（13 个） |
| 2025-12-02 | 全部 | 文档全面更新，反映实际实现 |
| 2025-12-02 | Library | 添加进度显示 |
| 2025-12-02 | Search | 4 种搜索模式 |
| 2025-12-02 | Bookmarks | 新增页面 |
