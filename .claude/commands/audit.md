---
description: 项目健康检查，代码质量、依赖、文档同步
argument-hint: [--quick | --full | --security | --docs]
allowed-tools: Read, Glob, Grep, Bash(date), Bash(git status), Bash(git log), Bash(tree), Bash(find), Bash(wc), Bash(pnpm list), Bash(pnpm outdated), Bash(pnpm audit), Bash(./mvnw)
---

<task>
执行项目全面健康检查，包括代码质量、依赖健康、文档同步，生成审计报告并提供优化建议。
</task>

<workflow>

## Step 0: 获取基本信息

```bash
echo "📅 审计时间: $(date '+%Y-%m-%d %H:%M') (第 $(date +%V) 周)"
echo "📂 项目: $(basename $(pwd))"
echo ""
echo "=== 最近提交 ==="
git log --oneline -5
```

## Step 1: 解析参数

| 参数 | 审计范围 | 耗时预估 |
|------|----------|----------|
| `--quick` | Git 状态 + 文档日期检查 | 1-2 分钟 |
| 无参数 | 标准检查（代码 + 依赖 + 文档） | 5-8 分钟 |
| `--full` | 完整检查（含构建测试） | 10-15 分钟 |
| `--security` | 安全漏洞 + 敏感信息扫描 | 3-5 分钟 |
| `--docs` | 深度文档同步审计 | 5-10 分钟 |

---

## Step 2: 项目结构探索

### 2.1 代码结构统计

```bash
echo "=== 前端代码统计 ==="
find apps/web/src -name "*.jsx" -o -name "*.js" 2>/dev/null | wc -l
echo "组件数:"
find apps/web/src/components -name "*.jsx" 2>/dev/null | wc -l
echo "页面数:"
find apps/web/src/pages -name "*.jsx" 2>/dev/null | wc -l
echo "Store 数:"
find apps/web/src/stores -name "*.js" 2>/dev/null | wc -l

echo ""
echo "=== 后端代码统计 ==="
find apps/server/src -name "*.java" 2>/dev/null | wc -l
echo "Controller 数:"
find apps/server/src -name "*Controller.java" 2>/dev/null | wc -l
echo "Service 数:"
find apps/server/src -name "*Service.java" 2>/dev/null | wc -l
echo "Entity 数:"
find apps/server/src -name "*.java" -path "*/entity/*" 2>/dev/null | wc -l
```

### 2.2 文档结构统计

```bash
echo "=== 文档统计 ==="
find docs -name "*.md" 2>/dev/null | wc -l
echo ""
echo "按目录分布:"
find docs -name "*.md" -exec dirname {} \; 2>/dev/null | sort | uniq -c
```

---

## Step 3: 代码质量检查

### 3.1 TODO/FIXME 统计

```bash
echo "=== TODO/FIXME 统计 ==="
echo "前端:"
grep -rn "TODO\|FIXME" apps/web/src packages/ --include="*.js" --include="*.jsx" 2>/dev/null || echo "无"
echo ""
echo "后端:"
grep -rn "TODO\|FIXME" apps/server/src --include="*.java" 2>/dev/null || echo "无"
```

### 3.2 console.log 残留检查

```bash
echo "=== console.log 检查 ==="
grep -rn "console\.log" apps/web/src --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "// DEBUG" || echo "无残留"
```

### 3.3 编译检查

```bash
echo "=== 前端类型检查 ==="
cd apps/web && pnpm build --mode development 2>&1 | tail -10

echo ""
echo "=== 后端编译检查 ==="
cd apps/server && ./mvnw compile 2>&1 | tail -10
```

---

## Step 4: 依赖健康检查

### 4.1 前端依赖

```bash
echo "=== 前端过时依赖 ==="
cd apps/web && pnpm outdated 2>&1 || true

echo ""
echo "=== 前端安全漏洞 ==="
cd apps/web && pnpm audit 2>&1 || true
```

### 4.2 版本一致性检查

读取以下文件对比版本：
- `apps/web/package.json`
- `apps/server/pom.xml`
- `docs/architecture/tech-stack.md`

检查项：
- React 版本是否一致
- Spring Boot 版本是否一致
- 其他主要依赖版本

---

## Step 5: 文档同步审计（核心）

### 5.1 过时内容检测

读取并分析以下文档：

**CONTEXT.md 检查项**：
- [ ] 项目阶段是否与 ROADMAP.md 一致？
- [ ] 技术栈描述是否与 package.json/pom.xml 一致？
- [ ] 目录结构是否与实际一致？
- [ ] 核心模块列表是否完整？

