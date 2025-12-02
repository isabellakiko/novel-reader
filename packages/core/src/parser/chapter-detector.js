/**
 * 章节识别模块
 *
 * 支持多种常见章节格式的自动识别
 * 包括行首章节和行内嵌入章节
 */

/**
 * 章节标题的核心正则（不含行首锚点，用于全文搜索）
 */
const CHAPTER_CORE_PATTERNS = [
  // 第X章 / 第X章：标题 / 第X章:标题 / 第X章标题（阿拉伯数字）
  /第[0-9]+章[：:\s]?[^\n]{0,30}/g,

  // 第一章 / 第一百二十三章（中文数字）
  /第[零一二三四五六七八九十百千万]+章[：:\s]?[^\n]{0,30}/g,

  // Chapter X / Chapter X: Title
  /Chapter\s+\d+[：:\s]?[^\n]{0,50}/gi,

  // 第X节
  /第[0-9]+节[：:\s]?[^\n]{0,30}/g,
  /第[零一二三四五六七八九十百千万]+节[：:\s]?[^\n]{0,30}/g,

  // 第X回
  /第[0-9]+回[：:\s]?[^\n]{0,30}/g,
  /第[零一二三四五六七八九十百千万]+回[：:\s]?[^\n]{0,30}/g,

  // 【第X章】标题
  /【第[0-9]+章】[^\n]{0,30}/g,
  /【第[零一二三四五六七八九十百千万]+章】[^\n]{0,30}/g,

  // 卷X 第X章
  /卷[0-9一二三四五六七八九十]+\s*第[0-9一二三四五六七八九十百千万]+章[^\n]{0,30}/g,
]

/**
 * 行首匹配模式（用于传统格式的书籍）
 */
export const CHAPTER_PATTERNS = [
  /^第[0-9]+章[：:\s]?.*/,
  /^第[零一二三四五六七八九十百千万]+章[：:\s]?.*/,
  /^Chapter\s+\d+[：:\s]?.*/i,
  /^第[0-9]+节[：:\s]?.*/,
  /^第[零一二三四五六七八九十百千万]+节[：:\s]?.*/,
  /^第[0-9]+回[：:\s]?.*/,
  /^第[零一二三四五六七八九十百千万]+回[：:\s]?.*/,
  /^【第[0-9]+章】.*/,
  /^【第[零一二三四五六七八九十百千万]+章】.*/,
  /^卷[0-9一二三四五六七八九十]+\s+第[0-9一二三四五六七八九十百千万]+章.*/,
]

/**
 * 章节结构
 * @typedef {Object} Chapter
 * @property {number} index - 章节序号
 * @property {string} title - 章节标题
 * @property {number} start - 起始位置
 * @property {number} end - 结束位置
 */

/**
 * 检测章节（主入口）
 *
 * 自动选择最佳检测策略：
 * 1. 先尝试行首检测（传统格式）
 * 2. 如果结果太少，尝试全文搜索（嵌入式章节）
 *
 * @param {string} content - 全文内容
 * @param {RegExp[]} [customPatterns] - 自定义正则模式（可选）
 * @returns {Chapter[]} 章节列表
 */
export function detectChapters(content, customPatterns) {
  // 先尝试行首检测
  const lineBasedChapters = detectChaptersLineStart(content, customPatterns)

  // 如果检测到足够多的章节（>50），使用行首检测结果
  if (lineBasedChapters.length > 50) {
    return lineBasedChapters
  }

  // 尝试全文搜索
  const inlineChapters = detectChaptersInline(content)

  // 选择检测到更多章节的方法
  if (inlineChapters.length > lineBasedChapters.length * 2) {
    return inlineChapters
  }

  // 如果都检测到很少，返回较多的那个
  return lineBasedChapters.length >= inlineChapters.length
    ? lineBasedChapters
    : inlineChapters
}

/**
 * 行首章节检测（原有逻辑）
 */
