---
description: 项目健康检查，代码质量、依赖、文档同步
argument-hint: [--quick | --full | --security | --backend]
allowed-tools: Read, Bash(date, git, pnpm, find, grep, wc, curl, ./gradlew)
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
| 无参数 | 标准检查（前后端） | 5-10 分钟 |
| `--full` | 全部检查（含构建性能测试） | 10-15 分钟 |
| `--security` | 重点安全漏洞扫描 | 3-5 分钟 |
| `--backend` | 仅后端检查 | 3-5 分钟 |

## Step 2: 前端代码质量检查

### 2.1 未使用依赖检查

```bash
cd apps/web
pnpm exec depcheck 2>&1 || echo "depcheck 未安装或检查失败"
```

### 2.2 代码 TODO/FIXME 统计

```bash
echo "=== 前端 TODO/FIXME 统计 ==="
grep -r "TODO\|FIXME" apps/web packages/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l
```

## Step 3: 后端代码质量检查

### 3.1 Java TODO/FIXME 统计

```bash
echo "=== 后端 TODO/FIXME 统计 ==="
grep -r "TODO\|FIXME" apps/server/src --include="*.java" 2>/dev/null | wc -l
```

### 3.2 Gradle 构建检查（--full 或 --backend 模式）

```bash
cd apps/server
echo "检查 Gradle 构建..."
./gradlew build --dry-run 2>&1 | tail -5
```

### 3.3 后端编译检查

```bash
cd apps/server
./gradlew compileJava 2>&1 | tail -10
```

## Step 4: 依赖健康检查

### 4.1 前端依赖

```bash
cd apps/web
pnpm outdated 2>&1 || true
pnpm audit 2>&1 || true
```

### 4.2 后端依赖（--full 或 --backend 模式）

```bash
cd apps/server
./gradlew dependencies --configuration runtimeClasspath 2>&1 | head -30
```

### 4.3 tech-stack.md 版本一致性

读取 `docs/architecture/tech-stack.md`，对比：
- `apps/web/package.json` 前端依赖版本
- `apps/server/build.gradle` 后端依赖版本

## Step 5: 性能指标追踪（--full 模式）

### 5.1 前端构建性能测试

```bash
cd apps/web
echo "开始前端构建..."
time pnpm build 2>&1
du -sh dist 2>/dev/null || echo "未找到构建产物"
```

### 5.2 后端构建性能测试

```bash
cd apps/server
echo "开始后端构建..."
time ./gradlew build -x test 2>&1 | tail -5
```

## Step 6: 文档同步检查

### 6.1 前端组件文档完整性

```bash
ACTUAL_COMPONENTS=$(find apps/web/src/components -name "*.jsx" 2>/dev/null | wc -l)
echo "实际前端组件数: $ACTUAL_COMPONENTS"
```

### 6.2 后端 API 文档完整性

```bash
ACTUAL_CONTROLLERS=$(find apps/server/src -name "*Controller.java" 2>/dev/null | wc -l)
echo "实际 Controller 数: $ACTUAL_CONTROLLERS"
```

对比 `docs/development/backend/api.md` 中记录的 API 数量。

### 6.3 CONTEXT.md 准确性

检查 CONTEXT.md 中的：
- 项目阶段是否与实际一致
- 前后端技术栈版本是否准确
- 下一步任务是否与 CURRENT.md 一致

## Step 7: Git 状态检查

```bash
echo "=== Git 状态 ==="
git status --short | wc -l

WEEK_START=$(date -v-$(( $(date +%u) - 1 ))d +%Y-%m-%d 2>/dev/null)
git log --since="$WEEK_START" --oneline 2>/dev/null | wc -l
```

## Step 8: 生成审计报告

创建报告文件：`docs/reports/audit-${CURRENT_DATE}.md`

```markdown
# 项目健康度审计报告

**审计时间**: ${CURRENT_DATE} ${CURRENT_TIME}（第 ${CURRENT_WEEK_NUM} 周）
**审计模式**: [--quick | 标准 | --full | --security | --backend]

---

## 1️⃣ 前端代码质量 [✅优秀 | ⚠️良好 | ❌需改进]

| 指标 | 结果 | 状态 |
|------|------|------|
| 未使用依赖 | X 个 | ✅/⚠️ |
| TODO/FIXME | X 个 | ✅/⚠️ |
| 组件数 | X 个 | - |

---

## 2️⃣ 后端代码质量 [✅优秀 | ⚠️良好 | ❌需改进]

| 指标 | 结果 | 状态 |
|------|------|------|
| 编译状态 | 成功/失败 | ✅/❌ |
| TODO/FIXME | X 个 | ✅/⚠️ |
| Controller 数 | X 个 | - |

---

## 3️⃣ 依赖健康 [✅优秀 | ⚠️良好 | ❌需改进]

| 层级 | 总依赖 | 可更新 | 安全漏洞 |
|------|--------|--------|----------|
| 前端 | X | X | X |
| 后端 | X | X | X |

---

## 4️⃣ 文档同步 [✅完整 | ⚠️需更新 | ❌缺失严重]

| 文档 | 状态 | 说明 |
|------|------|------|
| components.md | ✅/⚠️ | X/Y 已文档化 |
| api.md | ✅/⚠️ | X 个 API 已文档化 |
| database.md | ✅/⚠️ | [准确/需更新] |
| CONTEXT.md | ✅/⚠️ | [准确/需更新] |

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

### 下周计划 (Medium)
1. [建议 3]
```

## Step 9: 输出摘要

```
## 📋 审计完成

**时间**: ${CURRENT_DATE} ${CURRENT_TIME}
**模式**: [--quick | 标准 | --full | --security | --backend]

### 快速摘要
- **前端代码质量**: [✅/⚠️/❌]
- **后端代码质量**: [✅/⚠️/❌]
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
