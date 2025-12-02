# 前端页面文档

> apps/web 页面结构与路由说明

**最后更新**: 2025-12-02

---

## 页面规划

| 页面 | 路由 | 状态 | 说明 |
|------|------|------|------|
| 书架页 | `/` | 待开发 | 首页，书籍列表 |
| 阅读页 | `/reader/:bookId` | 待开发 | 阅读器 |
| 搜索页 | `/search/:bookId` | 待开发 | 全局搜索 |

---

## 书架页（Bookshelf）

**路由**: `/`

**功能**:
- 书籍列表展示（卡片/列表视图）
- 文件上传导入
- 书籍管理（删除、重新导入）

**组件**:
- `BookCard` - 书籍卡片
- `BookUploader` - 上传组件
- `ViewToggle` - 视图切换

**状态**:
- 书籍列表（Dexie）
- 视图模式（Zustand）

---

## 阅读页（Reader）

**路由**: `/reader/:bookId`

**功能**:
- 文本渲染（虚拟滚动）
- 章节导航
- 阅读设置（字体、主题）
- 进度管理

**组件**:
- `ReaderView` - 阅读区域
- `ChapterNav` - 章节导航
- `SettingsPanel` - 设置面板
- `ProgressBar` - 进度条

**状态**:
- 当前书籍（Zustand）
- 阅读进度（Dexie）
- 显示设置（Zustand + persist）

---

## 搜索页（Search）

**路由**: `/search/:bookId`

**功能**:
- 关键词搜索
- 结果按章节分组
- 高亮跳转

**组件**:
- `SearchInput` - 搜索输入
- `SearchResults` - 结果列表
- `SearchHistory` - 搜索历史

**状态**:
- 搜索结果（Zustand）
- 搜索历史（Dexie）

---

## 布局结构

```
┌─────────────────────────────────────────┐
│              TopBar                      │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │         MainContent          │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**TopBar**: 工具栏（搜索入口、设置按钮）
**Sidebar**: 书架/目录导航
**MainContent**: 主内容区

---

## 路由配置（待实现）

```jsx
// 使用 React Router
const routes = [
  { path: '/', element: <Bookshelf /> },
  { path: '/reader/:bookId', element: <Reader /> },
  { path: '/search/:bookId', element: <Search /> },
]
```

---

## 更新记录

| 日期 | 页面 | 变更 |
|------|------|------|
| 2025-12-02 | - | 初始化文档结构 |
