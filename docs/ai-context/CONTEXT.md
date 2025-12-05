# 项目上下文（AI 快速恢复）

> AI 协作记忆文件 - 快速恢复项目上下文，立即开始工作

**最后更新**: 2025-12-05
**项目阶段**: Phase 5 全部完成 ✅
**当前状态**: 1.0 版本发布

---

## TL;DR（30秒速览）

**项目名称**: Novel Reader（小说阅读器）
**项目性质**: 全栈小说阅读器，支持本地存储 + 云端同步
**架构模式**: Monorepo（前端 + 后端 + 核心包）

**技术栈**:
- **前端**: React 18 + Vite 5 + Tailwind CSS + Zustand + IndexedDB (Dexie)
- **后端**: Spring Boot 3.4.5 + Java 21 + Maven + JWT + PostgreSQL/H2
- **核心包**: 纯 JS 解析库（编码检测、章节识别、搜索引擎）

**核心特点**:
- 多编码支持（TXT GBK/UTF-8/Big5 自动检测，32MB <100ms）
- 强大的全局搜索（4 种模式：概览/详细/频率/时间线）
- 双模式存储（本地 IndexedDB + 云端同步）
- 用户认证（JWT 登录/注册）
- 精美现代的 UI（3D 书籍卡片、Framer Motion 动画）

**开发进度**: 1.0 版本已发布
**可选扩展**: 导出功能、EPUB/PDF 支持

---

## 项目本质

这是一个 **全栈小说阅读器**，主要功能：

- **文件解析**：TXT（多编码自动检测，32MB 文件 <100ms）
- **全局搜索**：4 种搜索模式，Web Worker 后台处理
- **阅读体验**：字体设置、主题切换、进度记忆、书签
- **双模式存储**：本地 IndexedDB + 云端 PostgreSQL
- **用户认证**：JWT 登录注册，多设备同步

**设计理念**:
- 离线优先，本地阅读无需网络
- 登录后可选云端同步
- 前后端完全分离，API 驱动

---

## 目录结构

```
novel-reader/
├── apps/
│   ├── web/                # React 前端应用
│   │   └── src/
│   │       ├── components/ # 24+ 组件
│   │       ├── pages/      # 7 个页面
│   │       ├── stores/     # 13 个状态存储
│   │       ├── services/   # API 服务层
│   │       ├── lib/        # 工具库
│   │       └── workers/    # Web Worker
│   └── server/             # Spring Boot 后端
│       └── src/main/java/com/novelreader/
│           ├── controller/ # 3 个控制器
│           ├── service/    # 3 个服务
│           ├── entity/     # 5 个实体
│           ├── repository/ # 5 个仓库
│           ├── security/   # JWT 认证
│           └── config/     # 配置类
├── packages/
│   ├── core/               # 核心逻辑（解析、搜索）
│   └── shared/             # 共享工具
├── docs/                   # 文档
└── .claude/commands/       # Slash Commands
```

---

## 核心模块速览

### 前端 Stores（apps/web/src/stores/）

| Store | 文件 | 职责 |
|-------|------|------|
| library | library.js | 书架管理、导入书籍 |
| reader | reader.js | 阅读器状态、设置 |
| bookmark | bookmark.js | 书签 CRUD |
| highlight | highlight.js | 文本高亮、笔记管理 |
| tags | tags.js | 标签分类、收藏管理 |
| search | search.js | 搜索状态、Worker 通信 |
| theme | theme.js | 主题切换（auto/light/dark） |
| auth | auth.js | 用户认证、Token 管理 |
| sync | sync.js | 云端同步 |
| stats | stats.js | 阅读统计 |
| toast | toast.js | 全局提示 |
| offlineQueue | offlineQueue.js | 离线操作队列 |
| db | db.js | IndexedDB Schema |

### 前端页面（apps/web/src/pages/）

| 页面 | 路由 | 功能 |
|------|------|------|
| Library | /library | 书架、导入、进度显示 |
| Reader | /reader/:bookId | 阅读、章节导航、设置 |
| Search | /search | 全局搜索、4 种模式 |
| Bookmarks | /bookmarks | 书签管理 |
| Settings | /settings | 设置、统计 |
| Login | /login | 登录 |
| Register | /register | 注册 |

