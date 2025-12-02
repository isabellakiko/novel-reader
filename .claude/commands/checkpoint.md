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
- 更新 `docs/development/web/troubleshooting.md`
- 添加问题描述、原因、解决方案

### 组件开发场景
如果新增了组件：
- 更新 `docs/development/web/components.md`
- 添加组件的 Props、用途、示例

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
