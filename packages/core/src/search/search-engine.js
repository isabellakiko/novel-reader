/**
 * 搜索引擎核心模块
 *
 * 高性能全文搜索，支持：
 * - 大文件搜索（32MB+）
 * - 按章节分组结果
 * - 上下文提取
 * - 渐进式结果返回
 */

/**
 * 搜索选项
 * @typedef {Object} SearchOptions
 * @property {boolean} [caseSensitive=false] - 区分大小写
 * @property {boolean} [wholeWord=false] - 全词匹配
 * @property {boolean} [useRegex=false] - 使用正则表达式
 * @property {number} [contextLength=50] - 上下文长度（前后各多少字符）
 * @property {number} [maxResults=500] - 最大结果数
 * @property {number} [maxResultsPerChapter=50] - 每章最大结果数
 */

/**
 * 单个匹配结果
 * @typedef {Object} SearchMatch
 * @property {number} position - 在全文中的位置
 * @property {number} lineNumber - 行号
 * @property {string} context - 上下文文本
 * @property {number} matchOffset - 匹配在上下文中的偏移
 * @property {number} matchLength - 匹配长度
 */

/**
 * 章节搜索结果
 * @typedef {Object} ChapterSearchResult
 * @property {number} chapterIndex - 章节索引
 * @property {string} chapterTitle - 章节标题
 * @property {SearchMatch[]} matches - 匹配列表
 */

/**
 * 书籍搜索结果
 * @typedef {Object} BookSearchResult
 * @property {string} bookId - 书籍ID
 * @property {string} bookTitle - 书籍标题
 * @property {number} totalMatches - 总匹配数
 * @property {ChapterSearchResult[]} chapters - 章节结果
 */

/**
 * 默认搜索选项
 */
const DEFAULT_OPTIONS = {
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  contextLength: 50,
  maxResults: 500,
  maxResultsPerChapter: 50,
}

/**
 * 创建搜索用的正则表达式
 * @param {string} query - 搜索词
 * @param {SearchOptions} options - 搜索选项
 * @returns {RegExp}
 */
function createSearchPattern(query, options) {
  let pattern = query

  // 如果不是正则模式，转义特殊字符
  if (!options.useRegex) {
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // 全词匹配
  if (options.wholeWord) {
    pattern = `\\b${pattern}\\b`
  }

  // 创建正则表达式
  const flags = options.caseSensitive ? 'g' : 'gi'
  return new RegExp(pattern, flags)
}

/**
 * 构建位置到章节的索引
 * 使用二分查找优化
 * @param {Array<{start: number, end: number}>} chapters
 * @returns {Function} 查找函数
 */
function buildChapterIndex(chapters) {
  // 预处理章节边界
  const boundaries = chapters.map((ch, i) => ({
    start: ch.start,
    end: ch.end,
    index: i,
  }))

  /**
   * 二分查找位置所属章节
   * @param {number} position
   * @returns {number} 章节索引，-1 表示未找到
   */
  return function findChapter(position) {
    let left = 0
    let right = boundaries.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const chapter = boundaries[mid]

      if (position < chapter.start) {
        right = mid - 1
      } else if (position > chapter.end) {
        left = mid + 1
      } else {
        return mid
      }
    }

    return -1
  }
}

/**
 * 提取匹配的上下文
 * @param {string} content - 全文内容
 * @param {number} matchStart - 匹配开始位置
 * @param {number} matchLength - 匹配长度
 * @param {number} contextLength - 上下文长度
 * @returns {{ context: string, matchOffset: number }}
 */
function extractContext(content, matchStart, matchLength, contextLength) {
  // 计算上下文范围
  let contextStart = Math.max(0, matchStart - contextLength)
  let contextEnd = Math.min(content.length, matchStart + matchLength + contextLength)

  // 尝试在词边界处截断（避免截断中文词）
  // 向前找到换行符或空格
  while (contextStart > 0 && contextStart < matchStart) {
    const char = content[contextStart - 1]
    if (char === '\n' || char === '\r') {
      break
    }
    contextStart--
    if (matchStart - contextStart > contextLength * 1.5) {
      contextStart = Math.max(0, matchStart - contextLength)
      break
    }
  }

  // 向后找到换行符
  while (contextEnd < content.length && contextEnd > matchStart + matchLength) {
    const char = content[contextEnd]
    if (char === '\n' || char === '\r') {
      break
    }
    contextEnd++
    if (contextEnd - (matchStart + matchLength) > contextLength * 1.5) {
      contextEnd = Math.min(content.length, matchStart + matchLength + contextLength)
      break
    }
  }

  // 提取上下文
  let context = content.slice(contextStart, contextEnd)

  // 清理换行符
  context = context.replace(/[\r\n]+/g, ' ').trim()

  // 添加省略号
  if (contextStart > 0) {
    context = '...' + context
  }
  if (contextEnd < content.length) {
    context = context + '...'
  }

  // 计算匹配在上下文中的偏移
  let matchOffset = matchStart - contextStart
  if (contextStart > 0) {
    matchOffset += 3 // 加上 "..." 的长度
  }

  return { context, matchOffset }
}