### 后端控制器（apps/server/.../controller/）

| 控制器 | 路径 | 职责 |
|--------|------|------|
| AuthController | /api/auth | 登录、注册、Token 刷新、用户信息 |
| BookController | /api/books | 书籍 CRUD、上传、搜索 |
| ProgressController | /api/progress | 阅读进度、书签（/bookmarks）|

### 核心包模块（packages/core/src/）

| 模块 | 文件 | 功能 |
|------|------|------|
| 编码检测 | parser/encoding.js | GBK/UTF-8/Big5 检测转换 |
| TXT 解析 | parser/txt-parser.js | 完整解析流程 |
| 章节识别 | parser/chapter-detector.js | 10+ 格式支持 |
| 搜索引擎 | search/search-engine.js | 4 种搜索模式 |

---

## 已完成功能

### Phase 1-2: 基础 + 核心解析 ✅
- Monorepo 结构（pnpm workspace）
- TXT 多编码支持（32MB <100ms）
- 章节自动识别（10+ 格式）

### Phase 3: 前端功能 ✅
- 书架页面（3D 卡片、导入、删除、进度显示）
- 阅读器页面（章节导航、设置、书签、快捷键）
- 全局搜索（Web Worker、4 种模式、高亮跳转）
- 书签管理页面
- 主题系统（自动/白天/夜间）

### Phase 4: 后端 + 前后端对接 ✅
- Spring Boot 3 后端
- JWT 认证（24h 过期）
- 书籍/进度/书签同步 API
- 前端 API 服务层
- 登录/注册页面
- 离线检测与提示

### Phase 5: 优化完善 ✅
- 阅读设置增强（8 种背景色、4 种字体）
- 深色模式优化（系统跟随、过渡动画）
- 空状态设计（EmptyState 组件）
- 动画细节打磨（统一动画库）
- 代码分割（4 个 vendor chunks）
- 路由懒加载（7 个页面）
- 空闲时预加载
- **文本高亮和笔记功能**（5 种颜色、Markdown 导出）
- **书籍标签分类系统**（自定义标签、收藏、筛选）
- **阅读进度增强**（底部进度条、剩余时间估算）
- **数据导入导出**（完整备份恢复、选择性导入）

### 可选扩展（未实现）
- EPUB/PDF 支持

---

## 协作偏好（重要！必读）

### 开发节奏
- ✅ **每次只执行一步** - 不要一次性做太多改动
- ✅ **说明原因和目的** - 每一步都要解释为什么
- ✅ **等待确认** - 完成一步后等待用户确认

### 设计风格
- ✅ 精美、现代、动画丝滑
- ✅ 交互流畅、视觉高级
- ❌ 避免过于简陋或 generic 的设计

### Git 提交规范
```
<type>(<scope>): <subject>

type: feat | fix | docs | refactor | perf | test | chore
scope: web | server | core | shared | docs
```

---

## 快速导航

### 深入了解
- [当前进度](CURRENT.md) - 本周开发日志
- [架构总览](../architecture/OVERVIEW.md) - 系统架构
- [技术栈详情](../architecture/tech-stack.md) - 完整依赖列表
- [开发路线图](../project/ROADMAP.md) - 阶段规划

### 开发文档
- [前端组件](../development/web/components.md)
- [前端页面](../development/web/pages.md)
- [后端 API](../development/backend/api.md)
- [数据库设计](../development/backend/database.md)
- [开发规范](../development/DEVELOPMENT.md)

### 项目文档
- [项目愿景](../project/vision.md)
- [功能设计](../project/design.md)

---

## 快速恢复上下文

```bash
/start              # 快速启动（默认）
/start --full       # 完整启动（首次使用）
/start --web        # 前端开发模式
/start --api        # 后端 API 开发模式
/start --core       # 核心模块开发模式
```

---

**Token 效率**: ~2500 tokens
**更新频率**: 每周或重大变更时
