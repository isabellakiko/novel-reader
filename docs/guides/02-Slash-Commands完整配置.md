# Slash Commands 完整配置

> 6 个核心命令的完整 .md 文件内容 - 可直接复制到 `.claude/commands/` 目录使用

**文档性质**: 配置参考（直接复制使用）
**版本**: v2.0
**命令数量**: 6 个

---

## 目录

1. [命令总览](#1-命令总览)
2. [/start - 恢复项目记忆](#2-start---恢复项目记忆)
3. [/checkpoint - 阶段性保存](#3-checkpoint---阶段性保存)
4. [/end - 每日结束](#4-end---每日结束)
5. [/weekly - 每周优化](#5-weekly---每周优化)
6. [/monthly - 每月归档](#6-monthly---每月归档)
7. [/audit - 项目健康检查](#7-audit---项目健康检查)
8. [安装说明](#8-安装说明)

---

## 1. 命令总览

| 命令 | 文件 | 用途 | 常用参数 |
|------|------|------|----------|
| `/start` | start.md | 恢复项目记忆 | `--full`, `--bug`, `--api` |
| `/checkpoint` | checkpoint.md | 阶段性保存进度 | `--commit`, `--skip-git` |
| `/end` | end.md | 每日结束 | `--push`, `--no-push` |
| `/weekly` | weekly.md | 每周文档优化 | `--push` |
| `/monthly` | monthly.md | 每月归档 | `--push` |
| `/audit` | audit.md | 项目健康检查 | `--quick`, `--full`, `--security` |

---

## 2. /start - 恢复项目记忆

> 文件路径: `.claude/commands/start.md`

```markdown
---
description: 恢复项目记忆，快速进入开发状态
argument-hint: [--full | --bug | --api | --component | --deploy]
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
| `--api` | + api.md + database.md | API 开发场景 |
| `--component` | + components.md | 组件开发场景 |
| `--deploy` | + DEPLOYMENT.md | 部署场景 |

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
- `docs/architecture/adr/README.md` - ADR 索引

### --bug 模式（Bug 修复）
额外读取：
- `docs/development/frontend/troubleshooting.md`
- `docs/development/backend/troubleshooting.md`

### --api 模式（API 开发）
额外读取：
- `docs/development/backend/api.md`
- `docs/development/backend/database.md`

### --component 模式（组件开发）
额外读取：
- `docs/development/frontend/components.md`
- `docs/development/frontend/pages.md`

### --deploy 模式（部署）
额外读取：
- `docs/project/DEPLOYMENT.md`

## Step 4: 验证理解并输出

输出格式：

```
✅ 已恢复上下文

## 验证理解

1. **项目类型**: [从 CONTEXT.md 获取]
2. **当前阶段**: [从 CONTEXT.md 获取]
3. **技术栈**: [前端框架] + [后端框架] + [数据库]
4. **下一步任务**: [从 CURRENT.md 获取 P0 任务]
5. **设计原则**: [从 CONTEXT.md 协作偏好获取]

## 本次读取的文档
- [x] CONTEXT.md
- [x] CURRENT.md
- [根据参数列出其他文档]

---

**已恢复上下文。当前阶段：[Phase X.Y]，下一步：[任务]。**
**我们从哪里开始？**
```

</workflow>
```

---

## 3. /checkpoint - 阶段性保存

> 文件路径: `.claude/commands/checkpoint.md`

```markdown
---
description: 阶段性保存开发进度，更新文档
argument-hint: [--commit | --skip-git]
allowed-tools: Read, Write, Edit, Bash(date, git)
---

<task>
完成一个功能/阶段后，更新开发文档，可选创建 Git commit。
</task>

<workflow>

## Step 0: 获取当前时间（必须）

```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)

# 获取星期
case $(date +%u) in
    1) DAY_NAME="周一" ;; 2) DAY_NAME="周二" ;;
    3) DAY_NAME="周三" ;; 4) DAY_NAME="周四" ;;
    5) DAY_NAME="周五" ;; 6) DAY_NAME="周六" ;;
    7) DAY_NAME="周日" ;;
esac

