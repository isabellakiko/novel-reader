# 项目上下文（AI 快速恢复）

> AI 协作记忆文件 - 快速恢复项目上下文，立即开始工作

**最后更新**: 2025-12-02
**项目阶段**: Phase 3 - 核心功能完善
**当前状态**: 核心功能基本完成，进入优化阶段

---

## TL;DR（30秒速览）

**项目名称**: Novel Reader（小说阅读器）
**项目性质**: 本地小说阅读器，纯前端实现，Monorepo 架构
**技术栈**: React 18 + Vite 5 + Tailwind CSS + Zustand + IndexedDB (Dexie)
**核心特点**:
- 多编码支持（TXT GBK/UTF-8/Big5 自动检测）
- 强大的全局搜索（4 种模式：概览/详细/频率/时间线）
- 精美现代的 UI（3D 书籍卡片、Framer Motion 动画）
- 完整的阅读体验（进度记忆、书签、主题切换）

**开发进度**: Phase 3 进行中，核心功能已完成
**下一步**: 体验优化、更多阅读设置

---

## 项目本质

这是一个 **本地小说阅读器**，主要功能：

- **文件解析**：TXT（GBK/UTF-8 等多编码自动检测，32MB 文件 <100ms）
- **全局搜索**：4 种搜索模式，Web Worker 后台处理，高亮跳转
- **阅读体验**：字体设置、主题切换（白天/夜间/护眼）、进度记忆、书签
- **本地书架**：书籍导入管理，IndexedDB 持久化存储，阅读进度显示

**设计理念**:
- 纯前端实现，Web Worker 处理大文件搜索
- 99% 小说文件 <50MB，纯前端完全够用
- 预留后端扩展能力（apps/server）

---

## 当前开发状态

### ✅ 已完成

**Phase 1: 基础搭建**
- Step 1: Monorepo 基础结构（pnpm workspace）
- Step 2: Vite + React + 依赖配置
- AI 协作系统配置（4 层文档架构 + 6 个 Slash Commands）

**Phase 2: 核心解析模块**
- Step 3: 核心解析模块（packages/core）
  - 编码检测（GBK/UTF-8/Big5 等）
  - TXT 解析器（32MB 文件 <100ms）
  - 章节识别（10+ 种格式）

**Phase 3: 前端功能**
- Step 4: 基础布局 + 主题系统
  - 全局 Layout（Sidebar + MainContent）
  - 路由配置（React Router 7）
  - 主题系统（白天/夜间/护眼）
- Step 5: 书架页面
  - 3D 书籍卡片（悬浮旋转、8 种配色）
  - 文件上传（拖拽 + 点击）
  - IndexedDB 存储（Dexie v3）
  - 阅读进度显示
- Step 6: 阅读器页面
  - 章节导航侧边栏
  - 字体/行高/宽度设置
  - 进度自动保存（防抖 1s）
  - 书签功能
  - 键盘快捷键（← → 翻页）
- Step 7: 全局搜索功能
  - 4 种搜索模式（概览/详细/频率/时间线）
  - Web Worker 后台搜索
  - 高亮跳转定位

### 📋 待完善

- 更多阅读设置（页面背景色自定义等）
- 深色模式优化
- 性能优化（超大文件处理）
- EPUB/PDF 支持（可选）

---

## 技术栈

### 前端（apps/web）
- **框架**: React 18.3.1
- **构建工具**: Vite 5.4.10
- **语言**: JavaScript（不用 TypeScript）
- **样式**: Tailwind CSS v3 + clsx + tailwind-merge
- **动画**: Framer Motion 11
- **图标**: Lucide React
- **UI 组件**: Radix UI（Dialog、Dropdown、Slider 等）
- **状态管理**: Zustand 5
- **本地存储**: Dexie 4 (IndexedDB)
- **路由**: React Router 7
- **后台任务**: Web Worker

### 共享包
- **@novel-reader/core**: 核心逻辑（解析、搜索）
- **@novel-reader/shared**: 共享工具和常量

### 开发工具
- **包管理**: pnpm 9
- **版本控制**: Git

---

## 目录结构

```
novel-reader/
├── apps/
│   ├── web/                # React 前端应用
│   │   └── src/
│   │       ├── components/ # 9 个组件
│   │       ├── pages/      # 5 个页面
│   │       ├── stores/     # 6 个状态存储
│   │       └── workers/    # Web Worker
│   └── server/             # 后端预留
├── packages/
│   ├── core/               # 核心逻辑（解析、搜索）
│   └── shared/             # 共享工具
├── docs/
│   ├── ai-context/         # AI 记忆层
│   ├── development/        # 开发文档
│   ├── architecture/       # 架构文档
│   ├── project/            # 项目文档
│   └── guides/             # 参考指南
└── .claude/commands/       # Slash Commands
```

---

## 下一步任务

### 当前焦点
体验优化和功能完善

### 优先级 1（High）
1. 更多阅读设置选项
2. 深色模式体验优化
3. 性能监控和优化

### 优先级 2（Medium）
1. 阅读统计功能
2. 导出功能
3. 快捷键增强

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
```

---

## 快速导航

- [当前进度](CURRENT.md)
- [开发规范](../development/DEVELOPMENT.md)
- [架构总览](../architecture/OVERVIEW.md)
- [项目愿景](../project/vision.md)
- [技术栈详情](../architecture/tech-stack.md)

---

## 快速恢复上下文

```bash
/start              # 快速启动（默认）
/start --full       # 完整启动（首次使用）
/start --component  # 组件开发模式
```

---

**Token 效率**: ~2500 tokens
**更新频率**: 每周或重大变更时
