# 前端组件文档

> apps/web 组件索引与使用说明

**最后更新**: 2025-12-02

---

## 组件目录

```
src/components/
├── BookCard.jsx           # 3D 书籍卡片
├── FileUpload.jsx         # 文件上传
├── ThemeToggle.jsx        # 主题切换
├── layout/
│   ├── Layout.jsx         # 主布局
│   └── Sidebar.jsx        # 侧边栏导航
├── reader/
│   ├── ChapterList.jsx    # 章节列表
│   └── ReaderSettings.jsx # 阅读设置
└── search/
    ├── HighlightedText.jsx # 高亮文本
    └── SearchResults.jsx   # 搜索结果
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

## 更新记录

| 日期 | 组件 | 变更 |
|------|------|------|
| 2025-12-02 | 全部 | 文档全面更新，反映实际实现 |
| 2025-12-02 | BookCard | 添加进度显示功能 |
| 2025-12-02 | SearchResults | 4 种搜索模式 |