echo "当前时间: $CURRENT_DATE $CURRENT_TIME ($DAY_NAME)"
```

## Step 1: 总结当前工作

整理本阶段完成的工作：

1. **完成的工作**：列出已完成的功能/任务
2. **遇到的问题**：记录遇到的问题和解决方案
3. **剩余工作**：还需要完成的内容
4. **技术亮点**：值得记录的技术方案（如果有）

## Step 2: 更新 CURRENT.md

### 2.1 读取 CURRENT.md
```bash
# 读取当前内容
cat docs/ai-context/CURRENT.md
```

### 2.2 判断是否需要新增 Day 条目

检查今天（$CURRENT_DATE）是否已有 Day X 条目：
- **如果没有**：添加新的 Day X 条目
- **如果已有**：在该条目中追加本阶段工作内容

### 2.3 更新内容

在 Day X 条目中添加：
```markdown
### Day X - ${CURRENT_DATE}（${DAY_NAME}）⭐ [标题]

**工作时长**: Xh
**核心任务**: [任务描述]

**完成工作**：
- ✅ [工作内容 1]
- ✅ [工作内容 2]

**技术亮点**：
- [亮点描述]

**遇到的问题**：
- **问题**: [问题描述]
- **解决方案**: [解决方案]
```

### 2.4 更新任务列表

在"本周任务"部分，将已完成的任务标记为 ✅

## Step 3: 场景性更新（根据工作内容自动判断）

### Bug 修复场景
如果本次工作是修复 Bug：
- 创建或更新 `docs/development/[frontend|backend]/troubleshooting.md`
- 添加问题描述、原因、解决方案

### 组件开发场景
如果新增了组件：
- 更新 `docs/development/frontend/components.md`
- 添加组件的 Props、用途、示例

### API 开发场景
如果新增了 API：
- 更新 `docs/development/backend/api.md`
- 添加端点、请求/响应格式

## Step 4: Git 操作

### 参数处理
- `--commit`：自动创建 commit（不 push）
- `--skip-git`：跳过 Git 操作
- 无参数：询问用户是否需要 commit

### 创建 commit（如果需要）

```bash
# 检查是否有变更
git status --short

# 添加变更
git add docs/

# 创建 commit
git commit -m "$(cat <<'EOF'
docs: checkpoint - [简短描述本次工作]

- [工作内容 1]
- [工作内容 2]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Step 5: 输出检查点报告

```
## ✅ Checkpoint 完成

**时间**: ${CURRENT_DATE} ${CURRENT_TIME}

### 本阶段完成
- [工作内容 1]
- [工作内容 2]

### 更新的文档
- [x] CURRENT.md
- [根据场景列出其他更新的文档]

### Git 状态
- [ ] Commit 已创建 / 已跳过
- [ ] 未推送到远程

### 下一步
[根据 CURRENT.md 中的任务列表建议下一步]

---
继续开发，还是需要休息一下？
```

</workflow>
```

---

## 4. /end - 每日结束

> 文件路径: `.claude/commands/end.md`

```markdown
---
description: 每日开发结束，完整更新文档并提交
argument-hint: [--push | --no-push | --archive]
allowed-tools: Read, Write, Edit, Bash(date, git)
---

<task>
每日开发结束时，完整总结工作，更新文档，创建 commit 并可选推送。
</task>

<workflow>

## Step 0: 获取当前时间（必须）

```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)
CURRENT_DAY=$(date +%d)

# 判断明天是否是下月第一天（用于归档判断）
# macOS
NEXT_DAY=$(date -v+1d +%d)
# Linux: NEXT_DAY=$(date -d tomorrow +%d)

if [ "$NEXT_DAY" == "01" ]; then
    NEED_ARCHIVE=true
    echo "提示：明天是新月份第一天，建议执行归档"
else
    NEED_ARCHIVE=false
fi

echo "当前时间: $CURRENT_DATE $CURRENT_TIME"
```

## Step 1: 总结本次会话

完整总结今天的工作：

1. **所有完成的工作**：列出今天完成的所有功能/任务
2. **遇到的问题和解决方案**：记录所有问题
3. **未完成的工作**：记录未完成的内容
4. **下次会话建议**：建议下次从哪里开始

## Step 2: 更新文档（完整更新）

### 2.1 更新 CURRENT.md

如果今天已经执行过 `/checkpoint`，补充完善内容。
如果没有执行过，创建完整的 Day X 条目。

更新内容：
- Day X 日志（完整版）
- 本周任务状态（标记完成的任务）
- 技术亮点（如果有新的）
- 问题与解决方案（如果有新的）

### 2.2 场景性文档更新