**ROADMAP.md 检查项**：
- [ ] 进度百分比是否准确？
- [ ] 已完成的 Step 是否都打勾了？
- [ ] 里程碑状态是否正确？

**vision.md 检查项**：
- [ ] "非目标"中是否有已实现的功能？
- [ ] 功能优先级列表是否更新？
- [ ] 成功指标是否标注达成状态？

**OVERVIEW.md 检查项**：
- [ ] 架构图是否反映当前架构？
- [ ] 是否包含后端架构（如果有）？
- [ ] 技术选型表是否完整？

**DEVELOPMENT.md 检查项**：
- [ ] 目录结构是否与实际一致？
- [ ] 是否包含后端开发规范？
- [ ] 常用命令是否正确？

### 5.2 重复内容检测

检查以下内容是否在多处重复：

| 内容类型 | 检查位置 |
|----------|----------|
| 技术栈列表 | CONTEXT.md, tech-stack.md, OVERVIEW.md |
| 目录结构 | CONTEXT.md, DEVELOPMENT.md, OVERVIEW.md |
| API 端点 | CONTEXT.md, api.md |
| 功能列表 | CONTEXT.md, vision.md, ROADMAP.md |
| 进度状态 | CONTEXT.md, CURRENT.md, ROADMAP.md |

### 5.3 缺失内容检测

对比代码和文档：

**前端组件文档**：
```bash
echo "=== 实际组件 vs 文档组件 ==="
echo "实际组件列表:"
find apps/web/src/components -name "*.jsx" -exec basename {} .jsx \; 2>/dev/null | sort

# 然后读取 docs/development/web/components.md 对比
```

**后端 API 文档**：
```bash
echo "=== 实际 Controller vs 文档 API ==="
echo "实际 Controller:"
find apps/server/src -name "*Controller.java" -exec basename {} .java \; 2>/dev/null | sort

# 然后读取 docs/development/backend/api.md 对比
```

**Store 文档**：
```bash
echo "=== 实际 Store ==="
find apps/web/src/stores -name "*.js" -exec basename {} .js \; 2>/dev/null | sort

# 对比 CONTEXT.md 中的 Store 列表
```

### 5.4 日期检查

```bash
echo "=== 文档最后更新日期 ==="
for f in docs/ai-context/*.md docs/architecture/*.md docs/project/*.md docs/development/*.md; do
  if [ -f "$f" ]; then
    DATE=$(grep -m1 "最后更新" "$f" 2>/dev/null | head -1)
    echo "$f: $DATE"
  fi
done
```

### 5.5 链接有效性检查

检查文档中的内部链接是否有效：
- 相对路径链接是否存在目标文件
- 锚点链接是否有效

---

## Step 6: Slash Commands 检查

读取 `.claude/commands/` 下所有命令，检查：

- [ ] /start 的参数是否与当前文档结构匹配
- [ ] /checkpoint 是否能正确更新 CURRENT.md
- [ ] /end 是否能正确生成提交
- [ ] 所有命令的 allowed-tools 是否合理

---

## Step 7: 生成审计报告

输出格式：