function detectChaptersLineStart(content, customPatterns) {
  const patterns = customPatterns || CHAPTER_PATTERNS
  const chapters = []

  const lines = content.split(/\r?\n/)
  let currentPosition = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    const isChapter = patterns.some((pattern) => pattern.test(trimmedLine))

    if (isChapter && trimmedLine.length > 0) {
      if (chapters.length > 0) {
        chapters[chapters.length - 1].end = currentPosition - 1
      }

      chapters.push({
        index: chapters.length,
        title: trimmedLine,
        start: currentPosition,
        end: -1,
      })
    }

    currentPosition += line.length + 1
  }

  if (chapters.length > 0) {
    chapters[chapters.length - 1].end = content.length - 1
  }

  return chapters
}

/**
 * 全文搜索章节检测（用于嵌入式章节）
 */
function detectChaptersInline(content) {
  const chapters = []
  const matches = []

  // 使用所有核心模式搜索
  for (const pattern of CHAPTER_CORE_PATTERNS) {
    // 重置 lastIndex
    pattern.lastIndex = 0

    let match
    while ((match = pattern.exec(content)) !== null) {
      // 提取章节标题（清理多余空白）
      let title = match[0].trim()
      // 截断过长的标题
      if (title.length > 50) {
        title = title.slice(0, 50) + '...'
      }

      matches.push({
        title,
        position: match.index,
      })
    }
  }

  // 按位置排序并去重（同一位置只保留一个）
  matches.sort((a, b) => a.position - b.position)

  const uniqueMatches = []
  let lastPosition = -100 // 避免重复的阈值

  for (const match of matches) {
    // 如果两个匹配位置相差超过 10 字符，认为是不同章节
    if (match.position - lastPosition > 10) {
      uniqueMatches.push(match)
      lastPosition = match.position
    }
  }

  // 创建章节
  for (let i = 0; i < uniqueMatches.length; i++) {
    const match = uniqueMatches[i]
    const nextMatch = uniqueMatches[i + 1]

    chapters.push({
      index: i,
      title: match.title,
      start: match.position,
      end: nextMatch ? nextMatch.position - 1 : content.length - 1,
    })
  }

  return chapters
}

/**
 * 从书籍开头提取书名和作者信息
 *
 * @param {string} content - 全文内容
 * @returns {{ title: string, author: string }}
 */
export function extractBookInfo(content) {
  let title = ''
  let author = ''

  const header = content.slice(0, 2000)

  // 『书名/作者:xxx』格式
  const pattern1 = /『([^/]+)\/作者[:：]([^』]+)』/
  const match1 = header.match(pattern1)
  if (match1) {
    title = match1[1].trim()
    author = match1[2].trim()
    return { title, author }
  }

  // 书名：xxx 格式
  const titlePattern = /书名[：:]\s*(.+)/
  const titleMatch = header.match(titlePattern)
  if (titleMatch) {
    title = titleMatch[1].trim()
  }

  // 作者：xxx 格式
  const authorPattern = /作者[：:]\s*(.+)/
  const authorMatch = header.match(authorPattern)
  if (authorMatch) {
    author = authorMatch[1].trim()
  }

  return { title, author }
}

/**
 * 获取章节内容
 *
 * @param {string} content - 全文内容
 * @param {Chapter} chapter - 章节对象
 * @returns {string} 章节内容
 */
export function getChapterContent(content, chapter) {
  return content.slice(chapter.start, chapter.end + 1)
}

/**
 * 自动检测最匹配的章节模式
 *
 * @param {string} content - 全文内容
 * @returns {RegExp|null} 最匹配的模式
 */
export function detectBestPattern(content) {
  let bestPattern = null
  let maxMatches = 0

  const sample = content.slice(0, 100000)
  const lines = sample.split(/\r?\n/)

  for (const pattern of CHAPTER_PATTERNS) {
    let matches = 0
    for (const line of lines) {
      if (pattern.test(line.trim())) {
        matches++
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches
      bestPattern = pattern
    }
  }

  return bestPattern
}
