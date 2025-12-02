# 核心模块文档

> packages/core 模块说明与 API 参考

**最后更新**: 2025-12-02

---

## 模块概览

```
packages/core/src/
├── parser/         # 文件解析模块
│   ├── encoding.js     # 编码检测
│   ├── txt-parser.js   # TXT 解析器
│   └── chapter-detector.js  # 章节识别
├── search/         # 搜索模块
│   └── search-engine.js    # 搜索引擎
└── types/          # 类型定义
    └── book.js         # Book 数据结构
```

---

## 数据结构

### Book

```javascript
/**
 * 书籍数据结构
 * @typedef {Object} Book
 * @property {string} id - 唯一标识
 * @property {string} title - 书名
 * @property {string} content - 全文内容
 * @property {Chapter[]} chapters - 章节列表
 * @property {BookMetadata} metadata - 元数据
 */

/**
 * 章节结构
 * @typedef {Object} Chapter
 * @property {number} index - 章节序号
 * @property {string} title - 章节标题
 * @property {number} start - 起始位置（字符索引）
 * @property {number} end - 结束位置（字符索引）
 */

/**
 * 书籍元数据
 * @typedef {Object} BookMetadata
 * @property {string} encoding - 文件编码
 * @property {number} fileSize - 文件大小（字节）
 * @property {number} totalChapters - 章节总数
 * @property {number} totalCharacters - 字符总数
 */
```

### SearchResult

```javascript
/**
 * 搜索结果结构
 * @typedef {Object} SearchResult
 * @property {string} keyword - 搜索关键词
 * @property {number} totalMatches - 匹配总数
 * @property {ChapterMatch[]} chapters - 按章节分组的结果
 */

/**
 * 章节匹配结果
 * @typedef {Object} ChapterMatch
 * @property {number} chapterIndex - 章节序号
 * @property {string} chapterTitle - 章节标题
 * @property {number} matchCount - 本章匹配数
 * @property {Match[]} matches - 匹配列表
 */

/**
 * 单个匹配
 * @typedef {Object} Match
 * @property {number} position - 全文位置
 * @property {string} context - 上下文（前后各 50 字）
 * @property {number} highlightStart - 高亮起始
 * @property {number} highlightEnd - 高亮结束
 */
```

---

## Parser 模块

### encoding.js（待开发）

```javascript
/**
 * 检测文本编码
 * @param {ArrayBuffer} buffer - 文件 buffer
 * @returns {string} 编码名称（UTF-8, GBK, GB18030, Big5 等）
 */
export function detectEncoding(buffer) {}

/**
 * 转换编码为 UTF-8
 * @param {ArrayBuffer} buffer - 文件 buffer
 * @param {string} encoding - 源编码
 * @returns {string} UTF-8 文本
 */
export function decodeToUTF8(buffer, encoding) {}
```

### txt-parser.js（待开发）

```javascript
/**
 * 解析 TXT 文件
 * @param {File} file - 文件对象
 * @returns {Promise<Book>} 解析后的书籍对象
 */
export async function parseTxtFile(file) {}
```

### chapter-detector.js（待开发）

```javascript
/**
 * 识别章节
 * @param {string} content - 全文内容
 * @param {RegExp[]} patterns - 章节正则模式（可选）
 * @returns {Chapter[]} 章节列表
 */
export function detectChapters(content, patterns) {}

/**
 * 预设的章节正则模式
 */
export const CHAPTER_PATTERNS = [
  /第[一二三四五六七八九十百千\d]+[章节回]/g,
  /Chapter\s+\d+/gi,
  /【第.+章】/g,
]
```

---

## Search 模块

### search-engine.js（待开发）

```javascript
/**
 * 执行搜索
 * @param {string} content - 搜索内容
 * @param {string} keyword - 关键词
 * @param {Chapter[]} chapters - 章节列表
 * @param {Object} options - 搜索选项
 * @param {boolean} options.isRegex - 是否正则搜索
 * @param {boolean} options.caseSensitive - 是否区分大小写
 * @returns {SearchResult} 搜索结果
 */
export function search(content, keyword, chapters, options) {}
```

---

## 使用示例

```javascript
import { parseTxtFile } from '@core/parser/txt-parser'
import { search } from '@core/search/search-engine'

// 解析文件
const book = await parseTxtFile(file)

// 搜索
const result = search(book.content, '角色名', book.chapters)

console.log(`共找到 ${result.totalMatches} 处匹配`)
result.chapters.forEach(chapter => {
  console.log(`${chapter.chapterTitle}: ${chapter.matchCount} 处`)
})
```

---

## 更新记录

| 日期 | 模块 | 变更 |
|------|------|------|
| 2025-12-02 | - | 初始化文档结构 |
