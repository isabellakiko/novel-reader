# 前端问题排查

> apps/web 常见问题与解决方案

**最后更新**: 2025-12-02

---

## 目录

1. [构建问题](#构建问题)
2. [样式问题](#样式问题)
3. [状态管理问题](#状态管理问题)
4. [性能问题](#性能问题)

---

## 构建问题

### Vite 热更新失效

**现象**: 修改代码后页面不自动刷新

**原因**:
- 文件监听问题
- 路径别名配置错误

**解决方案**:
```bash
# 1. 重启开发服务器
pnpm dev

# 2. 清除缓存
rm -rf node_modules/.vite
pnpm dev
```

---

### 路径别名导入失败

**现象**: `Cannot find module '@/...'`

**原因**: Vite 配置或 IDE 配置问题

**解决方案**:
```javascript
// vite.config.js 确认配置
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@core': path.resolve(__dirname, '../../packages/core/src'),
    '@shared': path.resolve(__dirname, '../../packages/shared/src'),
  },
}
```

---

## 样式问题

### Tailwind 类不生效

**现象**: 添加的 Tailwind 类没有样式

**原因**:
- content 配置不包含文件
- 类名动态拼接

**解决方案**:
```javascript
// tailwind.config.js
content: [
  "./index.html",
  "./src/**/*.{js,jsx}",
],

// 动态类名必须完整写出
// ❌ 错误
const color = 'blue'
className={`bg-${color}-500`}

// ✅ 正确
const bgColors = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
}
className={bgColors[color]}
```

---

### 暗色模式不生效

**现象**: `dark:` 前缀类不生效

**原因**: darkMode 配置或 HTML class 问题

**解决方案**:
```javascript
// tailwind.config.js
darkMode: 'class',

// 确保 html 标签有 dark class
document.documentElement.classList.add('dark')
```

---

## 状态管理问题

### Zustand persist 数据丢失

**现象**: 刷新页面后状态丢失

**原因**: persist 配置问题

**解决方案**:
```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      // state
    }),
    {
      name: 'storage-key', // 必须指定 name
    }
  )
)
```

---

## 性能问题

### 大文件渲染卡顿

**现象**: 加载大 TXT 文件时页面卡死

**原因**: 一次性渲染全部内容

**解决方案**:
- 使用虚拟滚动（react-window 或 react-virtualized）
- 分片加载文本

### 搜索阻塞 UI

**现象**: 搜索时页面无响应

**原因**: 搜索在主线程执行

**解决方案**:
- 使用 Web Worker 执行搜索
- 添加防抖处理

---

## 更新记录

| 日期 | 问题 | 解决方案 |
|------|------|----------|
| 2025-12-02 | - | 初始化文档 |