根据今天的工作内容，更新相关文档：
- Bug 修复 → troubleshooting.md
- 新组件 → components.md
- 新 API → api.md
- 新页面 → pages.md

### 2.3 检查是否需要更新 CONTEXT.md

如果今天有重大变化（如完成了一个 Phase、技术栈变更等）：
- 更新 CONTEXT.md 的"当前开发状态"
- 更新"下一步任务"

## Step 3: Git 操作（智能 commit）

### 3.1 检查今天是否已有 checkpoint commit

```bash
LAST_COMMIT_DATE=$(git log -1 --format=%cd --date=short 2>/dev/null || echo "")
LAST_COMMIT_MSG=$(git log -1 --format=%s 2>/dev/null || echo "")

echo "最新 commit: $LAST_COMMIT_DATE - $LAST_COMMIT_MSG"
```

### 3.2 决定 commit 策略

- 如果今天已有 checkpoint commit → 使用 `git commit --amend`
- 如果没有 → 创建新的 commit

### 3.3 创建 commit

```bash
# 添加所有变更
git add .

# 创建 commit（或 amend）
git commit -m "$(cat <<'EOF'
docs: 每日总结 ${CURRENT_DATE}

## 今日完成
- [工作内容 1]
- [工作内容 2]

## 技术亮点
- [亮点]

## 下次继续
- [待续任务]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 3.4 推送处理

根据参数：
- `--push`：自动推送 `git push`
- `--no-push`：不推送
- 无参数：询问用户是否需要推送

## Step 4: 归档判断（仅月末）

如果 `NEED_ARCHIVE=true` 或用户指定 `--archive`：

提示用户：
```
⚠️ 检测到明天是新月份，建议执行归档：
- 执行 /monthly 进行归档
- 或在明天开始时执行
```

## Step 5: 输出完成报告

```
## ✅ 每日总结完成

**日期**: ${CURRENT_DATE} ${CURRENT_TIME}

### 今日完成
- [工作内容 1]
- [工作内容 2]
- [工作内容 3]

### 遇到的问题
- [问题 1]: [解决方案]

### 更新的文档
- [x] CURRENT.md
- [其他更新的文档]

### Git 状态
- [x] Commit 已创建
- [ ] 已推送 / 未推送

### 下次会话建议
1. 执行 `/start` 恢复上下文
2. 继续 [任务名称]
3. [其他建议]

---
辛苦了！明天见 👋
```

</workflow>
```

---

## 5. /weekly - 每周优化

> 文件路径: `.claude/commands/weekly.md`

```markdown
---
description: 每周文档优化，删除冗余，统计周报
argument-hint: [--push | --no-push]
allowed-tools: Read, Write, Edit, Bash(date, git, wc)
---

<task>
每周（建议周日）执行，优化文档，删除冗余内容，生成周报。
</task>

<workflow>

## Step 0: 获取当前时间（必须）

```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)
CURRENT_WEEK_NUM=$(date +%V)

# 获取本周起止日期（macOS）
WEEK_START=$(date -v-$(( $(date +%u) - 1 ))d +%Y-%m-%d)
WEEK_END=$(date -v+$(( 7 - $(date +%u) ))d +%Y-%m-%d)

# Linux 版本:
# WEEK_START=$(date -d "last monday" +%Y-%m-%d)
# WEEK_END=$(date -d "next sunday" +%Y-%m-%d)

