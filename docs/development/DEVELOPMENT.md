# 开发规范文档

> 项目开发规范、代码风格、目录约定

**最后更新**: 2025-12-02

---

## 目录结构

```
novel-reader/
├── apps/
│   ├── web/                    # React 前端应用
│   │   ├── src/
│   │   │   ├── components/     # 组件
│   │   │   │   ├── ui/         # 基础 UI 组件
│   │   │   │   ├── reader/     # 阅读器组件
│   │   │   │   ├── search/     # 搜索组件
│   │   │   │   └── bookshelf/  # 书架组件
│   │   │   ├── hooks/          # 自定义 hooks
│   │   │   ├── stores/         # Zustand 状态
│   │   │   ├── workers/        # Web Workers
│   │   │   ├── utils/          # 工具函数
│   │   │   ├── styles/         # 样式相关
│   │   │   └── lib/            # 第三方库封装
│   │   └── public/
│   │       └── fonts/          # 阅读字体
│   └── server/                 # 后端预留
│
├── packages/
│   ├── core/                   # 核心逻辑（前后端共享）
│   │   └── src/
│   │       ├── parser/         # 文件解析
│   │       ├── search/         # 搜索算法
│   │       └── types/          # 类型定义
│   └── shared/                 # 共享工具
│       └── src/
│           ├── constants/      # 常量
│           └── utils/          # 工具函数
│
└── docs/                       # 文档
```

---

## 代码规范

### 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `BookCard.jsx` |
| 工具函数 | camelCase | `formatDate.js` |
| 常量文件 | camelCase | `themes.js` |
| CSS/样式 | kebab-case | `book-card.css` |
| Hooks | camelCase，use 前缀 | `useTheme.js` |
| Store | camelCase，Store 后缀 | `readerStore.js` |

### 组件结构

```jsx
// 推荐的组件结构
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

function ComponentName({ prop1, prop2, className }) {
  // 1. hooks
  const [state, setState] = useState()

  // 2. 计算值
  const computed = useMemo(() => {}, [])

  // 3. 事件处理
  const handleClick = () => {}

  // 4. 渲染
  return (
    <div className={cn('base-class', className)}>
      {/* content */}
    </div>
  )
}

export default ComponentName
```

### 样式规范

- 优先使用 Tailwind CSS
- 复杂样式抽取为组件
- 使用 `cn()` 合并 class（clsx + tailwind-merge）

```jsx
// 推荐
<div className={cn(
  'px-4 py-2 rounded-lg',
  isActive && 'bg-blue-500',
  className
)}>
```

---

## 状态管理

### Zustand Store 结构

```javascript
// stores/readerStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useReaderStore = create(
  persist(
    (set, get) => ({
      // 状态
      fontSize: 16,
      theme: 'light',

      // 动作
      setFontSize: (size) => set({ fontSize: size }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'reader-storage',
    }
  )
)

export default useReaderStore
```

### 状态分类

| 类型 | 存储方式 | 示例 |
|------|----------|------|
| UI 状态 | useState | 弹窗开关、hover 状态 |
| 页面状态 | Zustand | 阅读设置、主题 |
| 持久化数据 | Dexie (IndexedDB) | 书籍、进度、书签 |

---

## 路径别名

```javascript
// vite.config.js 已配置
'@'       → 'src/'
'@core'   → 'packages/core/src'
'@shared' → 'packages/shared/src'
```

使用示例：
```javascript
import { Button } from '@/components/ui/Button'
import { parseBook } from '@core/parser'
import { THEMES } from '@shared/constants'
```

---

## Git 提交规范

```
<type>(<scope>): <subject>

type:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- refactor: 重构
- perf: 性能优化
- test: 测试
- chore: 构建/工具

scope: web | core | shared | docs
```

示例：
```bash
feat(web): 添加书架页面布局
fix(core): 修复 GBK 编码检测问题
docs: 更新开发规范文档
```

---

## 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本

# 代码检查
pnpm --filter web lint

# 依赖管理
pnpm add <pkg> --filter web
pnpm add <pkg> --filter @novel-reader/core
```

---

## 文档索引

- [前端组件文档](./web/components.md)
- [前端页面文档](./web/pages.md)
- [前端问题排查](./web/troubleshooting.md)
- [核心模块文档](./core/modules.md)
