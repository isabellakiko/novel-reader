# 核心模块文档

> packages/core 模块说明与 API 参考

**最后更新**: 2025-12-04
**状态**: ✅ 已完成

---

## 模块概览

```
packages/core/src/
├── parser/                    # 文件解析模块
│   ├── encoding.js            # 编码检测与转换
│   ├── txt-parser.js          # TXT 完整解析器
│   └── chapter-detector.js    # 章节智能识别
├── search/                    # 搜索模块
│   └── search-engine.js       # 搜索引擎（4 种模式）
└── types/                     # 类型定义
    └── book.js                # Book 数据结构
```

---

## 数据结构

### Book

```javascript
/**
 * 书籍数据结构
 */
const Book = {
  id: "uuid-string",           // 唯一标识
  title: "书名",                // 书名
  author: "作者",               // 作者（可选）
  content: "全文内容...",        // 完整文本
  chapters: [Chapter],          // 章节列表
  metadata: BookMetadata        // 元数据
}

/**
 * 章节结构
 */
const Chapter = {
  index: 0,                     // 章节序号（0 开始）
  title: "第一章 开始",          // 章节标题
  start: 0,                     // 起始位置（字符索引）
  end: 5000                     // 结束位置（字符索引）
}

/**
 * 书籍元数据
 */
const BookMetadata = {
  encoding: "UTF-8",            // 文件编码
  fileSize: 1024000,            // 文件大小（字节）
  totalChapters: 100,           // 章节总数
  totalCharacters: 500000,      // 字符总数
  importedAt: Date              // 导入时间
}
```

### SearchResult

```javascript
/**
 * 搜索结果结构
 */
const SearchResult = {
  keyword: "关键词",
  totalMatches: 50,
  chapters: [ChapterMatch]
}

/**
 * 章节匹配结果
 */
const ChapterMatch = {
  chapterIndex: 5,
  chapterTitle: "第六章",
  matchCount: 3,
  matches: [Match]
}

/**
 * 单个匹配
 */
const Match = {
  position: 12345,              // 全文位置
  context: "...前文关键词后文...", // 上下文
  highlightStart: 3,            // 高亮起始（context 内）
  highlightEnd: 6               // 高亮结束
}
```

---

## Parser 模块

### encoding.js ✅

编码检测与 UTF-8 转换，支持 Browser 和 Node.js 双环境。

```javascript
import { detectEncoding, decodeToUTF8, SUPPORTED_ENCODINGS } from '@core/parser/encoding'

/**
 * 检测文本编码
 * @param {ArrayBuffer | Uint8Array} buffer - 文件 buffer
 * @returns {string} 编码名称
 *
 * 支持的编码：UTF-8, GBK, GB18030, GB2312, Big5
 * 检测方法：BOM 头 + 字节模式分析
 */
const encoding = detectEncoding(buffer)
// => 'UTF-8' | 'GBK' | 'GB18030' | 'Big5'

/**
 * 转换编码为 UTF-8
 * @param {ArrayBuffer | Uint8Array} buffer - 文件 buffer
 * @param {string} encoding - 源编码
 * @returns {string} UTF-8 文本
 *
 * 使用 TextDecoder API（浏览器）或 Buffer（Node.js）
 */
const text = decodeToUTF8(buffer, encoding)
```

**性能指标**:
- 32MB GBK 文件检测: <10ms
- 32MB 文件解码: <50ms

---

### txt-parser.js ✅

TXT 文件完整解析器，5 阶段流水线。

```javascript
import { parseTxtFile, previewTxtFile, PARSE_STAGES } from '@core/parser/txt-parser'

/**
 * 完整解析 TXT 文件
 * @param {File} file - 文件对象
 * @param {Object} options - 解析选项
 * @param {Function} options.onProgress - 进度回调 (stage, percent)
 * @returns {Promise<Book>} 解析后的书籍对象
 *
 * 解析阶段：
 * 1. reading - 读取文件
 * 2. detecting_encoding - 检测编码
 * 3. decoding - 解码为 UTF-8
 * 4. extracting_info - 提取书名/作者
 * 5. detecting_chapters - 识别章节
 */
const book = await parseTxtFile(file, {
  onProgress: (stage, percent) => {
    console.log(`${stage}: ${percent}%`)
  }
})

/**
 * 快速预览（仅解析前 100KB）
 * @param {File} file - 文件对象
 * @returns {Promise<Object>} 预览信息
 */
const preview = await previewTxtFile(file)
// => { title, author, encoding, sampleChapters: [...] }
```

**性能指标**:
- 32MB 文件完整解析: <100ms
- 100KB 预览: <10ms

---

### chapter-detector.js ✅

智能章节识别，支持 10+ 种格式。

