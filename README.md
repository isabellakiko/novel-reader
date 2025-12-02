# Novel Reader

本地小说阅读器，支持多种格式文件解析和强大的全局搜索功能。

## 功能特性

- 文件解析：支持 TXT（多种编码）、EPUB、PDF 等格式
- 全局搜索：关键词搜索、按章节分组、上下文显示、高亮跳转
- 阅读体验：字体设置、主题切换、阅读进度记忆
- 本地书架：管理本地导入的书籍

## 目录结构

```
novel-reader/
├── apps/
│   ├── web/                    # React 前端应用
│   └── server/                 # 后端服务（预留）
├── packages/
│   ├── core/                   # 核心逻辑（前后端共享）
│   │   └── src/
│   │       ├── parser/         # 文件解析逻辑
│   │       ├── search/         # 搜索算法
│   │       └── types/          # 类型定义
│   └── shared/                 # 共享工具和常量
│       └── src/
│           ├── constants/      # 常量定义
│           └── utils/          # 通用工具函数
├── package.json                # 根配置
└── pnpm-workspace.yaml         # pnpm 工作区配置
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```
