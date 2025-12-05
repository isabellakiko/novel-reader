/**
 * 章节识别模块
 *
 * 支持多种常见章节格式的自动识别
 * 包括行首章节和行内嵌入章节
 */

/**
 * 章节标题的核心正则（不含行首锚点，用于全文搜索）
 * 使用非贪心匹配 *? 避免吃掉过多内容
 * 遇到句号、问号、感叹号等标点时停止
 */
const CHAPTER_CORE_PATTERNS = [
  // 第X章 / 第X章：标题 / 第X章:标题 / 第X章标题（阿拉伯数字）
  /第[0-9]+章[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,

  // 第一章 / 第一百二十三章（中文数字）
  /第[零一二三四五六七八九十百千万]+章[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,

  // Chapter X / Chapter X: Title
  /Chapter\s+\d+[：:\s]?[^.!?\n]{0,60}?(?=[.!?\n]|$)/gi,

  // 第X节
  /第[0-9]+节[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,
  /第[零一二三四五六七八九十百千万]+节[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,

  // 第X回
  /第[0-9]+回[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,
  /第[零一二三四五六七八九十百千万]+回[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,

  // 【第X章】标题
  /【第[0-9]+章】[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,
  /【第[零一二三四五六七八九十百千万]+章】[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,

  // 卷X 第X章
  /卷[0-9一二三四五六七八九十]+\s*第[0-9一二三四五六七八九十百千万]+章[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,

  // 第X部
  /第[0-9一二三四五六七八九十百千万]+部[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,

  // 序章、终章、尾声等特殊章节
  /(?:序章|序幕|楔子|引子|终章|尾声|番外)[：:\s]?[^。！？\n]{0,50}?(?=[。！？\n]|$)/g,
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
  /^第[0-9一二三四五六七八九十百千万]+部[：:\s]?.*/,
  /^(?:序章|序幕|楔子|引子|终章|尾声|番外)[：:\s]?.*/,
]

/**
 * 计算两个章节标题之间的最小合理距离
 * 基于标题长度动态计算，避免硬编码阈值
 * @param {string} title - 章节标题
 * @returns {number} 最小距离
 */
function getMinChapterDistance(title) {
  // 基础距离：标题长度 + 一些缓冲（至少 20 字符，最多 100 字符）
  return Math.min(100, Math.max(20, title.length + 10))
}

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
 * 1. 先尝试行首检测（传统格式，更精确）
 * 2. 如果结果太少，尝试全文搜索（嵌入式章节）
 * 3. 基于质量而非数量选择最佳结果
 *
 * @param {string} content - 全文内容
 * @param {RegExp[]} [customPatterns] - 自定义正则模式（可选）
 * @returns {Chapter[]} 章节列表
 */
export function detectChapters(content, customPatterns) {
  // 先尝试行首检测（更精确，传统格式）
  const lineBasedChapters = detectChaptersLineStart(content, customPatterns)

  // 如果行首检测效果好（检测到足够多章节且分布合理），直接使用
  if (lineBasedChapters.length >= 10) {
    // 检查章节分布是否合理（平均每章至少 500 字符）
    const avgChapterLength = content.length / lineBasedChapters.length
    if (avgChapterLength >= 500) {
      return lineBasedChapters
    }
  }

  // 尝试全文搜索
  const inlineChapters = detectChaptersInline(content)

  // 如果都没检测到，返回空数组
  if (lineBasedChapters.length === 0 && inlineChapters.length === 0) {
    return []
  }

  // 选择策略：基于质量评分而非简单数量比较
  const lineScore = scoreChapterDetection(lineBasedChapters, content.length)
  const inlineScore = scoreChapterDetection(inlineChapters, content.length)

  return lineScore >= inlineScore ? lineBasedChapters : inlineChapters
}

/**
 * 评估章节检测质量
 * @param {Chapter[]} chapters - 章节列表
 * @param {number} contentLength - 全文长度
 * @returns {number} 质量分数
 */
function scoreChapterDetection(chapters, contentLength) {
  if (chapters.length === 0) return 0

  // 评分因素：
  // 1. 章节数量（适中为佳，太多可能是误检测）
  // 2. 章节长度分布（均匀为佳）
  // 3. 覆盖率（章节总长度 / 全文长度）

  const avgLength = contentLength / chapters.length
  const idealAvgLength = 5000 // 理想平均章节长度

  // 数量分数：章节数在合理范围内得分高
  const countScore = Math.min(chapters.length / 10, 10)

  // 长度分数：平均长度接近理想值得分高
  const lengthScore = 10 - Math.min(10, Math.abs(avgLength - idealAvgLength) / 1000)

  // 覆盖率分数
  const totalCovered = chapters.reduce((sum, ch) => sum + (ch.end - ch.start), 0)
  const coverageScore = (totalCovered / contentLength) * 10

  return countScore + lengthScore + coverageScore
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
      // 截断过长的标题（增加到 80 字符）
      if (title.length > 80) {
        title = title.slice(0, 80) + '...'
      }

      matches.push({
        title,
        position: match.index,
        length: match[0].length,
      })
    }
  }

  // 按位置排序并去重（同一位置只保留一个）
  matches.sort((a, b) => a.position - b.position)

  const uniqueMatches = []
  let lastMatch = null

  for (const match of matches) {
    if (!lastMatch) {
      uniqueMatches.push(match)
      lastMatch = match
      continue
    }

    // 使用动态距离判断：基于上一个匹配的长度计算最小距离
    const minDistance = getMinChapterDistance(lastMatch.title)

    // 如果两个匹配位置相差超过最小距离，认为是不同章节
    if (match.position - lastMatch.position > minDistance) {
      uniqueMatches.push(match)
      lastMatch = match
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
