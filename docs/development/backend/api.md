# 后端 API 文档

> Novel Reader 后端 RESTful API 参考

**最后更新**: 2025-12-05
**基础路径**: `/api`
**认证方式**: JWT Bearer Token

---

## 概览

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/auth` | 登录、注册、用户信息 |
| 书籍 | `/books` | 上传、列表、详情、删除 |
| 进度 | `/progress` | 阅读进度同步 |
| 书签 | `/progress/bookmarks` | 书签管理 |

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "code": "ERROR_CODE"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5,
    "first": true,
    "last": false
  }
}
```

---

## 认证 API

### POST /auth/register

用户注册

**请求体**:
```json
{
  "username": "string (3-20字符)",
  "email": "string (邮箱格式)",
  "password": "string (6+字符)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzM4NCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    },
    "expiresIn": 86400
  }
}
```

**错误码**:
- `409` - 用户名或邮箱已存在

---

### POST /auth/login

用户登录

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**: 同注册响应

**错误码**:
- `401` - 用户名或密码错误

---

### GET /auth/me

获取当前用户信息（需认证）

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "昵称",
    "avatarUrl": null,
    "createdAt": "2025-12-04T10:00:00"
  }
}
```

---

### POST /auth/refresh

刷新 Token（需认证）

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzM4NCJ9...",
    "expiresIn": 86400
  }
}
```

**说明**:
- 前端在 Token 即将过期时（如过期前 5 分钟）调用此接口
- 返回新 Token，旧 Token 立即失效

---

## 书籍 API

### POST /books/upload

上传书籍（需认证）

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体**:
- `file`: TXT 文件

**响应**:
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "id": 1,
    "title": "书名",
    "author": "作者",
    "totalChapters": 100,
    "wordCount": 500000,
    "createdAt": "2025-12-04T10:00:00"
  }
}
```

**错误码**:
- `400` - 文件格式不支持或解析失败

---

### GET /books

获取书籍列表（需认证）

**查询参数**:
- `page`: 页码（默认 0）
- `size`: 每页数量（默认 20）

**响应**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "书名",
        "author": "作者",
        "totalChapters": 100,
        "wordCount": 500000,
        "createdAt": "2025-12-04T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

---

### GET /books/{id}

获取书籍详情（需认证）

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "书名",
    "author": "作者",
    "description": "简介",
    "totalChapters": 100,
    "wordCount": 500000,
    "chapters": [
      {
        "index": 0,
        "title": "第一章 开始",
        "wordCount": 3000
      }
    ],
    "createdAt": "2025-12-04T10:00:00"
  }
}
```

---

### GET /books/{id}/chapters/{chapterIndex}

获取章节内容（需认证）

**响应**:
```json
{
  "success": true,
  "data": {
    "index": 0,
    "title": "第一章 开始",
    "content": "章节正文内容...",
    "wordCount": 3000
  }
}
```

---

### DELETE /books/{id}

删除书籍（需认证）

**响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

### GET /books/search

搜索书籍（需认证）

**查询参数**:
- `keyword`: 搜索关键词
- `page`: 页码（默认 0）
- `size`: 每页数量（默认 20）

**响应**: 同书籍列表

---

## 阅读进度 API

### POST /progress

更新阅读进度（需认证）

**请求体**:
```json
{
  "bookId": 1,
  "chapterIndex": 5,
  "scrollPosition": 0.35,
  "progressPercent": 25.5
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "bookId": 1,
    "bookTitle": "书名",
    "chapterIndex": 5,
    "chapterTitle": "第六章",
    "scrollPosition": 0.35,
    "progressPercent": 25.5,
    "lastReadAt": "2025-12-04T10:30:00"
  }
}
```

---

### GET /progress/book/{bookId}

获取书籍阅读进度（需认证）

**响应**: 同上

---

### GET /progress

获取所有阅读进度（需认证）

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "bookId": 1,
      "bookTitle": "书名",
      "chapterIndex": 5,
      "progressPercent": 25.5,
      "lastReadAt": "2025-12-04T10:30:00"
    }
  ]
}
```

---

### GET /progress/recent

获取最近阅读（需认证）

**查询参数**:
- `limit`: 数量限制（默认 10）

**响应**: 同上

---

## 书签 API

### POST /progress/bookmarks

创建书签（需认证）

**请求体**:
```json
{
  "bookId": 1,
  "chapterIndex": 5,
  "position": 1234,
  "selectedText": "选中的文本（最多500字）",
  "note": "备注",
  "color": "yellow"
}
```

**响应**:
```json
{
  "success": true,
  "message": "书签已保存",
  "data": {
    "id": 1,
    "bookId": 1,
    "bookTitle": "书名",
    "chapterIndex": 5,
    "chapterTitle": "第六章",
    "position": 1234,
    "selectedText": "选中的文本",
    "note": "备注",
    "color": "yellow",
    "createdAt": "2025-12-04T10:30:00"
  }
}
```

---

### GET /progress/bookmarks/book/{bookId}

获取书籍的所有书签（需认证）

**响应**:
```json
{
  "success": true,
  "data": [...]
}
```

---

### GET /progress/bookmarks

获取所有书签（需认证，分页）

**查询参数**:
- `page`: 页码（默认 0）
- `size`: 每页数量（默认 20）

**响应**: 分页响应格式

---

### DELETE /progress/bookmarks/{id}

删除书签（需认证）

**响应**:
```json
{
  "success": true,
  "message": "书签已删除"
}
```

---

## HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

---

## JWT Token

### Token 格式

```
eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImlhdCI6MTczMzMwMDAwMCwiZXhwIjoxNzMzMzg2NDAwfQ.xxx
```

### Token 有效期

- 默认 24 小时
- 过期后返回 401，需重新登录

### 使用方式

在请求头中添加：
```
Authorization: Bearer <token>
```

---

## 错误处理

### 常见错误

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| `AUTH_FAILED` | 认证失败 | 检查用户名密码 |
| `TOKEN_EXPIRED` | Token 过期 | 重新登录 |
| `TOKEN_INVALID` | Token 无效 | 重新登录 |
| `USER_EXISTS` | 用户已存在 | 换一个用户名 |
| `BOOK_NOT_FOUND` | 书籍不存在 | 检查 ID |
| `INVALID_FILE` | 文件格式错误 | 仅支持 TXT |

---

## 开发调试

### Swagger UI

开发环境可访问: `http://localhost:8080/swagger-ui.html`

### 测试账号

```
用户名: testuser
密码: 123456
```

---

## 更新记录

| 日期 | 变更 |
|------|------|
| 2025-12-05 | 添加 POST /auth/refresh 端点文档 |
| 2025-12-04 | 初始化 API 文档 |
