# 数据库设计文档

> Novel Reader 后端数据库结构

**最后更新**: 2025-12-04
**数据库**: PostgreSQL (生产) / H2 (开发)
**ORM**: Spring Data JPA + Hibernate
**迁移工具**: Flyway

---

## ER 图

```
┌──────────────┐       ┌──────────────┐
│    users     │       │    books     │
├──────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)      │
│ username     │   │   │ user_id (FK) │◄──┐
│ email        │   │   │ title        │   │
│ password_hash│   │   │ author       │   │
│ nickname     │   │   │ file_hash    │   │
│ avatar_url   │   │   │ chapter_count│   │
│ role         │   │   │ word_count   │   │
│ enabled      │   │   │ created_at   │   │
│ created_at   │   │   │ updated_at   │   │
│ updated_at   │   │   └──────────────┘   │
└──────────────┘   │                      │
                   │   ┌──────────────┐   │
                   │   │   chapters   │   │
                   │   ├──────────────┤   │
                   │   │ id (PK)      │   │
                   │   │ book_id (FK) │◄──┤
                   │   │ chapter_index│   │
                   │   │ title        │   │
                   │   │ content      │   │
                   │   │ word_count   │   │
                   │   │ created_at   │   │
                   │   └──────────────┘   │
                   │                      │
                   │   ┌──────────────────┐
                   │   │ reading_progress │
                   │   ├──────────────────┤
                   │   │ id (PK)          │
                   └──►│ user_id (FK)     │
                       │ book_id (FK)     │◄──┤
                       │ chapter_index    │   │
                       │ scroll_position  │   │
                       │ progress_percent │   │
                       │ last_read_at     │   │
                       │ created_at       │   │
                       │ updated_at       │   │
                       └──────────────────┘   │
                                              │
                       ┌──────────────┐       │
                       │  bookmarks   │       │
                       ├──────────────┤       │
                       │ id (PK)      │       │
                   ┌──►│ user_id (FK) │       │
                   │   │ book_id (FK) │◄──────┘
                   │   │ chapter_index│
                   │   │ position     │
                   │   │ selected_text│
                   │   │ note         │
                   │   │ color        │
                   │   │ created_at   │
                   │   └──────────────┘
                   │
                   └─── users.id
```

---

## 表结构

### users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希（BCrypt） |
| nickname | VARCHAR(50) | | 昵称 |
| avatar_url | VARCHAR(500) | | 头像 URL |
| role | VARCHAR(20) | DEFAULT 'USER' | 角色（USER/ADMIN） |
| enabled | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_users_username` ON username
- `idx_users_email` ON email

---

### books（书籍表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id, NOT NULL | 所属用户 |
| title | VARCHAR(255) | NOT NULL | 书名 |
| author | VARCHAR(100) | | 作者 |
| description | TEXT | | 简介 |
| cover_url | VARCHAR(500) | | 封面 URL |
| file_hash | VARCHAR(64) | | 文件 SHA256 |
| file_size | BIGINT | | 文件大小（字节） |
| chapter_count | INT | DEFAULT 0 | 章节数 |
| word_count | BIGINT | DEFAULT 0 | 总字数 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_books_user_id` ON user_id
- `idx_books_title` ON title
- `idx_books_file_hash` ON file_hash

**约束**:
- `fk_books_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

---

### chapters（章节表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| book_id | BIGINT | FK → books.id, NOT NULL | 所属书籍 |
| chapter_index | INT | NOT NULL | 章节序号（0 开始） |
| title | VARCHAR(255) | NOT NULL | 章节标题 |
| content | TEXT | NOT NULL | 章节内容 |
| word_count | INT | DEFAULT 0 | 字数 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引**:
- `idx_chapters_book_id` ON book_id
- `idx_chapters_book_index` ON (book_id, chapter_index)

**约束**:
- `fk_chapters_book` FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
- `uq_chapters_book_index` UNIQUE (book_id, chapter_index)

---

### reading_progress（阅读进度表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户 |
| book_id | BIGINT | FK → books.id, NOT NULL | 书籍 |
| chapter_index | INT | DEFAULT 0 | 当前章节 |
| scroll_position | DOUBLE | DEFAULT 0.0 | 滚动位置（0-1） |
| progress_percent | DOUBLE | DEFAULT 0.0 | 阅读进度（%） |
| last_read_at | TIMESTAMP | DEFAULT NOW() | 最后阅读时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_progress_user_id` ON user_id
- `idx_progress_book_id` ON book_id
- `idx_progress_last_read` ON last_read_at

**约束**:
- `fk_progress_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `fk_progress_book` FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
- `uq_progress_user_book` UNIQUE (user_id, book_id)

---

### bookmarks（书签表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户 |
| book_id | BIGINT | FK → books.id, NOT NULL | 书籍 |
| chapter_index | INT | NOT NULL | 章节序号 |
| position | INT | DEFAULT 0 | 文本位置 |
| selected_text | VARCHAR(500) | | 选中文本 |
| note | TEXT | | 备注 |
| color | VARCHAR(20) | DEFAULT 'yellow' | 颜色标记 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引**:
- `idx_bookmarks_user_id` ON user_id
- `idx_bookmarks_book_id` ON book_id
- `idx_bookmarks_created_at` ON created_at

**约束**:
- `fk_bookmarks_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `fk_bookmarks_book` FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE

---

## Flyway 迁移

### 迁移文件位置

```
apps/server/src/main/resources/db/migration/
└── V1__init_schema.sql
```

### V1__init_schema.sql

初始化所有表结构，包括：
- users
- books
- chapters
- reading_progress
- bookmarks

---

## JPA 实体映射

### 继承关系

```
BaseEntity (id, createdAt, updatedAt)
    ├── User
    ├── Book
    ├── Chapter
    ├── ReadingProgress
    └── Bookmark
```

### 关联关系

| 实体 | 关联 | 类型 |
|------|------|------|
| User → Book | OneToMany | 用户的书籍 |
| Book → Chapter | OneToMany | 书籍的章节 |
| User → ReadingProgress | OneToMany | 用户的进度 |
| Book → ReadingProgress | OneToMany | 书籍的进度 |
| User → Bookmark | OneToMany | 用户的书签 |
| Book → Bookmark | OneToMany | 书籍的书签 |

---

## 开发环境配置

### H2 数据库（开发）

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:file:./data/novelreader
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true
      path: /h2-console
```

访问 H2 控制台: `http://localhost:8080/h2-console`

### PostgreSQL（生产）

```yaml
# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/novelreader
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

---

## 性能优化

### 索引策略

1. **查询优化**: 为常用查询字段创建索引
2. **复合索引**: 为组合查询创建复合索引
3. **唯一约束**: 利用唯一索引加速查找

### 大文本处理

- 章节内容（content）使用 TEXT 类型
- 考虑分表或 BLOB 存储超大文件
- 按需加载章节内容，避免全量查询

### 分页查询

- 使用 Spring Data JPA 的 Pageable
- 避免 OFFSET 大值查询，考虑 Keyset 分页

---

## 更新记录

| 日期 | 变更 |
|------|------|
| 2025-12-04 | 初始化数据库文档 |
