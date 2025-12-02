/**
 * @novel-reader/core
 *
 * 核心解析模块，提供 TXT 文件解析、编码检测、章节识别等功能
 */

// === 类型定义 ===
export { createEmptyBook, generateBookId } from './types/book.js'

// === 编码检测 ===
export {
  detectEncoding,
  decodeToUTF8,
  isEncodingSupported,
  SUPPORTED_ENCODINGS,
} from './parser/encoding.js'

// === 章节识别 ===
export {
  detectChapters,
  extractBookInfo,
  getChapterContent,
  detectBestPattern,
  CHAPTER_PATTERNS,
} from './parser/chapter-detector.js'

// === TXT 解析器 ===
export { parseTxtFile, previewTxtFile, PARSE_STAGES } from './parser/txt-parser.js'

// === 搜索引擎 ===
export {
  searchBook,
  searchBooks,
  highlightMatches,
} from './search/search-engine.js'
