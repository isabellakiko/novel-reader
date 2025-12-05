/**
 * 数据导出工具
 *
 * 支持导出书籍、书签、阅读记录等数据
 */

import { db } from '../stores/db'

/**
 * 下载文件
 */
function downloadFile(content, filename, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 格式化日期
 */
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0]
}

/**
 * 导出书籍列表（不含内容）
 */
export async function exportBookList() {
  const books = await db.books.toArray()

  const exportData = books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    chapterCount: book.chapters?.length || 0,
    importedAt: book.importedAt,
  }))

  const filename = `novel-reader-books-${formatDate(new Date())}.json`
  downloadFile(JSON.stringify(exportData, null, 2), filename)

  return exportData.length
}

/**
 * 导出单本书籍（含内容）
 */
export async function exportBook(bookId) {
  const book = await db.books.get(bookId)
  if (!book) throw new Error('书籍不存在')

  const content = await db.bookContents.get(bookId)

  const exportData = {
    ...book,
    content: content?.content || '',
    exportedAt: new Date().toISOString(),
  }

  const safeTitle = book.title.replace(/[<>:"/\\|?*]/g, '_')
  const filename = `${safeTitle}.json`
  downloadFile(JSON.stringify(exportData, null, 2), filename)

  return true
}

/**
 * 导出书籍为 TXT 格式
 */
export async function exportBookAsTxt(bookId) {
  const book = await db.books.get(bookId)
  if (!book) throw new Error('书籍不存在')

  const contentRecord = await db.bookContents.get(bookId)
  const content = contentRecord?.content || ''

  // 如果有章节信息，按章节格式化
  let txtContent = `${book.title}\n`
  if (book.author) {
    txtContent += `作者：${book.author}\n`
  }
  txtContent += '\n' + '='.repeat(50) + '\n\n'

  if (book.chapters && book.chapters.length > 0) {
    for (const chapter of book.chapters) {
      txtContent += `\n${chapter.title}\n\n`
      if (chapter.lines) {
        txtContent += chapter.lines.join('\n\n')
      }
      txtContent += '\n\n'
    }
  } else {
    txtContent += content
  }

  const safeTitle = book.title.replace(/[<>:"/\\|?*]/g, '_')
  const filename = `${safeTitle}.txt`
  downloadFile(txtContent, filename, 'text/plain;charset=utf-8')

  return true
}

/**
 * 导出所有书签
 */
export async function exportBookmarks() {
  const bookmarks = await db.bookmarks.toArray()
  const books = await db.books.toArray()

  // 创建书籍 ID -> 标题映射
  const bookTitleMap = {}
  books.forEach((book) => {
    bookTitleMap[book.id] = book.title
  })

  const exportData = bookmarks.map((bookmark) => ({
    id: bookmark.id,
    bookId: bookmark.bookId,
    bookTitle: bookTitleMap[bookmark.bookId] || '未知书籍',
    chapterIndex: bookmark.chapterIndex,
    chapterTitle: bookmark.chapterTitle,
    excerpt: bookmark.excerpt,
    note: bookmark.note,
    createdAt: bookmark.createdAt,
  }))

  const filename = `novel-reader-bookmarks-${formatDate(new Date())}.json`
  downloadFile(JSON.stringify(exportData, null, 2), filename)

  return exportData.length
}

/**
 * 导出书签为 Markdown 格式
 */
export async function exportBookmarksAsMarkdown() {
  const bookmarks = await db.bookmarks.toArray()
  const books = await db.books.toArray()

  const bookTitleMap = {}
  books.forEach((book) => {
    bookTitleMap[book.id] = book.title
  })

  // 按书籍分组
  const grouped = {}
  bookmarks.forEach((bookmark) => {
    const bookTitle = bookTitleMap[bookmark.bookId] || '未知书籍'
    if (!grouped[bookTitle]) {
      grouped[bookTitle] = []
    }
    grouped[bookTitle].push(bookmark)
  })

  let markdown = '# 我的书签\n\n'
  markdown += `导出时间：${new Date().toLocaleString()}\n\n`

  for (const [bookTitle, bookBookmarks] of Object.entries(grouped)) {
    markdown += `## ${bookTitle}\n\n`

    for (const bookmark of bookBookmarks) {
      markdown += `### ${bookmark.chapterTitle}\n\n`
      if (bookmark.excerpt) {
        markdown += `> ${bookmark.excerpt}\n\n`
      }
      if (bookmark.note) {
        markdown += `**备注：** ${bookmark.note}\n\n`
      }
      markdown += `---\n\n`
    }
  }

  const filename = `novel-reader-bookmarks-${formatDate(new Date())}.md`
  downloadFile(markdown, filename, 'text/markdown;charset=utf-8')

  return bookmarks.length
}

/**
 * 导出阅读统计
 */
export async function exportReadingStats() {
  const stats = await db.readingStats.toArray()
  const books = await db.books.toArray()

  const bookTitleMap = {}
  books.forEach((book) => {
    bookTitleMap[book.id] = book.title
  })

  const exportData = stats.map((stat) => ({
    date: stat.date,
    bookId: stat.bookId,
    bookTitle: bookTitleMap[stat.bookId] || '未知书籍',
    durationMinutes: Math.round(stat.duration / 60),
    characters: stat.characters,
  }))

  const filename = `novel-reader-stats-${formatDate(new Date())}.json`
  downloadFile(JSON.stringify(exportData, null, 2), filename)

  return exportData.length
}

/**
 * 导出阅读统计为 CSV 格式
 */
export async function exportReadingStatsAsCsv() {
  const stats = await db.readingStats.toArray()
  const books = await db.books.toArray()

  const bookTitleMap = {}
  books.forEach((book) => {
    bookTitleMap[book.id] = book.title
  })

  let csv = '日期,书籍,阅读时长(分钟),阅读字数\n'

  stats.forEach((stat) => {
    const bookTitle = (bookTitleMap[stat.bookId] || '未知书籍').replace(/,/g, '，')
    const minutes = Math.round(stat.duration / 60)
    csv += `${stat.date},"${bookTitle}",${minutes},${stat.characters}\n`
  })

  const filename = `novel-reader-stats-${formatDate(new Date())}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8')

  return stats.length
}

/**
 * 导出所有数据（完整备份）
 */
export async function exportAllData() {
  const [books, bookContents, progress, bookmarks, stats] = await Promise.all([
    db.books.toArray(),
    db.bookContents.toArray(),
    db.readingProgress.toArray(),
    db.bookmarks.toArray(),
    db.readingStats.toArray(),
  ])

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      books,
      bookContents,
      readingProgress: progress,
      bookmarks,
      readingStats: stats,
    },
  }

  const filename = `novel-reader-backup-${formatDate(new Date())}.json`
  downloadFile(JSON.stringify(exportData), filename)

  return {
    books: books.length,
    bookmarks: bookmarks.length,
    stats: stats.length,
  }
}

// =====================
// 数据导入功能
// =====================

/**
 * 读取文件内容
 */
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

/**
 * 验证备份数据格式
 */
function validateBackupData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('无效的备份文件格式')
  }

  if (!data.version) {
    throw new Error('备份文件缺少版本信息')
  }

  if (!data.data) {
    throw new Error('备份文件缺少数据')
  }

  return true
}

/**
 * 导入完整备份
 * @param {File} file - 备份文件
 * @param {Object} options - 导入选项
 * @param {boolean} options.overwrite - 是否覆盖已存在的数据
 * @param {boolean} options.skipBooks - 是否跳过书籍数据
 * @param {boolean} options.skipProgress - 是否跳过阅读进度
 * @param {boolean} options.skipBookmarks - 是否跳过书签
 * @param {boolean} options.skipStats - 是否跳过统计数据
 */
export async function importBackupData(file, options = {}) {
  const {
    overwrite = false,
    skipBooks = false,
    skipProgress = false,
    skipBookmarks = false,
    skipStats = false,
  } = options

  // 读取文件
  const content = await readFileContent(file)
  let data

  try {
    data = JSON.parse(content)
  } catch (e) {
    throw new Error('备份文件解析失败，请确保是有效的 JSON 文件')
  }

  // 验证格式
  validateBackupData(data)

  const result = {
    books: { imported: 0, skipped: 0 },
    bookmarks: { imported: 0, skipped: 0 },
    progress: { imported: 0, skipped: 0 },
    stats: { imported: 0, skipped: 0 },
  }

  const backupData = data.data

  // 导入书籍和内容
  if (!skipBooks && backupData.books) {
    for (const book of backupData.books) {
      const existingBook = await db.books.get(book.id)
      if (existingBook && !overwrite) {
        result.books.skipped++
        continue
      }

      await db.books.put(book)
      result.books.imported++

      // 导入书籍内容
      const bookContent = backupData.bookContents?.find(c => c.id === book.id)
      if (bookContent) {
        await db.bookContents.put(bookContent)
      }
    }
  }

  // 导入阅读进度
  if (!skipProgress && backupData.readingProgress) {
    for (const progress of backupData.readingProgress) {
      const existing = await db.readingProgress.get(progress.bookId)
      if (existing && !overwrite) {
        result.progress.skipped++
        continue
      }

      await db.readingProgress.put(progress)
      result.progress.imported++
    }
  }

  // 导入书签
  if (!skipBookmarks && backupData.bookmarks) {
    for (const bookmark of backupData.bookmarks) {
      const existing = await db.bookmarks.get(bookmark.id)
      if (existing && !overwrite) {
        result.bookmarks.skipped++
        continue
      }

      await db.bookmarks.put(bookmark)
      result.bookmarks.imported++
    }
  }

  // 导入阅读统计
  if (!skipStats && backupData.readingStats) {
    for (const stat of backupData.readingStats) {
      // 统计数据使用复合键 (date + bookId)
      const key = `${stat.date}_${stat.bookId}`
      const existing = await db.readingStats.get(stat.id || key)
      if (existing && !overwrite) {
        result.stats.skipped++
        continue
      }

      await db.readingStats.put(stat)
      result.stats.imported++
    }
  }

  return result
}

/**
 * 导入单本书籍
 * @param {File} file - 书籍文件 (JSON 格式)
 */
export async function importBook(file) {
  const content = await readFileContent(file)
  let bookData

  try {
    bookData = JSON.parse(content)
  } catch (e) {
    throw new Error('文件解析失败，请确保是有效的 JSON 文件')
  }

  if (!bookData.id || !bookData.title) {
    throw new Error('无效的书籍文件格式')
  }

  // 检查是否已存在
  const existing = await db.books.get(bookData.id)
  if (existing) {
    throw new Error(`书籍 "${bookData.title}" 已存在`)
  }

  // 分离内容和元数据
  const { content: bookContent, ...bookMeta } = bookData

  // 保存书籍元数据
  await db.books.add(bookMeta)

  // 保存书籍内容
  if (bookContent) {
    await db.bookContents.add({
      id: bookData.id,
      content: bookContent,
    })
  }

  return bookData.title
}

/**
 * 获取备份文件预览信息
 * @param {File} file - 备份文件
 */
export async function previewBackupFile(file) {
  const content = await readFileContent(file)
  let data

  try {
    data = JSON.parse(content)
  } catch (e) {
    throw new Error('文件解析失败')
  }

  validateBackupData(data)

  const backupData = data.data

  return {
    version: data.version,
    exportedAt: data.exportedAt,
    counts: {
      books: backupData.books?.length || 0,
      bookContents: backupData.bookContents?.length || 0,
      readingProgress: backupData.readingProgress?.length || 0,
      bookmarks: backupData.bookmarks?.length || 0,
      readingStats: backupData.readingStats?.length || 0,
    },
    bookTitles: backupData.books?.map(b => b.title).slice(0, 10) || [],
  }
}