echo "第 $CURRENT_WEEK_NUM 周: $WEEK_START - $WEEK_END"
```

## Step 1: 审查 CURRENT.md

### 1.1 读取并分析

```bash
# 统计行数（估算 Token，每行约 10 tokens）
wc -l docs/ai-context/CURRENT.md
```

### 1.2 识别冗余内容

检查以下冗余类型：
- **重复日志**：相同内容出现多次
- **过度详细**：包含完整代码片段、过长的描述
- **已完成任务**：仍在"本周任务"中但已标记 ✅ 的过期任务
- **过时信息**：不再相关的技术亮点或问题

### 1.3 优化 CURRENT.md

执行优化：
1. 删除重复内容
2. 压缩过度详细的日志（保留关键信息）
3. 清理已完成的任务
4. 更新"本周时间"为下周

## Step 2: 审查其他文档

### 2.1 troubleshooting 文档
- 检查是否有已修复且不再相关的问题
- 检查是否有重复的问题记录

### 2.2 components.md / api.md
- 检查是否与代码同步（是否有遗漏或过时）

### 2.3 CONTEXT.md
- 检查"当前状态"是否准确
- 检查"下一步任务"是否需要更新

## Step 3: Token 优化报告

```bash
# 统计优化前后的行数
echo "=== Token 优化报告 ==="
echo "CURRENT.md: $(wc -l < docs/ai-context/CURRENT.md) 行"
echo "CONTEXT.md: $(wc -l < docs/ai-context/CONTEXT.md) 行"
```

计算优化效果：
- 优化前 Token（估算）
- 优化后 Token
- 节省百分比

## Step 4: 更新 CONTEXT.md

如果本周有显著进展：
1. 更新"当前开发状态"
2. 更新"下一步任务"（P1 → P2 任务流转）
3. 更新"最后更新"时间

## Step 5: 统计本周工作

```bash
# 统计本周 commits
git log --since="$WEEK_START" --until="$WEEK_END 23:59:59" --oneline | wc -l
```

汇总：
- 本周工作时长
- 本周 commits 数
- 完成的功能/任务数
- 修复的 Bug 数

## Step 6: Git 操作

```bash
git add docs/
git commit -m "$(cat <<'EOF'
docs: 第 ${CURRENT_WEEK_NUM} 周优化

## 优化内容
- 清理 CURRENT.md 冗余内容
- 更新文档同步状态
- Token 优化: [X]% 减少

## 本周统计
- Commits: [X] 次
- 完成功能: [X] 个

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

根据参数决定是否推送。

## Step 7: 输出周报

```
## 📊 第 ${CURRENT_WEEK_NUM} 周周报

**周期**: ${WEEK_START} - ${WEEK_END}
**生成时间**: ${CURRENT_DATE} ${CURRENT_TIME}

---

### 本周完成
- [功能 1]
- [功能 2]
- [功能 3]

### 本周统计
| 指标 | 数值 |
|------|------|
| 工作时长 | Xh |
| Commits | X 次 |
| 新增功能 | X 个 |
| Bug 修复 | X 个 |

### Token 优化
| 文档 | 优化前 | 优化后 | 节省 |
|------|--------|--------|------|
| CURRENT.md | ~X tokens | ~X tokens | X% |

### 下周计划
1. [任务 1]
2. [任务 2]

---
周报已生成，继续加油！💪
```

</workflow>
```

---

## 6. /monthly - 每月归档

> 文件路径: `.claude/commands/monthly.md`

```markdown
---
description: 每月归档 CURRENT.md，创建新月份模板
argument-hint: [--push | --no-push]
allowed-tools: Read, Write, Edit, Bash(date, git, cp, wc)
---

<task>
每月初执行，归档上月 CURRENT.md，创建新月份模板，全面审查文档。
</task>

<workflow>

## Step 0: 获取当前时间（必须）

```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)
CURRENT_MONTH=$(date +%Y-%m)
CURRENT_WEEK_NUM=$(date +%V)

# 获取上月信息（用于归档命名）
# macOS
LAST_MONTH=$(date -v-1m +%Y-%m)
# Linux: LAST_MONTH=$(date -d "last month" +%Y-%m)

echo "当前月份: $CURRENT_MONTH"
echo "归档月份: $LAST_MONTH"
```

## Step 1: 归档 CURRENT.md

### 1.1 复制到归档目录

```bash
# 创建归档目录（如果不存在）
mkdir -p docs/ai-context/archive

# 复制当前 CURRENT.md 到归档
cp docs/ai-context/CURRENT.md "docs/ai-context/archive/${LAST_MONTH}.md"

echo "已归档到: docs/ai-context/archive/${LAST_MONTH}.md"
```

### 1.2 创建新月份 CURRENT.md

创建新的 CURRENT.md 模板：

```markdown
# 当前开发进度（滚动日志）

> 本周/本月开发进度记录 - AI 了解最近完成了什么

**本周时间**: ${NEW_WEEK_START} - ${NEW_WEEK_END}（第 ${CURRENT_WEEK_NUM} 周）
**最后更新**: ${CURRENT_DATE} ${CURRENT_TIME}
**当前阶段**: [从 CONTEXT.md 获取]

---

## 本周概览

**Week ${CURRENT_WEEK_NUM}**: ${NEW_WEEK_START} - ${NEW_WEEK_END}

**本周目标**：
- [ ] [目标 1]
- [ ] [目标 2]

**本周完成**：
- （待更新）

---

## Day-by-Day 开发日志

（新月份开始，待记录）

---

## 本周任务

### P0（Critical）
- [ ] [从 CONTEXT.md 迁移]

### P1（High）
- [ ] [从 CONTEXT.md 迁移]

### P2（Medium）
- [ ] [待添加]

---

## 技术亮点

（本月待记录）

---

## 遇到的问题与解决方案

（本月待记录）

---

## 下周计划

### 优先级 1
1. [任务 1]
2. [任务 2]

---

**更新频率**: 每次 /checkpoint 或 /end 自动更新
**归档机制**: 每月归档到 archive/YYYY-MM.md
```

