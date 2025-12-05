# 前端组件文档

> apps/web 组件索引与使用说明

**最后更新**: 2025-12-05

---

## 组件目录

```
src/components/
├── BookCard.jsx              # 3D 书籍卡片（含收藏、标签）
├── FileUpload.jsx            # 文件上传
├── ThemeToggle.jsx           # 主题切换
├── layout/
│   ├── Layout.jsx            # 主布局
│   ├── Sidebar.jsx           # 侧边栏导航
│   └── MobileNav.jsx         # 移动端导航
├── reader/
│   ├── ChapterList.jsx       # 章节列表
│   ├── ReaderSettings.jsx    # 阅读设置
│   ├── VirtualizedContent.jsx # 虚拟滚动内容
│   ├── HighlightedContent.jsx # 高亮内容渲染
│   ├── HighlightMenu.jsx     # 高亮编辑菜单
│   ├── NotesPanel.jsx        # 笔记面板
│   └── ReadingProgress.jsx   # 阅读进度组件
├── search/
│   ├── HighlightedText.jsx   # 高亮文本
│   └── SearchResults.jsx     # 搜索结果
├── library/
│   └── TagComponents.jsx     # 标签相关组件
├── stats/
│   └── ReadingChart.jsx      # 阅读统计图表
└── ui/
    ├── EmptyState.jsx        # 空状态提示
    ├── ErrorBoundary.jsx     # 错误边界
    ├── Skeleton.jsx          # 骨架屏
    ├── NetworkStatus.jsx     # 网络状态
    ├── SyncConflictDialog.jsx # 同步冲突对话框
    └── ToastContainer.jsx    # 消息提示容器
```

---

## 已实现组件

### BookCard ✅

**位置**: `components/BookCard.jsx`

**功能**:
- 3D 悬浮效果（Framer Motion）
- 书脊阴影和厚度效果
- 8 种根据书名自动生成的配色方案
- 阅读进度显示（章节/百分比/进度条）
- 右键菜单（继续阅读、删除）

**Props**:
```jsx
{
  book: {
    id: string,
    title: string,
    author: string,
    chapters: [],
    metadata: { totalChapters, fileSize }
  },
  onDelete: (id) => void,
  progress: { chapterIndex, scrollPosition } // 可选
}
```

---

### FileUpload ✅

**位置**: `components/FileUpload.jsx`

**功能**:
- 拖拽上传区域
- 点击选择文件
- 支持 .txt 文件
- 加载状态显示

**Props**:
```jsx
{
  onFileSelect: (file: File) => void,
  isLoading: boolean,
  className: string
}
```

---

### ThemeToggle ✅

**位置**: `components/ThemeToggle.jsx`

**功能**:
- 3 种主题切换（白天/夜间/护眼）
- 下拉菜单选择
- 图标指示当前主题

**Props**: 无（使用 Zustand store）

---

### Layout ✅

**位置**: `components/layout/Layout.jsx`

**功能**:
- 全局布局容器
- 包含 Sidebar + MainContent
- React Router Outlet

**Props**: 无

---

### Sidebar ✅

**位置**: `components/layout/Sidebar.jsx`

**功能**:
- 导航链接（书架、阅读、搜索、书签、设置）
- 响应式设计（移动端收缩）
- 当前页面高亮指示
- 底部主题切换 + 版本号

**导航项**:
| 路由 | 图标 | 标签 |
|------|------|------|
| /library | Library | 书架 |
| /reader | BookOpen | 阅读 |
| /search | Search | 搜索 |
| /bookmarks | Bookmark | 书签 |
| /settings | Settings | 设置 |

---

### ChapterList ✅

**位置**: `components/reader/ChapterList.jsx`

**功能**:
- 章节目录侧边栏
- 搜索过滤章节
- 当前章节高亮
- 点击跳转章节

**Props**:
```jsx
{
  chapters: [{ title, start, end }],
  currentIndex: number,
  onSelect: (index) => void,
  onClose: () => void,
  searchQuery: string,
  onSearchChange: (query) => void
}
```

---

### ReaderSettings ✅

**位置**: `components/reader/ReaderSettings.jsx`

**功能**:
- 字体大小调节（12-28px）
- 行高调节（1.4-2.4）
- 内容宽度调节（600-1200px）
- 字体选择（衬线/无衬线）

**Props**:
```jsx
{
  settings: { fontSize, lineHeight, maxWidth, fontFamily },
  onUpdate: (updates) => void,
  onClose: () => void
}
```

---

### HighlightedText ✅

**位置**: `components/search/HighlightedText.jsx`

**功能**:
- 高亮显示搜索关键词
- 支持 CJK 字符
- 导出 HighlightQuery 组件

