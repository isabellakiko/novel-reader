# 开发规范文档

> 项目开发规范、代码风格、目录约定

**最后更新**: 2025-12-04

---

## 目录结构

```
novel-reader/
├── apps/
│   ├── web/                    # React 前端应用
│   │   ├── src/
│   │   │   ├── components/     # 组件
│   │   │   │   ├── ui/         # 基础 UI 组件
│   │   │   │   ├── reader/     # 阅读器组件
│   │   │   │   ├── search/     # 搜索组件
│   │   │   │   └── layout/     # 布局组件
│   │   │   ├── pages/          # 页面组件
│   │   │   ├── hooks/          # 自定义 hooks
│   │   │   ├── stores/         # Zustand 状态
│   │   │   ├── services/       # API 服务层
│   │   │   ├── workers/        # Web Workers
│   │   │   ├── lib/            # 工具库
│   │   │   └── styles/         # 样式相关
│   │   └── public/
│   │       └── fonts/          # 阅读字体
│   │
│   └── server/                 # Spring Boot 后端
│       └── src/main/
│           ├── java/com/novelreader/
│           │   ├── controller/ # REST 控制器
│           │   ├── service/    # 业务服务
│           │   ├── repository/ # 数据仓库
│           │   ├── entity/     # JPA 实体
│           │   ├── dto/        # 数据传输对象
│           │   ├── security/   # 安全认证
│           │   ├── config/     # 配置类
│           │   └── exception/  # 异常处理
│           └── resources/
│               ├── db/migration/ # Flyway 迁移
│               └── application*.yml
│
├── packages/
│   ├── core/                   # 核心逻辑（前后端共享）
│   │   └── src/
│   │       ├── parser/         # 文件解析
│   │       ├── search/         # 搜索算法
│   │       └── types/          # 类型定义
│   └── shared/                 # 共享工具
│       └── src/
│           ├── constants/      # 常量
│           └── utils/          # 工具函数
│
└── docs/                       # 文档
```

---

## 前端代码规范

### 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `BookCard.jsx` |
| 工具函数 | camelCase | `formatDate.js` |
| 常量文件 | camelCase | `themes.js` |
| CSS/样式 | kebab-case | `book-card.css` |
| Hooks | camelCase，use 前缀 | `useTheme.js` |
| Store | camelCase | `reader.js` |
| 页面 | PascalCase | `Library.jsx` |

### 组件结构

```jsx
// 推荐的组件结构
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * 组件描述
 * @param {Object} props
 * @param {string} props.className - 额外样式
 */
function ComponentName({ prop1, prop2, className }) {
  // 1. hooks
  const [state, setState] = useState()

  // 2. 计算值
  const computed = useMemo(() => {}, [])

  // 3. 事件处理
  const handleClick = () => {}

  // 4. 渲染
  return (
    <div className={cn('base-class', className)}>
      {/* content */}
    </div>
  )
}

export default ComponentName
```

### 样式规范

- 优先使用 Tailwind CSS
- 复杂样式抽取为组件
- 使用 `cn()` 合并 class（clsx + tailwind-merge）

```jsx
// 推荐
<div className={cn(
  'px-4 py-2 rounded-lg',
  isActive && 'bg-blue-500',
  className
)}>
```

### 状态管理

```javascript
// stores/reader.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useReaderStore = create(
  persist(
    (set, get) => ({
      // 状态
      fontSize: 16,
      theme: 'light',

      // 动作
      setFontSize: (size) => set({ fontSize: size }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'reader-storage',
    }
  )
)

export default useReaderStore
```

### 状态分类

| 类型 | 存储方式 | 示例 |
|------|----------|------|
| UI 状态 | useState | 弹窗开关、hover 状态 |
| 页面状态 | Zustand | 阅读设置、主题 |
| 持久化数据 | Dexie (IndexedDB) | 书籍、进度、书签 |
| 用户认证 | Zustand + persist | Token、用户信息 |

---

## 后端代码规范

### 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | PascalCase | `BookController` |
| 方法名 | camelCase | `findByUserId` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 包名 | 全小写 | `com.novelreader.service` |
| 数据库表 | snake_case | `reading_progress` |
| 数据库列 | snake_case | `chapter_index` |

### 控制器结构

```java
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ApiResponse<Page<BookDTO>> getBooks(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        return ApiResponse.success(
            bookService.findByUser(user.getId(), pageable)
        );
    }

    @PostMapping("/upload")
    public ApiResponse<BookDTO> uploadBook(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(
            bookService.uploadBook(user.getId(), file),
            "上传成功"
        );
    }
}
```

### 服务层结构

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;

    public Page<BookDTO> findByUser(Long userId, Pageable pageable) {
        return bookRepository.findByUserId(userId, pageable)
            .map(this::toDTO);
    }

    @Transactional
    public BookDTO uploadBook(Long userId, MultipartFile file) {
        // 业务逻辑
    }

    private BookDTO toDTO(Book book) {
        // 转换逻辑
    }
}
```

### 实体结构

```java
@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
public class Book extends BaseEntity {

    @Column(nullable = false)
    private String title;

    private String author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL)
    private List<Chapter> chapters = new ArrayList<>();
}
```

### API 响应格式

```java
// 统一响应格式
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}

// 错误响应
{
  "success": false,
  "message": "错误信息",
  "code": "ERROR_CODE"
}
```

---

## 路径别名

### 前端

```javascript
// vite.config.js 已配置
'@'       → 'src/'
'@core'   → 'packages/core/src'
'@shared' → 'packages/shared/src'
```

使用示例：
```javascript
import { Button } from '@/components/ui/Button'
import { parseBook } from '@core/parser'
import { THEMES } from '@shared/constants'
```

---

## Git 提交规范

```
<type>(<scope>): <subject>

type:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- refactor: 重构
- perf: 性能优化
- test: 测试
- chore: 构建/工具

scope: web | server | core | shared | docs
```

示例：
```bash
feat(web): 添加书架页面布局
fix(core): 修复 GBK 编码检测问题
feat(server): 添加书籍上传 API
docs: 更新开发规范文档
```

---

## 常用命令

### 前端开发

```bash
# 开发
pnpm dev                    # 启动开发服务器（前端）
pnpm --filter web dev       # 指定启动前端

# 构建
pnpm --filter web build     # 构建生产版本
ANALYZE=true pnpm --filter web build  # 带分析的构建

# 依赖管理
pnpm add <pkg> --filter web
```

### 后端开发

```bash
# 开发
cd apps/server
./gradlew bootRun           # 启动开发服务器

# 构建
./gradlew build             # 构建 JAR
./gradlew test              # 运行测试

# 数据库
./gradlew flywayMigrate     # 运行迁移
./gradlew flywayClean       # 清理数据库（慎用）
```

### Monorepo 命令

```bash
# 安装依赖
pnpm install

# 全局构建
pnpm build

# 运行核心包测试
pnpm --filter @novel-reader/core test
```

---

## 开发环境

### 前端
- Node.js >= 18
- pnpm >= 9.0

### 后端
- Java 21
- Gradle 8.12
- PostgreSQL 16+（生产）/ H2（开发）

### 工具
- Git >= 2.0
- VS Code（推荐）
- IntelliJ IDEA（后端推荐）

---

## 文档索引

### 前端文档
- [组件文档](./web/components.md)
- [页面文档](./web/pages.md)
- [问题排查](./web/troubleshooting.md)

### 后端文档
- [API 文档](./backend/api.md)
- [数据库设计](./backend/database.md)

### 核心模块
- [核心模块文档](./core/modules.md)