## Step 2: 更新 CONTEXT.md

### 2.1 更新项目阶段
如果上月完成了某个 Phase，更新阶段信息。

### 2.2 更新代码统计（可选）
```bash
# 统计代码行数
find apps/ -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.java" -o -name "*.py" | xargs wc -l 2>/dev/null | tail -1
```

### 2.3 更新下月任务
从"优先级 2"提升到"优先级 1"

## Step 3: 审查所有文档（彻底）

### 3.1 文档清单检查

检查以下文档是否存在且有效：
- [ ] docs/ai-context/CONTEXT.md
- [ ] docs/ai-context/CURRENT.md
- [ ] docs/development/DEVELOPMENT.md
- [ ] docs/development/frontend/components.md
- [ ] docs/development/frontend/pages.md
- [ ] docs/development/frontend/troubleshooting.md
- [ ] docs/development/backend/api.md
- [ ] docs/development/backend/database.md
- [ ] docs/development/backend/troubleshooting.md
- [ ] docs/architecture/OVERVIEW.md
- [ ] docs/architecture/tech-stack.md
- [ ] docs/architecture/adr/README.md
- [ ] docs/project/vision.md
- [ ] docs/project/design.md
- [ ] docs/project/ROADMAP.md

### 3.2 tech-stack.md 版本检查

对比 tech-stack.md 与 package.json（或 pom.xml / requirements.txt）：
- 检查版本是否一致
- 标记需要更新的依赖

### 3.3 文档链接检查

检查文档中的内部链接是否有效。

## Step 4: 清理 archive 目录

```bash
# 列出归档文件
ls -la docs/ai-context/archive/

# 检查超过 6 个月的归档
```

如果有超过 6 个月的归档：
- 建议压缩或删除
- 或保留但不再日常引用

## Step 5: Token 成本总报告

```bash
echo "=== 月度 Token 报告 ==="
echo "CONTEXT.md: $(wc -l < docs/ai-context/CONTEXT.md) 行"
echo "CURRENT.md: $(wc -l < docs/ai-context/CURRENT.md) 行"
echo "归档文件数: $(ls docs/ai-context/archive/*.md 2>/dev/null | wc -l)"
```

## Step 6: Git 操作

```bash
git add docs/
git commit -m "$(cat <<'EOF'
docs: ${CURRENT_MONTH} 月度归档

## 归档内容
- 归档 ${LAST_MONTH} 月 CURRENT.md
- 创建 ${CURRENT_MONTH} 月新模板
- 更新 CONTEXT.md

## 文档审查
- 所有文档已检查
- tech-stack.md 版本已核对

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

根据参数决定是否推送（推荐 `--push`）。

## Step 7: 输出月报

```
## 📅 ${CURRENT_MONTH} 月度归档完成

**归档时间**: ${CURRENT_DATE} ${CURRENT_TIME}

---

### 归档操作
- [x] ${LAST_MONTH} 月 CURRENT.md → archive/${LAST_MONTH}.md
- [x] 创建 ${CURRENT_MONTH} 月新 CURRENT.md
- [x] 更新 CONTEXT.md

### 文档健康状态
| 检查项 | 状态 |
|--------|------|
| 核心文档完整性 | ✅ |
| tech-stack 版本一致性 | ✅ / ⚠️ 需更新 |
| 文档链接有效性 | ✅ |

### Token 统计
| 文档 | 行数 | 估算 Token |
|------|------|------------|
| CONTEXT.md | X 行 | ~X tokens |
| CURRENT.md | X 行 | ~X tokens |

### archive 状态
- 归档文件数: X 个
- 最早归档: YYYY-MM
- 建议清理: [是/否]

### 下月重点
1. [任务 1]
2. [任务 2]

---
新的一月，新的开始！🚀
```

</workflow>
```

---

