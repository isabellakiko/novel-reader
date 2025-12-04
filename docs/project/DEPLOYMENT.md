# 部署指南

> Novel Reader 生产环境部署指南

**最后更新**: 2025-12-04

---

## 部署架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (反向代理)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   前端静态   │ │  后端 API   │ │ PostgreSQL  │
    │   (Nginx)   │ │ (Spring)    │ │  (数据库)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 方式一：传统部署

### 1. 构建前端

```bash
# 构建生产版本
pnpm --filter web build

# 产物在 apps/web/dist/
```

### 2. 构建后端

```bash
cd apps/server

# 构建 JAR
./gradlew build -x test

# 产物在 build/libs/novel-reader-server-0.0.1-SNAPSHOT.jar
```

### 3. 配置 PostgreSQL

```sql
-- 创建数据库和用户
CREATE DATABASE novelreader;
CREATE USER novelreader WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE novelreader TO novelreader;
```

### 4. 配置后端环境变量

创建 `.env` 或设置系统环境变量：

```bash
# 数据库
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/novelreader
SPRING_DATASOURCE_USERNAME=novelreader
SPRING_DATASOURCE_PASSWORD=your-secure-password

# JWT 密钥（生产环境必须更换！）
JWT_SECRET=your-very-long-and-secure-secret-key-at-least-64-characters

# 端口
SERVER_PORT=8080

# Profile
SPRING_PROFILES_ACTIVE=prod
```

### 5. 运行后端

```bash
java -jar novel-reader-server-0.0.1-SNAPSHOT.jar
```

或使用 systemd 服务：

```ini
# /etc/systemd/system/novel-reader.service
[Unit]
Description=Novel Reader Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/novel-reader
ExecStart=/usr/bin/java -jar novel-reader-server.jar
Restart=always
RestartSec=10
Environment=SPRING_PROFILES_ACTIVE=prod
EnvironmentFile=/opt/novel-reader/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable novel-reader
sudo systemctl start novel-reader
```

### 6. 配置 Nginx

```nginx
# /etc/nginx/sites-available/novel-reader
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/novel-reader;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 文件上传大小限制
        client_max_body_size 100M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/novel-reader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 方式二：Docker 部署

### 1. 创建 Dockerfile

**前端 Dockerfile** (`apps/web/Dockerfile`)：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

COPY apps/web/ ./apps/web/
RUN pnpm --filter web build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**后端 Dockerfile** (`apps/server/Dockerfile`)：

```dockerfile
# 构建阶段
FROM gradle:8.12-jdk21 AS builder
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

# 运行阶段
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL 数据库
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: novelreader
      POSTGRES_USER: novelreader
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U novelreader"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 后端 API
  backend:
    build:
      context: ./apps/server
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/novelreader
      SPRING_DATASOURCE_USERNAME: novelreader
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:-changeme}
      JWT_SECRET: ${JWT_SECRET:-change-this-in-production}
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8080:8080"

  # 前端
  frontend:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 3. 启动服务

```bash
# 创建 .env 文件
cat > .env << EOF
DB_PASSWORD=your-secure-db-password
JWT_SECRET=your-very-long-jwt-secret-key-at-least-64-characters
EOF

# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

---

## 生产环境检查清单

### 安全

- [ ] 更换 JWT_SECRET（至少 64 字符）
- [ ] 更换数据库密码
- [ ] 配置 HTTPS（Let's Encrypt）
- [ ] 禁用 H2 Console
- [ ] 禁用 Swagger UI（或添加认证）
- [ ] 配置 CORS 白名单

### 性能

- [ ] 配置 JVM 参数（`-Xmx`, `-Xms`）
- [ ] 启用 Gzip 压缩
- [ ] 配置静态资源缓存
- [ ] 配置数据库连接池

### 运维

- [ ] 配置日志轮转
- [ ] 配置健康检查
- [ ] 配置备份策略
- [ ] 配置监控告警

---

## 生产环境配置示例

**`application-prod.yml`**：

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  h2:
    console:
      enabled: false

  flyway:
    enabled: true

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000

logging:
  level:
    root: WARN
    com.novelreader: INFO
  file:
    name: /var/log/novel-reader/app.log

springdoc:
  swagger-ui:
    enabled: false
```

---

## 常见问题

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U novelreader -d novelreader
```

### 后端启动失败

```bash
# 查看日志
journalctl -u novel-reader -f

# 或 Docker
docker-compose logs backend -f
```

### 前端 404

确保 Nginx 配置了 `try_files $uri $uri/ /index.html;`，支持 SPA 路由。

---

## 相关文档

- [快速启动](../getting-started.md)
- [API 文档](../development/backend/api.md)
- [数据库设计](../development/backend/database.md)
