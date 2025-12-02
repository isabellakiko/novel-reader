/**
 * 搜索 Web Worker
 *
 * 在后台线程执行搜索，避免阻塞主线程
 * 支持多种搜索模式：
 * - overview: 章节概览，每章仅显示1条
 * - detailed: 详细搜索，显示所有匹配
 * - frequency: 频率统计，只统计次数
 * - timeline: 时间线，按顺序平铺展示
 */

// 当前搜索任务 ID（用于取消）
let currentSearchId = null

/**
 * 检测字符串是否包含 CJK（中日韩）字符
 */
function hasCJK(str) {
  return /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(str)
}

function createSearchPattern(query, options) {
  let pattern = query

  if (!options.useRegex) {
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  if (options.wholeWord) {
    if (hasCJK(query)) {
      pattern = `(?<![\\w\\u4e00-\\u9fff])${pattern}(?![\\w\\u4e00-\\u9fff])`
    } else {
      pattern = `\\b${pattern}\\b`
    }
  }

  const flags = options.caseSensitive ? 'g' : 'gi'
  return new RegExp(pattern, flags)
}

function buildChapterIndex(chapters) {
  const boundaries = chapters.map((ch, i) => ({
    start: ch.start,
    end: ch.end,
    index: i,
  }))

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

function extractContext(content, matchStart, matchLength, contextLength) {
  let contextStart = Math.max(0, matchStart - contextLength)
  let contextEnd = Math.min(content.length, matchStart + matchLength + contextLength)

  while (contextStart > 0 && contextStart < matchStart) {
    const char = content[contextStart - 1]
    if (char === '\n' || char === '\r') break
    contextStart--
    if (matchStart - contextStart > contextLength * 1.5) {
      contextStart = Math.max(0, matchStart - contextLength)
      break
    }
  }

  while (contextEnd < content.length) {
    const char = content[contextEnd]
    if (char === '\n' || char === '\r') break
    contextEnd++
    if (contextEnd - (matchStart + matchLength) > contextLength * 1.5) {
      contextEnd = Math.min(content.length, matchStart + matchLength + contextLength)
      break
    }
  }

  let context = content.slice(contextStart, contextEnd)
  context = context.replace(/[\r\n]+/g, ' ').trim()

  if (contextStart > 0) context = '...' + context
  if (contextEnd < content.length) context = context + '...'

  let matchOffset = matchStart - contextStart
  if (contextStart > 0) matchOffset += 3

  return { context, matchOffset }
}

function getLineNumber(content, position) {
  let lineNumber = 1
  for (let i = 0; i < position && i < content.length; i++) {
    if (content[i] === '\n') lineNumber++
  }
  return lineNumber
}

/**
 * 搜索单本书籍
 * @param {Object} book - 书籍对象
 * @param {string} query - 搜索词
 * @param {Object} options - 搜索选项
 * @param {string} searchMode - 搜索模式
 * @param {string} searchId - 搜索ID
 */
function searchBook(book, query, options, searchMode, searchId) {
  const opts = {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    contextLength: 60,
    ...options,
  }

  // 根据模式调整限制
  const limits = {
    overview: { maxResults: 10000, maxResultsPerChapter: 1 },
    detailed: { maxResults: 2000, maxResultsPerChapter: 100 },
    frequency: { maxResults: 100000, maxResultsPerChapter: 10000 }, // 只计数，不限制
    timeline: { maxResults: 500, maxResultsPerChapter: 50 },
  }

  const modeLimit = limits[searchMode] || limits.detailed
  opts.maxResults = modeLimit.maxResults
  opts.maxResultsPerChapter = modeLimit.maxResultsPerChapter

  const { content, chapters } = book

  let pattern
  try {
    pattern = createSearchPattern(query, opts)
  } catch (e) {
    return {
      bookId: book.id,
      bookTitle: book.title,
      totalMatches: 0,
      chapters: [],
      error: '无效的搜索模式',
    }
  }

  const findChapter = buildChapterIndex(chapters)
  const chapterResults = new Map()
  const chapterCounts = new Map() // 用于 frequency 模式
  let totalMatches = 0
  let lastProgressReport = 0

  let match
  while ((match = pattern.exec(content)) !== null) {
    if (currentSearchId !== searchId) {
      return null
    }

    const position = match.index
    const matchText = match[0]
    const matchLength = matchText.length

    const chapterIndex = findChapter(position)
    if (chapterIndex === -1) continue

    const chapter = chapters[chapterIndex]

    // 更新计数
    chapterCounts.set(chapterIndex, (chapterCounts.get(chapterIndex) || 0) + 1)
    totalMatches++

    // frequency 模式只计数，不存储详情
    if (searchMode === 'frequency') {
      if (!chapterResults.has(chapterIndex)) {
        chapterResults.set(chapterIndex, {
          chapterIndex,
          chapterTitle: chapter.title,
          count: 0,
          matches: [],
        })
      }
      chapterResults.get(chapterIndex).count++
      continue
    }

    // 检查每章限制
    if (!chapterResults.has(chapterIndex)) {
      chapterResults.set(chapterIndex, {
        chapterIndex,
        chapterTitle: chapter.title,
        count: 0,
        matches: [],
      })
    }

    const chapterResult = chapterResults.get(chapterIndex)
    chapterResult.count++

    // overview 模式每章只保留第一条
    if (searchMode === 'overview' && chapterResult.matches.length >= 1) {
      continue
    }

    if (chapterResult.matches.length >= opts.maxResultsPerChapter) {
      continue
    }

    if (totalMatches > opts.maxResults) {
      break
    }

    const { context, matchOffset } = extractContext(
      content,
      position,
      matchLength,
      opts.contextLength
    )

    const lineNumber = getLineNumber(content, position)

    chapterResult.matches.push({
      position,
      lineNumber,
      context,
      matchOffset,
      matchLength,
    })

    // 报告进度
    const progress = Math.floor((position / content.length) * 100)
    if (progress - lastProgressReport >= 10) {
      self.postMessage({
        type: 'progress',
        searchId,
        bookId: book.id,
        progress,
      })
      lastProgressReport = progress
    }
  }

  let sortedChapters = Array.from(chapterResults.values())

  // frequency 模式按出现次数排序（降序）
  if (searchMode === 'frequency') {
    sortedChapters.sort((a, b) => b.count - a.count)
  } else {
    // 其他模式按章节顺序排序
    sortedChapters.sort((a, b) => a.chapterIndex - b.chapterIndex)
  }

  return {
    bookId: book.id,
    bookTitle: book.title,
    totalMatches,
    totalChaptersWithMatches: chapterResults.size,
    chapters: sortedChapters,
  }
}

/**
 * 处理消息
 */
self.onmessage = function (e) {
  const { type, searchId, books, query, options, searchMode = 'overview' } = e.data

  switch (type) {
    case 'search':
      currentSearchId = searchId

      self.postMessage({
        type: 'started',
        searchId,
        totalBooks: books.length,
        searchMode,
      })

      const results = []

      for (let i = 0; i < books.length; i++) {
        if (currentSearchId !== searchId) {
          self.postMessage({
            type: 'cancelled',
            searchId,
          })
          return
        }

        const book = books[i]
        const result = searchBook(book, query, options, searchMode, searchId)

        if (result === null) {
          self.postMessage({
            type: 'cancelled',
            searchId,
          })
          return
        }

        if (result.totalMatches > 0) {
          results.push(result)

          self.postMessage({
            type: 'partial',
            searchId,
            result,
            bookIndex: i,
            totalBooks: books.length,
            searchMode,
          })
        }

        self.postMessage({
          type: 'bookComplete',
          searchId,
          bookIndex: i,
          totalBooks: books.length,
          overallProgress: Math.floor(((i + 1) / books.length) * 100),
        })
      }

      self.postMessage({
        type: 'complete',
        searchId,
        results,
        totalMatches: results.reduce((sum, r) => sum + r.totalMatches, 0),
        totalChaptersWithMatches: results.reduce((sum, r) => sum + r.totalChaptersWithMatches, 0),
        searchMode,
      })
      break

    case 'cancel':
      if (currentSearchId === searchId) {
        currentSearchId = null
      }
      break
  }
}