## 7. /audit - 项目健康检查

> 文件路径: `.claude/commands/audit.md`

```markdown
---
description: 项目健康检查，代码质量、依赖、文档同步
argument-hint: [--quick | --full | --security]
allowed-tools: Read, Bash(date, git, npm/yarn/pnpm, find, grep, wc)
---

<task>
执行项目健康检查，生成审计报告，识别问题并提供建议。
</task>

<workflow>

## Step 0: 获取当前时间和项目信息（必须）

```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)
CURRENT_WEEK_NUM=$(date +%V)

echo "审计时间: $CURRENT_DATE $CURRENT_TIME (第 $CURRENT_WEEK_NUM 周)"
```

### 检测包管理器

```bash
# 检测使用的包管理器
if [ -f "pnpm-lock.yaml" ]; then
    PM="pnpm"
elif [ -f "yarn.lock" ]; then
    PM="yarn"
elif [ -f "bun.lockb" ]; then
    PM="bun"
else
    PM="npm"
fi
echo "包管理器: $PM"
```

## Step 1: 解析参数

| 参数 | 检查范围 | 预计时间 |
|------|----------|----------|
| `--quick` | 代码质量 + Git 状态 | 2-3 分钟 |
| 无参数 | 标准检查（不含性能测试） | 5-10 分钟 |
| `--full` | 全部检查（含构建性能测试） | 10-15 分钟 |
| `--security` | 重点安全漏洞扫描 | 3-5 分钟 |

## Step 2: 代码质量检查

### 2.1 ESLint 检查（前端）

```bash
# 进入前端目录
cd apps/frontend

# 运行 ESLint
$PM run lint 2>&1 || true

# 统计 errors 和 warnings
echo "ESLint 检查完成"
```

### 2.2 未使用依赖检查

```bash
# 使用 depcheck（需要先安装）
cd apps/frontend
$PM exec depcheck 2>&1 || echo "depcheck 未安装或检查失败"
```

### 2.3 代码 TODO/FIXME 统计

```bash
# 统计代码中的 TODO 和 FIXME
echo "=== TODO/FIXME 统计 ==="
grep -r "TODO\|FIXME" apps/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.java" --include="*.py" 2>/dev/null | wc -l
```

## Step 3: 依赖健康检查

### 3.1 过时依赖统计

```bash
cd apps/frontend
$PM outdated 2>&1 || true
```

### 3.2 安全漏洞扫描

```bash
cd apps/frontend
$PM audit 2>&1 || true
```

### 3.3 tech-stack.md 版本一致性

读取 `docs/architecture/tech-stack.md` 和 `package.json`（或 pom.xml），对比版本。

## Step 4: 性能指标追踪（--full 模式）

### 4.1 构建性能测试

```bash
cd apps/frontend
echo "开始构建性能测试..."
time $PM run build 2>&1
```

### 4.2 产物大小统计

```bash
# 统计构建产物大小
du -sh apps/frontend/dist 2>/dev/null || du -sh apps/frontend/.next 2>/dev/null || echo "未找到构建产物"
```

## Step 5: 文档同步检查

### 5.1 组件文档完整性

```bash
# 统计实际组件数
ACTUAL_COMPONENTS=$(find apps/frontend/src/components -name "*.jsx" -o -name "*.tsx" 2>/dev/null | wc -l)

# 统计文档中的组件数（从 components.md 读取）
echo "实际组件数: $ACTUAL_COMPONENTS"
```

对比 `docs/development/frontend/components.md` 中记录的组件数。

### 5.2 API 文档完整性

检查 `docs/development/backend/api.md` 是否覆盖所有 API 端点。

### 5.3 CONTEXT.md 准确性

检查 CONTEXT.md 中的：
- 项目阶段是否与实际一致
- 技术栈版本是否准确
- 下一步任务是否与 CURRENT.md 一致

## Step 6: Git 状态检查

```bash
echo "=== Git 状态 ==="
# 未提交文件统计
git status --short | wc -l

# 本周 commits 统计
WEEK_START=$(date -v-$(( $(date +%u) - 1 ))d +%Y-%m-%d 2>/dev/null || date -d "last monday" +%Y-%m-%d)
git log --since="$WEEK_START" --oneline | wc -l
```

## Step 7: 生成审计报告

创建报告文件：`docs/reports/audit-${CURRENT_DATE}.md`

```markdown
# 项目健康度审计报告

