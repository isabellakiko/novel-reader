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

创建新的 CURRENT.md 模板，包含：
- 新的周时间范围
- 清空的 Day-by-Day 日志
- 从 CONTEXT.md 迁移的任务列表

## Step 2: 更新 CONTEXT.md

### 2.1 更新项目阶段
如果上月完成了某个 Phase，更新阶段信息。

### 2.2 更新代码统计（可选）
```bash
# 统计代码行数
find apps/ packages/ -name "*.js" -o -name "*.jsx" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1
```

### 2.3 更新下月任务
从"优先级 2"提升到"优先级 1"

## Step 3: 审查所有文档（彻底）

### 3.1 文档清单检查

检查以下文档是否存在且有效：

**AI 上下文**：
- [ ] docs/ai-context/CONTEXT.md
- [ ] docs/ai-context/CURRENT.md

**前端开发**：
- [ ] docs/development/DEVELOPMENT.md
- [ ] docs/development/web/components.md
- [ ] docs/development/web/pages.md
- [ ] docs/development/web/troubleshooting.md
- [ ] docs/development/core/modules.md

**后端开发**：
- [ ] docs/development/backend/api.md
- [ ] docs/development/backend/database.md

**架构文档**：
- [ ] docs/architecture/OVERVIEW.md
- [ ] docs/architecture/tech-stack.md
- [ ] docs/architecture/adr/README.md

**项目文档**：
- [ ] docs/project/vision.md
- [ ] docs/project/design.md
- [ ] docs/project/ROADMAP.md

### 3.2 tech-stack.md 版本检查

对比 tech-stack.md 与实际配置文件：
- `apps/web/package.json` - 前端依赖版本
- `apps/server/pom.xml` - 后端依赖版本
- 检查版本是否一致
- 标记需要更新的依赖

## Step 4: 清理 archive 目录

```bash
# 列出归档文件
ls -la docs/ai-context/archive/
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
