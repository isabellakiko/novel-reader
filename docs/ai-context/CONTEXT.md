# 项目上下文（AI 快速恢复）

> AI 协作记忆文件 - 快速恢复项目上下文，立即开始工作

**最后更新**: 2025-12-02
**项目阶段**: Phase 2 - 基础搭建
**当前状态**: 开发环境已就绪，待开发核心解析模块

---

## TL;DR（30秒速览）

**项目名称**: Novel Reader（小说阅读器）
**项目性质**: 本地小说阅读器，纯前端实现，Monorepo 架构
**技术栈**: React 18 + Vite + Tailwind CSS + Zustand + IndexedDB (Dexie)
**核心特点**:
- 多格式支持（TXT 多编码、EPUB、PDF）
- 强大的全局搜索（按角色/章节分组、高亮跳转）
- 精美现代的 UI（Framer Motion 动画）

**开发进度**: Step 1-2 完成，Step 3 待开发
**下一步**: 实现 `packages/core` 的 TXT 解析功能

---

## 项目本质

这是一个 **本地小说阅读器**，主要功能：

- **文件解析**：TXT（GBK/UTF-8 等多编码自动检测）、EPUB、PDF
- **全局搜索**：全文关键词搜索，按章节分组，高亮跳转（核心功能）
- **阅读体验**：字体设置、主题切换（白天/夜间/护眼）、进度记忆
- **本地书架**：书籍导入管理，IndexedDB 持久化存储

**设计理念**:
- 纯前端实现，Web Worker 处理大文件搜索
- 99% 小说文件 <50MB，纯前端完全够用
- 预留后端扩展能力（apps/server）

---

## 当前开发状态

### ✅ 已完成

- Step 1: Monorepo 基础结构（pnpm workspace）
- Step 2: Vite + React + 依赖配置（Tailwind、Framer Motion、Radix UI 等）

### 🚧 进行中

- AI 协作系统配置（4 层文档架构 + Slash Commands）

### 📋 待开始

- Step 3: 核心解析模块（packages/core）
- Step 4: 基础布局 + 主题系统
- Step 5: 书架页面
- Step 6: 阅读器页面
- Step 7: 全局搜索功能

---

## 技术栈

### 前端（apps/web）
- **框架**: React 18
- **构建工具**: Vite 5
- **语言**: JavaScript（不用 TypeScript）
- **样式**: Tailwind CSS v3 + clsx + tailwind-merge
- **动画**: Framer Motion
- **图标**: Lucide React
- **UI 组件**: Radix UI（Dialog、Dropdown、Slider 等）
- **状态管理**: Zustand
- **本地存储**: Dexie (IndexedDB)
- **后台任务**: Web Worker

### 共享包
- **@novel-reader/core**: 核心逻辑（解析、搜索）
- **@novel-reader/shared**: 共享工具和常量

### 开发工具
- **包管理**: pnpm
- **版本控制**: Git

---

## 目录结构

```
novel-reader/
├── apps/
│   ├── web/                # React 前端应用
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
实现 TXT 文件解析功能（packages/core）

### 优先级 1（本周）
1. 编码检测模块（encoding.js）
2. TXT 解析器（txt-parser.js）
3. 章节识别（chapter-detector.js）

### 优先级 2（下周）
1. 基础布局框架
2. 主题系统（白天/夜间/护眼）

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