```markdown
# 📋 项目审计报告

**审计时间**: YYYY-MM-DD HH:MM
**审计模式**: [quick/标准/full/security/docs]
**项目**: [项目名]

---

## 📊 总览

| 维度 | 状态 | 评分 |
|------|------|------|
| 代码质量 | ✅/⚠️/❌ | X/100 |
| 依赖健康 | ✅/⚠️/❌ | X/100 |
| 文档同步 | ✅/⚠️/❌ | X/100 |
| **综合评分** | - | **X/100** |

---

## 🔴 过时内容（需立即修复）

| 文件 | 问题 | 当前值 | 应改为 |
|------|------|--------|--------|
| vision.md | "非目标"包含已实现功能 | ❌ 云同步 | ✅ 已实现 |
| OVERVIEW.md | 架构描述过时 | 纯前端 | 全栈架构 |
| ... | ... | ... | ... |

---

## 🟡 重复内容（建议优化）

| 内容 | 出现位置 | 建议 |
|------|----------|------|
| 技术栈列表 | CONTEXT.md, tech-stack.md, OVERVIEW.md | 保留 tech-stack.md，其他引用 |
| 目录结构 | CONTEXT.md, DEVELOPMENT.md | 保留 DEVELOPMENT.md，其他简化 |
| ... | ... | ... |

---

## 🟢 缺失内容（可选补充）

| 模块/功能 | 文档位置 | 优先级 |
|-----------|----------|--------|
| EmptyState 组件 | components.md | 低 |
| animations.js | 无 | 低 |
| ... | ... | ... |

---

## 📅 日期过旧的文档

| 文件 | 最后更新 | 距今天数 |
|------|----------|----------|
| design.md | 2025-12-02 | X 天 |
| ... | ... | ... |

---

## 🔧 代码质量问题

### TODO/FIXME
| 文件 | 行号 | 内容 |
|------|------|------|
| ... | ... | ... |

### console.log 残留
| 文件 | 行号 |
|------|------|
| ... | ... |

---

## 📦 依赖问题

### 可更新依赖
| 包名 | 当前版本 | 最新版本 | 类型 |
|------|----------|----------|------|
| ... | ... | ... | major/minor/patch |

### 安全漏洞
| 包名 | 严重程度 | 描述 |
|------|----------|------|
| ... | ... | ... |

---

## 🎯 行动建议（优先级排序）

### 🔴 立即处理 (Critical)
1. [具体建议 1]
2. [具体建议 2]

### 🟡 本周完成 (High)
1. [具体建议 3]
2. [具体建议 4]

### 🟢 下周计划 (Medium)
1. [具体建议 5]

### ⚪ 可选优化 (Low)
1. [具体建议 6]

---

## 下一步

确认后我将执行以上优化，预计：
- 修改 X 个文件
- 新增 X 个文件
- 删除 X 个文件

是否继续执行？[Y/n]
```

---

## Step 8: 执行优化（需用户确认）

在用户确认 "Y" 或 "继续" 后：

### 8.1 更新过时文档

按优先级顺序修复：
1. 修正与代码不符的描述
2. 更新功能状态（待完成 → 已完成）
3. 更新非目标列表

### 8.2 精简重复内容

- 保留单一真相来源
- 其他位置改为链接引用
- 添加"详见 [文档名]"提示

### 8.3 补充缺失内容

- 为新组件添加文档条目
- 为新 API 添加文档
- 更新模块列表

### 8.4 更新日期

所有修改的文件更新 `最后更新` 日期

---

## Step 9: 提交变更

```bash
git add docs/ .claude/
git commit -m "docs: 项目审计优化 - [简要描述]

## 修复的问题
- [问题1]
- [问题2]

## 优化的内容
- [优化1]
- [优化2]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

</workflow>

<checklist>

## Quick 模式检查清单

- [ ] Git 是否有未提交的更改？
- [ ] CONTEXT.md 项目阶段是否正确？
- [ ] CURRENT.md 是否更新？
- [ ] 各文档日期是否过旧（>7天）？

## 标准模式额外检查

- [ ] 前端依赖是否有过时版本？
- [ ] 后端是否能正常编译？
- [ ] 组件数量与文档是否一致？
- [ ] API 数量与文档是否一致？

## Full 模式额外检查

- [ ] 前端构建是否成功？
- [ ] 后端构建是否成功？
- [ ] 构建产物大小是否合理？
- [ ] 所有测试是否通过？

## Docs 模式深度检查

- [ ] 每个文档的每个章节是否准确？
- [ ] 所有代码示例是否可运行？
- [ ] 所有链接是否有效？
- [ ] 是否有遗漏的新功能？

## Security 模式检查

- [ ] 是否有硬编码的密钥/密码？
- [ ] .env 是否在 .gitignore 中？
- [ ] 依赖是否有已知漏洞？
- [ ] API 是否有认证保护？

</checklist>

<tips>

## 使用示例

```bash
# 快速检查（每天/提交前）
/audit --quick

# 标准检查（每周）
/audit

# 完整审计（大版本后）
/audit --full

# 深度文档审计（Phase 完成后）
/audit --docs

# 安全检查（上线前）
/audit --security
```

## 最佳实践

1. **每次完成 Phase 后**: `/audit --full`
2. **每周一次**: `/audit`
3. **每天提交前**: `/audit --quick`
4. **上线前**: `/audit --security`

## 常见问题处理

**Q: 发现大量过时内容怎么办？**
A: 优先处理 CONTEXT.md 和 ROADMAP.md，这两个是 AI 上下文恢复的核心。

**Q: 重复内容如何决定保留哪个？**
A: 按专门性原则：技术栈保留 tech-stack.md，API 保留 api.md，通用信息保留 CONTEXT.md。

**Q: 审计太慢怎么办？**
A: 使用 `--quick` 模式，只检查最关键的同步问题。

</tips>