/**
 * 计算行号
 * @param {string} content - 全文内容
 * @param {number} position - 位置
 * @returns {number} 行号（从1开始）
 */
function getLineNumber(content, position) {
  let lineNumber = 1
  for (let i = 0; i < position && i < content.length; i++) {
    if (content[i] === '\n') {
      lineNumber++
    }
  }
  return lineNumber
}

/**
 * 搜索单本书籍
 *
 * @param {Object} book - 书籍对象
 * @param {string} book.id - 书籍ID
 * @param {string} book.title - 书籍标题
 * @param {string} book.content - 书籍内容
 * @param {Array} book.chapters - 章节列表
 * @param {string} query - 搜索词
 * @param {SearchOptions} [options] - 搜索选项
 * @param {Function} [onProgress] - 进度回调 (percent: number)
 * @returns {BookSearchResult}
 */
export function searchBook(book, query, options = {}, onProgress) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { content, chapters } = book

  // 创建搜索模式
  let pattern
  try {
    pattern = createSearchPattern(query, opts)
  } catch (e) {
    // 正则表达式无效
    return {
      bookId: book.id,
      bookTitle: book.title,
      totalMatches: 0,
      chapters: [],
      error: '无效的搜索模式',
    }
  }

  // 构建章节索引
  const findChapter = buildChapterIndex(chapters)

  // 按章节组织结果
  const chapterResults = new Map()
  let totalMatches = 0
  let lastProgressReport = 0

  // 执行搜索
  let match
  while ((match = pattern.exec(content)) !== null) {
    // 检查是否超过最大结果数
    if (totalMatches >= opts.maxResults) {
      break
    }

    const position = match.index
    const matchText = match[0]
    const matchLength = matchText.length

    // 查找所属章节
    const chapterIndex = findChapter(position)
    if (chapterIndex === -1) continue

    const chapter = chapters[chapterIndex]

    // 检查该章节是否已达到最大结果数
    if (!chapterResults.has(chapterIndex)) {
      chapterResults.set(chapterIndex, {
        chapterIndex,
        chapterTitle: chapter.title,
        matches: [],
      })
    }

    const chapterResult = chapterResults.get(chapterIndex)
    if (chapterResult.matches.length >= opts.maxResultsPerChapter) {
      continue
    }

    // 提取上下文
    const { context, matchOffset } = extractContext(
      content,
      position,
      matchLength,
      opts.contextLength
    )

    // 计算行号
    const lineNumber = getLineNumber(content, position)

    // 添加匹配结果
    chapterResult.matches.push({
      position,
      lineNumber,
      context,
      matchOffset,
      matchLength,
    })

    totalMatches++

    // 报告进度（每100个匹配或每10%）
    const progress = Math.floor((position / content.length) * 100)
    if (progress - lastProgressReport >= 10) {
      onProgress?.(progress)
      lastProgressReport = progress
    }
  }

  // 转换为数组并排序
  const sortedChapters = Array.from(chapterResults.values()).sort(
    (a, b) => a.chapterIndex - b.chapterIndex
  )

  onProgress?.(100)

  return {
    bookId: book.id,
    bookTitle: book.title,
    totalMatches,
    chapters: sortedChapters,
  }
}

/**
 * 搜索多本书籍
 *
 * @param {Array} books - 书籍列表
 * @param {string} query - 搜索词
 * @param {SearchOptions} [options] - 搜索选项
 * @param {Function} [onBookComplete] - 书籍搜索完成回调
 * @param {Function} [onProgress] - 总进度回调
 * @returns {BookSearchResult[]}
 */
export function searchBooks(books, query, options = {}, onBookComplete, onProgress) {
  const results = []
  let totalProgress = 0

  for (let i = 0; i < books.length; i++) {
    const book = books[i]

    const bookResult = searchBook(book, query, options, (bookProgress) => {
      // 计算总进度
      const overallProgress = ((i + bookProgress / 100) / books.length) * 100
      onProgress?.(Math.floor(overallProgress))
    })

    if (bookResult.totalMatches > 0) {
      results.push(bookResult)
    }

    onBookComplete?.(bookResult, i, books.length)
    totalProgress = ((i + 1) / books.length) * 100
    onProgress?.(Math.floor(totalProgress))
  }

  return results
}

/**
 * 高亮搜索结果
 * @param {string} text - 原始文本
 * @param {string} query - 搜索词
 * @param {boolean} [caseSensitive=false] - 区分大小写
 * @returns {Array<{text: string, isMatch: boolean}>} 分段结果
 */
export function highlightMatches(text, query, caseSensitive = false) {
  if (!query) return [{ text, isMatch: false }]

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(${escapedQuery})`, caseSensitive ? 'g' : 'gi')
  const parts = text.split(pattern)

  return parts.map((part) => ({
    text: part,
    isMatch: pattern.test(part),
  }))
}
