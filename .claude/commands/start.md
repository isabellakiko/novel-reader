---
description: 恢复项目记忆，快速进入开发状态
argument-hint: [--full | --web | --api | --core]
allowed-tools: Read, Bash(date)
---

<task>
恢复项目上下文，让 AI 快速理解项目状态，准备开始开发。

**核心原则**：
1. 最小化读取 - 默认只读极简快照
2. 按需展开 - 根据参数读取特定模块文档
3. 快速响应 - 30秒内完成上下文恢复
</task>

<workflow>

## Step 0: 获取当前时间

```bash
echo "📅 $(date '+%Y-%m-%d %H:%M') (第 $(date +%V) 周)"
```

## Step 1: 解析参数并确定读取范围

| 参数 | 读取文档 | 场景 | Token 预估 |
|------|----------|------|-----------|
| 无参数 | CONTEXT.md + CURRENT.md | 日常快速启动 | ~2000 |
| `--full` | + architecture + project | 首次/长时间未开发 | ~5000 |
| `--web` | + web/components.md + web/pages.md | 前端开发 | ~3500 |
| `--api` | + backend/api.md + backend/database.md | 后端 API 开发 | ~4000 |
| `--core` | + core/modules.md | 核心解析模块开发 | ~2500 |

## Step 2: 读取核心文档（必读）

**必读文档**（所有模式）：
1. `docs/ai-context/CONTEXT.md` - 项目快照
2. `docs/ai-context/CURRENT.md` - 当前进度

## Step 3: 根据参数读取额外文档

### --full 模式（完整启动）
额外读取：
- `docs/architecture/OVERVIEW.md` - 架构总览
- `docs/architecture/tech-stack.md` - 技术栈详情
- `docs/project/ROADMAP.md` - 开发路线图

### --web 模式（前端开发）
额外读取：
- `docs/development/web/components.md` - 组件文档
- `docs/development/web/pages.md` - 页面文档

### --api 模式（后端开发）
额外读取：
- `docs/development/backend/api.md` - API 文档
- `docs/development/backend/database.md` - 数据库设计

### --core 模式（核心模块开发）
额外读取：
- `docs/development/core/modules.md` - 核心模块文档

## Step 4: 输出验证

使用以下格式输出恢复结果：

```
✅ 已恢复上下文

## 项目理解

| 项目 | Novel Reader（全栈小说阅读器） |
|------|-------------------------------|
| 阶段 | [从 CONTEXT.md 获取] |
| 技术栈 | React 18 + Spring Boot 3 + PostgreSQL |
| 当前任务 | [从 CURRENT.md 获取] |

## 读取的文档

- [x] CONTEXT.md（项目快照）
- [x] CURRENT.md（当前进度）
- [根据参数列出其他文档]

## 开发偏好

- 每次只执行一步，说明原因
- 精美现代的 UI，动画丝滑
- Git: `<type>(<scope>): <subject>`

---

**状态**: [项目状态]
**下一步**: [建议的下一步任务]

准备好了，从哪里开始？
```

</workflow>

<tips>

## 快速启动示例

```bash
# 日常开发（最快）
/start

# 前端组件开发
/start --web

# 后端 API 开发
/start --api

# 完整上下文（首次使用）
/start --full
```

## 智能判断

如果用户在 /start 后立即提出具体问题，可以主动读取相关文档：

- 提到 "组件"、"页面"、"样式" → 读取 web 文档
- 提到 "API"、"接口"、"后端" → 读取 backend 文档
- 提到 "解析"、"编码"、"搜索" → 读取 core 文档

</tips>