```javascript
import {
  detectChapters,
  extractBookInfo,
  detectBestPattern,
  CHAPTER_PATTERNS
} from '@core/parser/chapter-detector'

/**
 * 识别章节
 * @param {string} content - 全文内容
 * @param {Object} options - 识别选项
 * @returns {Chapter[]} 章节列表
 *
 * 支持格式：
 * - 第X章、第X节、第X回（中文数字/阿拉伯数字）
 * - Chapter X、Part X
 * - 【第X章】、「第X章」
 * - 卷X 章X、Book X
 */
const chapters = detectChapters(content)

/**
 * 提取书名和作者
 * @param {string} text - 文本内容（通常取前 1000 字符）
 * @returns {{ title: string, author: string }}
 *
 * 匹配规则：
 * - 书名：《书名》 或 【书名】
 * - 作者：作者：XXX 或 by XXX
 */
const { title, author } = extractBookInfo(text.slice(0, 1000))

/**
 * 自动选择最佳章节模式
 * @param {string} text - 文本内容
 * @returns {RegExp} 最佳匹配的正则
 */
const bestPattern = detectBestPattern(text)

/**
 * 预设章节正则模式
 */
CHAPTER_PATTERNS = [
  /^第[一二三四五六七八九十百千万零\d]+[章节回部集卷篇]/gm,
  /^Chapter\s+\d+/gim,
  /^Part\s+\d+/gim,
  /^【第.+章】/gm,
  /^「第.+章」/gm,
  // ... 更多模式
]
```

**特性**:
- 行首匹配 + 行内嵌入式章节支持
- 中文数字自动转换（一二三 → 1 2 3）
- 自动过滤误匹配（如"第一次"）

---

## Search 模块

### search-engine.js ✅

高性能搜索引擎，支持 4 种搜索模式。

```javascript
import { searchBook, searchBooks, highlightMatches } from '@core/search/search-engine'

/**
 * 搜索单本书
 * @param {string} content - 书籍内容
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {SearchResult} 搜索结果
 */
const result = searchBook(content, '主角名', {
  chapters: book.chapters,      // 章节列表
  caseSensitive: false,         // 区分大小写
  wholeWord: false,             // 全词匹配
  useRegex: false,              // 正则搜索
  searchMode: 'detailed',       // 搜索模式
  contextLength: 50             // 上下文长度
})

/**
 * 搜索模式说明
 *
 * overview   - 章节概览：每章仅返回 1 条匹配
 * detailed   - 详细搜索：返回所有匹配，按章节分组
 * frequency  - 频率统计：返回各章匹配数量，按频率排序
 * timeline   - 时间线：按位置顺序平铺所有匹配
 */

/**
 * 搜索多本书
 * @param {Book[]} books - 书籍列表
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {BookSearchResult[]} 搜索结果
 */
const results = searchBooks(books, '关键词', options)

/**
 * 高亮匹配文本
 * @param {string} text - 原始文本
 * @param {Match[]} matches - 匹配列表
 * @returns {string} 带高亮标记的文本
 */
const highlighted = highlightMatches(text, matches)
// => "...前文<mark>关键词</mark>后文..."
```

**性能指标**:
- 500KB 文本搜索: <50ms
- 10MB 文本搜索: <200ms
- CJK 全词匹配支持

---

## 使用示例

### 完整解析流程

```javascript
import { parseTxtFile } from '@novel-reader/core'

// 解析文件
const book = await parseTxtFile(file, {
  onProgress: (stage, percent) => {
    updateUI(`${stage}: ${percent}%`)
  }
})

console.log(`书名: ${book.title}`)
console.log(`作者: ${book.author || '未知'}`)
console.log(`章节数: ${book.chapters.length}`)
console.log(`总字数: ${book.metadata.totalCharacters}`)
```

### 搜索流程

```javascript
import { searchBook } from '@novel-reader/core'

// 搜索
const result = searchBook(book.content, '主角', {
  chapters: book.chapters,
  searchMode: 'frequency'
})

console.log(`共找到 ${result.totalMatches} 处匹配`)
result.chapters.forEach(chapter => {
  console.log(`${chapter.chapterTitle}: ${chapter.matchCount} 次`)
})
```

### Web Worker 集成

```javascript
// worker.js
import { searchBook } from '@novel-reader/core'

self.onmessage = (e) => {
  const { content, query, options } = e.data
  const result = searchBook(content, query, options)
  self.postMessage(result)
}

// main.js
const worker = new Worker('./worker.js')
worker.postMessage({ content, query, options })
worker.onmessage = (e) => {
  displayResults(e.data)
}
```

---

## 浏览器兼容性

| 特性 | 说明 |
|------|------|
| TextDecoder | 用于编码转换，所有现代浏览器支持 |
| Uint8Array | 用于字节操作，ES6+ 支持 |
| Buffer 检测 | 运行时检测 `typeof Buffer`，自动适配 Node.js |

**Node.js 特殊处理**:
```javascript
// 自动检测环境
const isNode = typeof Buffer !== 'undefined'
if (isNode) {
  // 使用 Buffer.from() + iconv-lite
} else {
  // 使用 TextDecoder
}
```

---

## 更新记录

| 日期 | 模块 | 变更 |
|------|------|------|
| 2025-12-04 | 文档 | 全面更新为已实现状态 |
| 2025-12-02 | search | 添加 4 种搜索模式 |
| 2025-12-02 | parser | 完成 TXT 解析器 |
| 2025-12-02 | parser | 完成编码检测 |
| 2025-12-02 | - | 初始化模块结构 |
