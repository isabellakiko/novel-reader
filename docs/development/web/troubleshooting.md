# 问题排查文档

> 开发过程中遇到的实际问题与解决方案

**最后更新**: 2025-12-04

---

## 目录

1. [前端问题](#前端问题)
2. [后端问题](#后端问题)
3. [构建问题](#构建问题)
4. [集成问题](#集成问题)

---

## 前端问题

### Buffer.from 浏览器兼容性

**现象**: 编码检测模块在浏览器中报错 `Buffer is not defined`

**原因**: Node.js 的 Buffer API 在浏览器环境不可用

**解决方案**:
```javascript
// 运行时环境检测
const isNode = typeof Buffer !== 'undefined'

if (isNode) {
  // Node.js 环境：使用 Buffer
  return Buffer.from(arrayBuffer).toString(encoding)
} else {
  // 浏览器环境：使用 TextDecoder
  const decoder = new TextDecoder(encoding)
  return decoder.decode(new Uint8Array(arrayBuffer))
}
```

---

### react-window 版本警告

**现象**: 控制台出现 `Invalid prop` 警告

**原因**: react-window 某些版本与 React 18 StrictMode 不完全兼容

**解决方案**:
- 使用 react-window@1.8.10 版本
- 或在开发环境暂时忽略该警告

---

### Dexie 版本升级数据丢失

**现象**: 升级 IndexedDB schema 后旧数据不可访问

**原因**: 版本号未正确递增或 stores 定义变更

**解决方案**:
```javascript
// 每次 schema 变更必须递增版本号
db.version(4).stores({
  books: 'id, title, author, importedAt',
  readingProgress: 'bookId',
  bookContents: 'bookId',
  bookmarks: '++id, bookId, createdAt',
  readingStats: '++id, bookId, date, [bookId+date]',
})

// 如需迁移数据，使用 upgrade 回调
db.version(4).stores({...}).upgrade(tx => {
  // 迁移逻辑
})
```

---

### 阅读进度滚动位置不准确

**现象**: 恢复阅读时滚动位置有偏差

**原因**:
- 字体渲染完成前计算高度
- 图片/异步内容改变布局

**解决方案**:
```javascript
// 延迟滚动，等待渲染完成
useEffect(() => {
  const timer = setTimeout(() => {
    if (scrollRef.current && savedPosition > 0) {
      const scrollHeight = scrollRef.current.scrollHeight
      scrollRef.current.scrollTop = scrollHeight * savedPosition
    }
  }, 100) // 延迟 100ms
  return () => clearTimeout(timer)
}, [chapterContent])
```

---

### Web Worker 导入路径问题

**现象**: Worker 文件找不到或模块解析失败

**原因**: Vite 对 Worker 的处理方式不同

**解决方案**:
```javascript
// vite.config.js
worker: {
  format: 'es',
}

// 使用 ?worker 后缀导入
import SearchWorker from './workers/search.worker.js?worker'
const worker = new SearchWorker()
```

---

## 后端问题

### Gradle Wrapper 下载失败

**现象**: `ClassNotFoundException: org.gradle.wrapper.GradleWrapperMain`

**原因**: gradle-wrapper.jar 未正确下载或损坏

**解决方案**:
```bash
# 方法 1：重新生成 wrapper（需要本地安装 Gradle）
gradle wrapper --gradle-version 8.12

# 方法 2：手动下载 jar
# 下载地址: https://services.gradle.org/distributions/gradle-8.12-bin.zip
# 解压后复制 lib/gradle-wrapper-*.jar 到 gradle/wrapper/
```

---

### JPA 投影查询返回 null

**现象**: 使用投影接口查询时返回 null 或空列表

**原因**: 投影接口的 getter 方法名与字段不匹配

**解决方案**:
```java
// ❌ 错误：方法名不匹配
public interface ChapterSummary {
    Integer getIndex();  // 字段是 chapterIndex
}

// ✅ 正确：方法名与字段对应
public interface ChapterSummary {
    Integer getChapterIndex();  // 匹配 chapter_index 列
    String getTitle();
    Integer getWordCount();
}
```

---

### JWT Token 过期后请求失败

**现象**: 401 Unauthorized，但用户已登录

**原因**: Token 过期，前端未正确处理

**解决方案**:
```javascript
// api.js - Axios 响应拦截器
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token 过期，清除登录状态
      useAuthStore.getState().logout()
      // 可选：跳转登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

### H2 Console 访问被 Security 拦截

**现象**: 无法访问 /h2-console

**原因**: Spring Security 默认拦截所有请求

**解决方案**:
```java
// SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .headers(headers -> headers.frameOptions(f -> f.sameOrigin()))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/h2-console/**").permitAll()
            // ...
        );
    return http.build();
}
```

---

## 构建问题

### Vite 构建产物过大

**现象**: dist 目录超过 2MB

**原因**: 未做代码分割，第三方库打包在一起

**解决方案**:
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        ui: ['framer-motion', '@radix-ui/react-dialog'],
      }
    }
  }
}
```

---

### 热更新失效

**现象**: 修改代码后页面不自动刷新

**解决方案**:
```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite
pnpm dev
```

---

## 集成问题

### CORS 跨域请求被拒绝

**现象**: 前端请求后端 API 报 CORS 错误

**原因**: 后端未配置 CORS

**解决方案**:
```java
// WebConfig.java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true);
    }
}
```

---

### 前端 Proxy 配置不生效

**现象**: 开发环境 API 请求仍走原地址

**原因**: Vite proxy 配置格式错误

**解决方案**:
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}
```

---

## 更新记录

| 日期 | 问题 | 解决方案 |
|------|------|----------|
| 2025-12-04 | JWT Token 过期处理 | 添加 Axios 拦截器 |
| 2025-12-04 | JPA 投影查询问题 | 修正接口方法名 |
| 2025-12-04 | Gradle Wrapper 问题 | 重新生成 wrapper |
| 2025-12-04 | Buffer 浏览器兼容 | 环境检测 + TextDecoder |
| 2025-12-02 | - | 初始化文档 |
