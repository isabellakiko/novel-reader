# 快速启动指南

> Novel Reader 项目的环境准备、启动、运行和关闭指南

**最后更新**: 2025-12-04

---

## 环境要求

### 前端

| 工具 | 版本要求 | 检查命令 |
|------|----------|----------|
| Node.js | >= 18 | `node -v` |
| pnpm | >= 9.0 | `pnpm -v` |

### 后端

| 工具 | 版本要求 | 检查命令 |
|------|----------|----------|
| Java | 21 | `java -version` |
| Maven | 3.9+ | `./mvnw --version`（自动下载） |

### 可选

| 工具 | 用途 |
|------|------|
| Docker | 容器化部署 |
| PostgreSQL 16+ | 生产环境数据库 |

---

## 首次安装

### 1. 克隆项目

```bash
git clone <repository-url>
cd novel-reader
```

### 2. 安装前端依赖

```bash
pnpm install
```

### 3. 验证后端环境

```bash
cd apps/server
./mvnw clean compile
```

首次运行会自动下载 Maven 和依赖，可能需要几分钟。

---

## 启动服务

### 方式一：仅前端（离线模式）

前端可以独立运行，使用本地 IndexedDB 存储数据。

```bash
# 在项目根目录
pnpm --filter web dev
```

访问：http://localhost:5173

### 方式二：前端 + 后端（完整模式）

需要同时启动前端和后端，支持云端同步功能。

**终端 1 - 启动后端**：
```bash
cd apps/server
./mvnw spring-boot:run
```

等待看到：
```
Started NovelReaderApplication in X.XXX seconds
```

**终端 2 - 启动前端**：
```bash
pnpm --filter web dev
```

访问：
- 前端：http://localhost:5173
- 后端 API：http://localhost:8080/api
- H2 控制台：http://localhost:8080/api/h2-console
- API 文档：http://localhost:8080/api/swagger-ui.html

---

## 关闭服务

### 前端

在终端按 `Ctrl + C`

### 后端

在终端按 `Ctrl + C`

或者强制关闭：
```bash
# 查找进程
lsof -i :8080

# 杀死进程
kill -9 <PID>

# 或一键关闭
pkill -f "novel-reader-server"
```

---

## 常用命令速查

### 前端

| 命令 | 说明 |
|------|------|
| `pnpm --filter web dev` | 启动开发服务器 |
| `pnpm --filter web build` | 构建生产版本 |
| `pnpm --filter web preview` | 预览生产构建 |
| `pnpm --filter web add <pkg>` | 添加依赖 |

### 后端

| 命令 | 说明 |
|------|------|
| `./mvnw spring-boot:run` | 启动开发服务器 |
| `./mvnw package` | 构建 JAR 包 |
| `./mvnw test` | 运行测试 |
| `./mvnw clean` | 清理构建产物 |
| `./mvnw flyway:migrate` | 运行数据库迁移 |

### Monorepo

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm build` | 构建所有包 |
| `pnpm --filter @novel-reader/core test` | 运行核心包测试 |

---

## 验证服务状态

### 前端

打开 http://localhost:5173，看到书架页面即成功。

### 后端

```bash
# 健康检查
curl http://localhost:8080/api/actuator/health

# 预期响应
{"status":"UP"}
```

### H2 数据库控制台

1. 打开 http://localhost:8080/api/h2-console
2. JDBC URL: `jdbc:h2:mem:novelreader`
3. 用户名: `sa`
4. 密码: （空）

---

## 常见问题

### 端口被占用

```bash
# 查看端口占用
lsof -i :5173  # 前端
lsof -i :8080  # 后端

# 杀死占用进程
kill -9 <PID>
```

### Maven 下载慢

配置国内镜像，编辑 `~/.m2/settings.xml`：

```xml
<settings>
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>central</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
```

### pnpm 安装失败

```bash
# 清理缓存重试
pnpm store prune
rm -rf node_modules
pnpm install
```

### Java 版本不对

```bash
# macOS 使用 Homebrew
brew install openjdk@21
export JAVA_HOME=/opt/homebrew/opt/openjdk@21

# 或使用 SDKMAN
sdk install java 21-open
sdk use java 21-open
```

---

## 下一步

- [开发规范](./development/DEVELOPMENT.md)
- [API 文档](./development/backend/api.md)
- [部署指南](./project/DEPLOYMENT.md)
