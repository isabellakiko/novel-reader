---
description: 恢复项目记忆，快速进入开发状态
argument-hint: [--full | --bug | --component | --backend | --api]
allowed-tools: Read, Bash(date)
---

<task>
恢复项目上下文，让 AI 快速理解项目状态，准备开始开发。
</task>

<workflow>

## Step 0: 获取当前时间（必须）

运行以下命令获取时间信息：

```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)
CURRENT_WEEK_NUM=$(date +%V)
echo "当前时间: $CURRENT_DATE $CURRENT_TIME (第 $CURRENT_WEEK_NUM 周)"
```

## Step 1: 解析参数

根据用户输入的参数确定读取范围：

| 参数 | 读取文档 | 场景 |
|------|----------|------|
| 无参数 / `--quick` | CONTEXT.md + CURRENT.md | 日常快速启动 |
| `--full` | 全部核心文档 | 首次使用或长时间未开发 |
| `--bug` | + troubleshooting.md | Bug 修复场景 |
| `--component` | + components.md | 前端组件开发场景 |
| `--backend` | + backend/*.md | 后端开发场景 |
| `--api` | + api.md + database.md | API 开发场景 |

## Step 2: 读取核心文档（必读）

**必读文档**（所有模式）：
1. `docs/ai-context/CONTEXT.md` - 项目快照
2. `docs/ai-context/CURRENT.md` - 当前进度

## Step 3: 根据参数读取额外文档

### --full 模式（完整启动）
额外读取：
- `docs/project/vision.md` - 项目愿景
- `docs/project/design.md` - 功能设计
- `docs/architecture/OVERVIEW.md` - 架构总览
- `docs/architecture/tech-stack.md` - 技术栈详情
- `docs/architecture/adr/README.md` - ADR 索引

### --bug 模式（Bug 修复）
额外读取：
- `docs/development/web/troubleshooting.md`

### --component 模式（前端组件开发）
额外读取：
- `docs/development/web/components.md`
- `docs/development/web/pages.md`

### --backend 模式（后端开发）
额外读取：
- `docs/development/backend/api.md` - API 文档
- `docs/development/backend/database.md` - 数据库设计

### --api 模式（API 开发）
额外读取：
- `docs/development/backend/api.md` - API 文档
- `docs/development/backend/database.md` - 数据库设计

## Step 4: 验证理解并输出

输出格式：

```
✅ 已恢复上下文

## 验证理解

1. **项目类型**: [从 CONTEXT.md 获取]
2. **当前阶段**: [从 CONTEXT.md 获取]
3. **技术栈**:
   - 前端: React 18 + Vite + Tailwind CSS + Zustand + Dexie
   - 后端: Spring Boot 3.4.5 + Java 21 + JWT + PostgreSQL/H2
4. **下一步任务**: [从 CURRENT.md 获取 P0 任务]
5. **设计原则**: [从 CONTEXT.md 协作偏好获取]

## 本次读取的文档
- [x] CONTEXT.md
- [x] CURRENT.md
- [根据参数列出其他文档]

---

**已恢复上下文。当前阶段：[Phase X]，下一步：[任务]。**
**我们从哪里开始？**
```

</workflow>
