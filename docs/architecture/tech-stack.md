# 技术栈详情

> Novel Reader 技术栈版本与配置

**最后更新**: 2025-12-02

---

## 前端（apps/web）

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| React | ^18.3.1 | UI 框架 |
| React DOM | ^18.3.1 | React 渲染器 |
| Vite | ^5.4.10 | 构建工具 |

### 样式

| 技术 | 版本 | 说明 |
|------|------|------|
| Tailwind CSS | ^3.4.14 | 原子化 CSS |
| PostCSS | ^8.4.47 | CSS 处理器 |
| Autoprefixer | ^10.4.20 | 自动前缀 |
| clsx | ^2.1.1 | 条件 class 拼接 |
| tailwind-merge | ^2.5.4 | Tailwind class 合并 |

### UI 组件

| 技术 | 版本 | 说明 |
|------|------|------|
| @radix-ui/react-dialog | ^1.1.2 | 弹窗 |
| @radix-ui/react-dropdown-menu | ^2.1.2 | 下拉菜单 |
| @radix-ui/react-scroll-area | ^1.2.0 | 滚动区域 |
| @radix-ui/react-slider | ^1.2.1 | 滑块 |
| @radix-ui/react-switch | ^1.1.1 | 开关 |
| @radix-ui/react-tabs | ^1.1.1 | 标签页 |
| @radix-ui/react-tooltip | ^1.1.3 | 提示 |

### 动画 & 图标

| 技术 | 版本 | 说明 |
|------|------|------|
| Framer Motion | ^11.11.17 | React 动画库 |
| Lucide React | ^0.460.0 | 图标库 |

### 状态 & 存储

| 技术 | 版本 | 说明 |
|------|------|------|
| Zustand | ^5.0.1 | 状态管理 |
| Dexie | ^4.0.9 | IndexedDB 封装 |

### 开发工具

| 技术 | 版本 | 说明 |
|------|------|------|
| @vitejs/plugin-react | ^4.3.3 | Vite React 插件 |
| @types/react | ^18.3.12 | React 类型 |
| @types/react-dom | ^18.3.1 | React DOM 类型 |

---

## 共享包

### @novel-reader/core

| 技术 | 版本 | 说明 |
|------|------|------|
| jschardet | 待安装 | 编码检测 |

### @novel-reader/shared

（暂无额外依赖）

---

## 包管理

| 技术 | 版本 | 说明 |
|------|------|------|
| pnpm | ^9.0.0 | 包管理器 |

---

## 开发环境

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | 运行环境 |
| Git | >= 2.0 | 版本控制 |

---

## 配置文件

### Vite 配置

```javascript
// apps/web/vite.config.js
{
  plugins: [react()],
  resolve: {
    alias: {
      '@': './src',
      '@core': '../../packages/core/src',
      '@shared': '../../packages/shared/src',
    },
  },
}
```

### Tailwind 配置

```javascript
// apps/web/tailwind.config.js
{
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
}
```

---

## 版本更新记录

| 日期 | 变更 |
|------|------|
| 2025-12-02 | 初始化技术栈 |
