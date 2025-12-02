# 前端组件文档

> apps/web 组件索引与使用说明

**最后更新**: 2025-12-02

---

## 组件目录

```
src/components/
├── ui/             # 基础 UI 组件
├── reader/         # 阅读器组件
├── search/         # 搜索组件
└── bookshelf/      # 书架组件
```

---

## 基础 UI 组件 (ui/)

> 基于 Radix UI 封装的无样式可定制组件

### Button（待开发）

```jsx
// 用途：通用按钮组件
// Props:
//   - variant: 'primary' | 'secondary' | 'ghost'
//   - size: 'sm' | 'md' | 'lg'
//   - disabled: boolean
```

### Modal（待开发）

```jsx
// 用途：弹窗组件，基于 Radix Dialog
// Props:
//   - open: boolean
//   - onOpenChange: (open) => void
//   - title: string
```

### Slider（待开发）

```jsx
// 用途：滑块组件，用于字体大小等设置
// Props:
//   - value: number
//   - onChange: (value) => void
//   - min: number
//   - max: number
```

---

## 阅读器组件 (reader/)

> 阅读器页面相关组件

### ReaderView（待开发）
- 文本渲染区域
- 支持虚拟滚动

### ChapterNav（待开发）
- 章节导航侧边栏
- 目录树展示

### SettingsPanel（待开发）
- 字体设置面板
- 主题切换

---

## 搜索组件 (search/)

> 全局搜索相关组件

### SearchInput（待开发）
- 搜索输入框
- 支持正则切换

### SearchResults（待开发）
- 搜索结果列表
- 按章节分组展示

---

## 书架组件 (bookshelf/)

> 书架页面相关组件

### BookCard（待开发）
- 书籍卡片
- 显示封面、进度

### BookUploader（待开发）
- 文件上传组件
- 支持拖拽

---

## 组件开发规范

### 文件结构

```
components/ui/Button/
├── Button.jsx      # 组件实现
├── Button.test.jsx # 测试（可选）
└── index.js        # 导出
```

### 必须包含

1. **Props 类型说明**（JSDoc 注释）
2. **默认 Props**
3. **className 支持**（可合并外部样式）

### 示例

```jsx
/**
 * Button 组件
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'} props.variant - 按钮样式
 * @param {'sm'|'md'|'lg'} props.size - 按钮大小
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} props.className - 额外样式类
 * @param {React.ReactNode} props.children - 子元素
 */
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## 更新记录

| 日期 | 组件 | 变更 |
|------|------|------|
| 2025-12-02 | - | 初始化文档结构 |