**导出**:
```jsx
// 高亮文本片段
export function HighlightedText({ text, highlights })

// 按关键词高亮
export function HighlightQuery({ text, query })
```

---

### SearchResults ✅

**位置**: `components/search/SearchResults.jsx`

**功能**:
- 4 种搜索模式渲染
  - **概览模式**: 每章显示 1 条匹配
  - **详细模式**: 按章节分组，可折叠
  - **频率模式**: 按出现次数排序，带进度条
  - **时间线模式**: 按顺序平铺显示

**Props**:
```jsx
{
  results: SearchResult[],
  searchMode: 'overview' | 'detailed' | 'frequency' | 'timeline',
  onJumpToResult: (result) => void
}
```

---

## 组件开发规范

### 文件结构

单文件组件（当前使用）:
```
components/ComponentName.jsx
```

### 必须包含

1. **Props 类型说明**（JSDoc 注释）
2. **默认 Props**
3. **className 支持**（可合并外部样式）

### 样式规范

- 使用 Tailwind CSS
- 使用 `cn()` 合并 class（来自 `lib/utils.js`）
- 动画使用 Framer Motion

### 示例

```jsx
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

/**
 * 组件描述
 * @param {Object} props
 * @param {string} props.className - 额外样式
 */
function ComponentName({ className, ...props }) {
  return (
    <motion.div
      className={cn('base-styles', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      {...props}
    />
  )
}

export default ComponentName
```

---

### ReadingProgress ✅ (新增)

**位置**: `components/reader/ReadingProgress.jsx`

**功能**:
- 底部固定进度条
- 详细进度面板（剩余时间估算）
- 迷你进度指示器
- `useReadingProgress` Hook

**导出**:
```jsx
export const BottomProgressBar   // 底部进度条
export const ProgressPanel       // 详细进度面板
export const MiniProgress        // 迷你进度
export function useReadingProgress(book, chapterIndex, scrollProgress)
```

---

### HighlightedContent ✅ (新增)

**位置**: `components/reader/HighlightedContent.jsx`

**功能**:
- 渲染带高亮标记的文本
- 处理文本选择
- 高亮点击编辑

**Props**:
```jsx
{
  lines: string[],
  settings: ReaderSettings,
  bookId: string,
  chapterIndex: number,
  onHighlightChange: () => void
}
```

---

### HighlightMenu ✅ (新增)

**位置**: `components/reader/HighlightMenu.jsx`

**功能**:
- 文本选择后的高亮菜单
- 5 种高亮颜色选择
- 添加笔记功能
- 编辑/删除已有高亮

**导出**:
```jsx
export function SelectionMenu     // 新增高亮菜单
export function HighlightEditMenu // 编辑高亮菜单
```

---

### NotesPanel ✅ (新增)

**位置**: `components/reader/NotesPanel.jsx`

**功能**:
- 侧边笔记面板
- 按颜色筛选高亮
- 只看有笔记的条目
- 导出为 Markdown

---

### TagComponents ✅ (新增)

**位置**: `components/library/TagComponents.jsx`

**功能**:
- 标签徽章 (TagBadge)
- 标签选择器 (TagSelector)
- 分类选择器 (CategorySelector)
- 收藏按钮 (FavoriteButton)
- 筛选栏 (FilterBar)

**导出**:
```jsx
export const TagBadge          // 标签徽章
export const TagSelector       // 标签选择器
export const CategorySelector  // 分类选择器
export const FavoriteButton    // 收藏按钮
export const FilterBar         // 筛选栏
```

---

### UI 组件 ✅

**位置**: `components/ui/`

| 组件 | 功能 |
|------|------|
| EmptyState | 空状态提示，支持自定义图标和操作 |
| ErrorBoundary | React 错误边界，优雅降级 |
| Skeleton | 骨架屏加载占位 |
| NetworkStatus | 网络状态指示器 |
| SyncConflictDialog | 同步冲突处理对话框 |
| ToastContainer | 全局消息提示容器 |

---

## 更新记录

| 日期 | 组件 | 变更 |
|------|------|------|
| 2025-12-05 | 全部 | 添加新增组件文档（高亮、标签、进度） |
| 2025-12-05 | BookCard | 添加收藏按钮、标签显示 |
| 2025-12-05 | reader/ | 新增 ReadingProgress、HighlightedContent、HighlightMenu、NotesPanel |
| 2025-12-05 | library/ | 新增 TagComponents |
| 2025-12-02 | 全部 | 文档全面更新，反映实际实现 |
| 2025-12-02 | BookCard | 添加进度显示功能 |
| 2025-12-02 | SearchResults | 4 种搜索模式 |
