---
description: 项目健康检查，代码质量、依赖、文档同步
argument-hint: [--quick | --full | --security]
allowed-tools: Read, Bash(date, git, pnpm, find, grep, wc)
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

## Step 1: 解析参数

| 参数 | 检查范围 | 预计时间 |
|------|----------|----------|
| `--quick` | 代码质量 + Git 状态 | 2-3 分钟 |
| 无参数 | 标准检查（不含性能测试） | 5-10 分钟 |
| `--full` | 全部检查（含构建性能测试） | 10-15 分钟 |
| `--security` | 重点安全漏洞扫描 | 3-5 分钟 |

## Step 2: 代码质量检查

### 2.1 未使用依赖检查

```bash
cd apps/web
pnpm exec depcheck 2>&1 || echo "depcheck 未安装或检查失败"
```

### 2.2 代码 TODO/FIXME 统计

```bash
echo "=== TODO/FIXME 统计 ==="
grep -r "TODO\|FIXME" apps/ packages/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l
```

## Step 3: 依赖健康检查

### 3.1 过时依赖统计

```bash
cd apps/web
pnpm outdated 2>&1 || true
```

### 3.2 安全漏洞扫描

```bash
cd apps/web
pnpm audit 2>&1 || true
```

### 3.3 tech-stack.md 版本一致性

读取 `docs/architecture/tech-stack.md` 和 `apps/web/package.json`，对比版本。

## Step 4: 性能指标追踪（--full 模式）

### 4.1 构建性能测试

```bash
cd apps/web
echo "开始构建性能测试..."
time pnpm build 2>&1
```

### 4.2 产物大小统计

```bash
du -sh apps/web/dist 2>/dev/null || echo "未找到构建产物"
```

## Step 5: 文档同步检查

### 5.1 组件文档完整性

```bash
# 统计实际组件数
ACTUAL_COMPONENTS=$(find apps/web/src/components -name "*.jsx" 2>/dev/null | wc -l)
echo "实际组件数: $ACTUAL_COMPONENTS"
```

对比 `docs/development/web/components.md` 中记录的组件数。

### 5.2 CONTEXT.md 准确性

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
WEEK_START=$(date -v-$(( $(date +%u) - 1 ))d +%Y-%m-%d 2>/dev/null)
git log --since="$WEEK_START" --oneline 2>/dev/null | wc -l
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
| 未使用依赖 | X 个 | ✅/⚠️ |
| TODO/FIXME | X 个 | ✅/⚠️ |

---

## 2️⃣ 依赖健康 [✅优秀 | ⚠️良好 | ❌需改进]

| 指标 | 结果 | 状态 |
|------|------|------|
| 总依赖数 | X 个 | - |
| 可更新 (Major) | X 个 | ⚠️ |
| 安全漏洞 (Critical) | X 个 | ✅/❌ |

---

## 3️⃣ 文档同步 [✅完整 | ⚠️需更新 | ❌缺失严重]

| 文档 | 状态 | 说明 |
|------|------|------|
| components.md | ✅/⚠️ | X/Y 已文档化 |
| CONTEXT.md | ✅/⚠️ | [准确/需更新] |

---

## 4️⃣ Git 状态

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

### 下周计划 (Medium)
1. [建议 3]
```

## Step 8: 输出摘要

```
## 📋 审计完成

**时间**: ${CURRENT_DATE} ${CURRENT_TIME}
**模式**: [--quick | 标准 | --full | --security]

### 快速摘要
- **代码质量**: [✅/⚠️/❌]
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
