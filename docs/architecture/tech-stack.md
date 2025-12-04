# 技术栈详情

> Novel Reader 完整技术栈版本与配置

**最后更新**: 2025-12-04

---

## 前端（apps/web）

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| React | ^18.3.1 | UI 框架 |
| React DOM | ^18.3.1 | React 渲染器 |
| Vite | ^5.4.10 | 构建工具 |

### 路由

| 技术 | 版本 | 说明 |
|------|------|------|
| react-router-dom | ^7.9.6 | 前端路由 |

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
| @radix-ui/react-collapsible | ^1.1.1 | 折叠面板 |
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

### HTTP 客户端

| 技术 | 版本 | 说明 |
|------|------|------|
| Axios | ^1.7.9 | HTTP 请求库 |

### 虚拟滚动

| 技术 | 版本 | 说明 |
|------|------|------|
| react-window | ^1.8.10 | 虚拟滚动列表 |

### 开发工具

| 技术 | 版本 | 说明 |
|------|------|------|
| @vitejs/plugin-react | ^4.3.3 | Vite React 插件 |
| vite-plugin-pwa | ^0.21.1 | PWA 支持 |
| @types/react | ^18.3.12 | React 类型 |
| @types/react-dom | ^18.3.1 | React DOM 类型 |

---

## 后端（apps/server）

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.4.5 | 应用框架 |
| Java | 21 | 编程语言 |
| Gradle | 8.12 | 构建工具 |

### Web & API

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Web | - | REST API |
| Spring Validation | - | 参数验证 |
| SpringDoc OpenAPI | 2.7.0 | Swagger 文档 |

### 安全认证

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Security | - | 安全框架 |
| JJWT | 0.12.6 | JWT 库 |
| BCrypt | - | 密码哈希 |

### 数据库

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Data JPA | - | ORM 框架 |
| Hibernate | - | JPA 实现 |
| PostgreSQL | 16+ | 生产数据库 |
| H2 | 2.3.232 | 开发数据库 |
| Flyway | - | 数据库迁移 |

### 工具库

| 技术 | 版本 | 说明 |
|------|------|------|
| Lombok | - | 代码简化 |
| MapStruct | 1.6.3 | DTO 映射 |

### 监控

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Actuator | - | 健康检查 |

---

## 共享包

### @novel-reader/core

核心解析和搜索逻辑，无外部依赖，纯 JavaScript。

| 模块 | 文件 | 说明 |
|------|------|------|
| 编码检测 | parser/encoding.js | GBK/UTF-8/Big5 检测转换 |
| TXT 解析 | parser/txt-parser.js | 完整解析流程 |
| 章节识别 | parser/chapter-detector.js | 10+ 格式支持 |
| 搜索引擎 | search/search-engine.js | 4 种搜索模式 |
| 类型定义 | types/book.js | Book 数据结构 |

### @novel-reader/shared

共享工具和常量（暂无额外依赖）。

| 模块 | 说明 |
|------|------|
| constants | 共享常量 |
| utils | 工具函数 |

---

## 包管理

| 技术 | 版本 | 说明 |
|------|------|------|
| pnpm | ^9.0.0 | 包管理器 |
| pnpm workspace | - | Monorepo 支持 |

---

## 开发环境

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | 前端运行环境 |
| Java | 21 | 后端运行环境 |
| Git | >= 2.0 | 版本控制 |

---

## 配置文件

### Vite 配置

```javascript
// apps/web/vite.config.js
{
  plugins: [react(), VitePWA({...})],
  resolve: {
    alias: {
      '@': './src',
      '@core': '../../packages/core/src',
      '@shared': '../../packages/shared/src',
    },
  },
  worker: {
    format: 'es',
  },
}
```

### Tailwind 配置

```javascript
// apps/web/tailwind.config.js
{
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
      },
      colors: {
        // 自定义主题色
      }
    },
  },
}
```

### Spring Boot 配置

```yaml
# apps/server/src/main/resources/application.yml
spring:
  profiles:
    active: dev
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000  # 24 小时
```

---

## 本地存储 Schema

### IndexedDB (Dexie v4)

```javascript
// stores/db.js
db.version(4).stores({
  books: 'id, title, author, importedAt',
  readingProgress: 'bookId',
  bookContents: 'bookId',
  bookmarks: '++id, bookId, createdAt',
  readingStats: '++id, bookId, date, [bookId+date]',
})
```

### 表说明

| 表名 | 主键 | 说明 |
|------|------|------|
| books | id | 书籍元数据 |
| bookContents | bookId | 书籍正文（大文本分离） |
| readingProgress | bookId | 阅读进度 |
| bookmarks | ++id | 书签 |
| readingStats | ++id | 阅读统计 |

---

## 后端数据库 Schema

### PostgreSQL / H2

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| books | 书籍表 |
| chapters | 章节表 |
| reading_progress | 阅读进度表 |
| bookmarks | 书签表 |

详见 [数据库文档](../development/backend/database.md)

---

## 版本更新记录

| 日期 | 变更 |
|------|------|
| 2025-12-04 | 添加后端技术栈 |
| 2025-12-04 | 添加 Axios |
| 2025-12-04 | 更新 IndexedDB Schema (v4) |
| 2025-12-02 | 添加 react-router-dom, react-window |
| 2025-12-02 | 添加 @radix-ui/react-collapsible |
| 2025-12-02 | 初始化技术栈 |