**审计时间**: ${CURRENT_DATE} ${CURRENT_TIME}（第 ${CURRENT_WEEK_NUM} 周）
**审计模式**: [--quick | 标准 | --full | --security]

---

## 1️⃣ 代码质量 [✅优秀 | ⚠️良好 | ❌需改进]

| 指标 | 结果 | 状态 |
|------|------|------|
| ESLint errors | X 个 | ✅/❌ |
| ESLint warnings | X 个 | ✅/⚠️ |
| 未使用依赖 | X 个 | ✅/⚠️ |
| TODO/FIXME | X 个 | ✅/⚠️ |

**评分**: XX/100

---

## 2️⃣ 依赖健康 [✅优秀 | ⚠️良好 | ❌需改进]

| 指标 | 结果 | 状态 |
|------|------|------|
| 总依赖数 | X 个 | - |
| 可更新 (Major) | X 个 | ⚠️ |
| 可更新 (Minor) | X 个 | 📝 |
| 可更新 (Patch) | X 个 | 📝 |
| 安全漏洞 (Critical) | X 个 | ✅/❌ |
| 安全漏洞 (High) | X 个 | ✅/❌ |

**建议更新**:
- [依赖名]: X.X.X → Y.Y.Y (原因)

---

## 3️⃣ 性能指标 [✅优秀 | ⚠️良好 | ❌需改进]

| 指标 | 结果 | 基准 | 状态 |
|------|------|------|------|
| 构建时间 | Xs | <5s | ✅/⚠️ |
| 产物大小 | XMB | <3MB | ✅/⚠️ |

---

## 4️⃣ 文档同步 [✅完整 | ⚠️需更新 | ❌缺失严重]

| 文档 | 状态 | 说明 |
|------|------|------|
| components.md | ✅/⚠️ | X/Y 已文档化 |
| api.md | ✅/⚠️ | X/Y 已文档化 |
| tech-stack.md | ✅/⚠️ | X 个版本不一致 |
| CONTEXT.md | ✅/⚠️ | [准确/需更新] |

**遗漏文档**:
- [组件/API 名称]

---

## 5️⃣ Git 状态

| 指标 | 结果 |
|------|------|
| 未提交文件 | X 个 |
| 本周 commits | X 次 |

---

## 📊 综合健康度评分

**总评**: XX/100 [✅优秀 | ⚠️良好 | ❌需改进]

---

## 🎯 行动建议（优先级排序）

### 立即处理 (Critical)
1. [建议 1]

### 本周完成 (High)
1. [建议 2]
2. [建议 3]

### 下周计划 (Medium)
1. [建议 4]

---

**报告路径**: docs/reports/audit-${CURRENT_DATE}.md
```

## Step 8: 输出摘要

```
## 📋 审计完成

**时间**: ${CURRENT_DATE} ${CURRENT_TIME}
**模式**: [--quick | 标准 | --full | --security]

### 快速摘要
- **代码质量**: [✅/⚠️/❌] XX/100
- **依赖健康**: [✅/⚠️/❌]
- **文档同步**: [✅/⚠️/❌]
- **综合评分**: XX/100

### 需要关注
- [Critical 级别的问题]

### 报告位置
docs/reports/audit-${CURRENT_DATE}.md

---
详细报告已生成，是否需要我解释某个部分？
```

</workflow>
```

---

## 8. 安装说明

### 8.1 快速安装

```bash
# 1. 创建目录
mkdir -p .claude/commands

# 2. 创建命令文件
# 从本文档复制每个命令的内容到对应文件：
# - .claude/commands/start.md
# - .claude/commands/checkpoint.md
# - .claude/commands/end.md
# - .claude/commands/weekly.md
# - .claude/commands/monthly.md
# - .claude/commands/audit.md
```

### 8.2 验证安装

在 Claude Code 中测试：

```bash
/start --full
```

应该看到 AI 读取文档并输出验证报告。

### 8.3 注意事项

1. **时间命令兼容性**
   - macOS 使用 `date -v` 语法
   - Linux 使用 `date -d` 语法
   - 命令中已标注两种写法

2. **包管理器检测**
   - 命令会自动检测 npm/yarn/pnpm/bun
   - 根据 lock 文件判断

3. **路径约定**
   - 前端应用：`apps/frontend/`
   - 后端应用：`apps/backend/`
   - 文档目录：`docs/`

---

**版本**: v2.0
**更新日期**: 2025-11-26
