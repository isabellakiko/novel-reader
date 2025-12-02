/**
 * 章节识别模块
 *
 * 支持多种常见章节格式的自动识别
 */

/**
 * 预设的章节正则模式（按优先级排序）
 * 每个模式需要匹配整行章节标题
 */
export const CHAPTER_PATTERNS = [
  // 第X章 / 第X章：标题 / 第X章:标题
  /^第[0-9]+章[：:\s]*.*/,

  // 第一章 / 第一百二十三章（中文数字）
  /^第[零一二三四五六七八九十百千万]+章[：:\s]*.*/,

  // Chapter X / Chapter X: Title
  /^Chapter\s+\d+[：:\s]*.*/i,

  // 第X节
  /^第[0-9]+节[：:\s]*.*/,
  /^第[零一二三四五六七八九十百千万]+节[：:\s]*.*/,

  // 第X回
  /^第[0-9]+回[：:\s]*.*/,
  /^第[零一二三四五六七八九十百千万]+回[：:\s]*.*/,

  // 【第X章】标题
  /^【第[0-9]+章】.*/,
  /^【第[零一二三四五六七八九十百千万]+章】.*/,

  // 卷X 第X章
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
 * 检测章节
 *
 * @param {string} content - 全文内容
 * @param {RegExp[]} [customPatterns] - 自定义正则模式（可选）
 * @returns {Chapter[]} 章节列表
 */
export function detectChapters(content, customPatterns) {
  const patterns = customPatterns || CHAPTER_PATTERNS
  const chapters = []

  // 按行分割内容
  const lines = content.split(/\r?\n/)

  let currentPosition = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // 检查是否匹配任何章节模式
    const isChapter = patterns.some((pattern) => pattern.test(trimmedLine))

    if (isChapter && trimmedLine.length > 0) {
      // 如果有前一章，设置它的结束位置
      if (chapters.length > 0) {
        chapters[chapters.length - 1].end = currentPosition - 1
      }

      // 添加新章节
      chapters.push({
        index: chapters.length,
        title: trimmedLine,
        start: currentPosition,
        end: -1, // 稍后设置
      })
    }

    // 更新位置（+1 是换行符）
    currentPosition += line.length + 1
  }

  // 设置最后一章的结束位置
  if (chapters.length > 0) {
    chapters[chapters.length - 1].end = content.length - 1
  }

  return chapters
}

/**
 * 从书籍开头提取书名和作者信息
 *
 * 尝试匹配常见格式：
 * - 『书名/作者:xxx』
 * - 书名：xxx
 * - 作者：xxx
 *
 * @param {string} content - 全文内容
 * @returns {{ title: string, author: string }}
 */
export function extractBookInfo(content) {
  let title = ''
  let author = ''

  // 只检查前 2000 个字符
  const header = content.slice(0, 2000)

  // 尝试匹配 『书名/作者:xxx』格式
  const pattern1 = /『([^/]+)\/作者[:：]([^』]+)』/
  const match1 = header.match(pattern1)
  if (match1) {
    title = match1[1].trim()
    author = match1[2].trim()
    return { title, author }
  }

  // 尝试匹配 书名：xxx 格式
  const titlePattern = /书名[：:]\s*(.+)/
  const titleMatch = header.match(titlePattern)
  if (titleMatch) {
    title = titleMatch[1].trim()
  }

  // 尝试匹配 作者：xxx 格式
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
 * 通过统计每个模式的匹配数量，返回匹配最多的模式
 *
 * @param {string} content - 全文内容
 * @returns {RegExp|null} 最匹配的模式
 */
export function detectBestPattern(content) {
  let bestPattern = null
  let maxMatches = 0

  // 只检查前 100KB 内容（足够判断模式）
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
