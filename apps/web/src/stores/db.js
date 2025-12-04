/**
 * IndexedDB 数据库配置
 *
 * 使用 Dexie 管理本地存储
 */

import Dexie from 'dexie'

/**
 * 数据库实例
 */
export const db = new Dexie('NovelReaderDB')

// 定义数据库结构
db.version(1).stores({
  // 书籍表
  // id: 主键
  // title, author: 可搜索
  // importedAt: 可排序
  books: 'id, title, author, importedAt',

  // 阅读进度表
  // bookId: 主键（一本书一条记录）
  readingProgress: 'bookId',
})

// 版本2: 添加书籍内容存储
db.version(2).stores({
  books: 'id, title, author, importedAt',
  readingProgress: 'bookId',
  // 书籍内容表（分离大文本以优化性能）
  bookContents: 'bookId',
})

// 版本3: 添加书签表
db.version(3).stores({
  books: 'id, title, author, importedAt',
  readingProgress: 'bookId',
  bookContents: 'bookId',
  // 书签表
  // id: 主键（自增）
  // bookId: 书籍ID（可查询）
  // createdAt: 创建时间（可排序）
  bookmarks: '++id, bookId, createdAt',
})

/**
 * 书籍存储操作
 */
export const booksStore = {
  /**
   * 添加书籍
   * @param {import('@novel-reader/core').Book} book
   */
  async add(book) {
    const { content, ...bookMeta } = book

    console.log('[DB] 开始保存书籍:', book.id, '内容长度:', content?.length)

    try {
      // 使用事务确保数据一致性
      await db.transaction('rw', db.books, db.bookContents, async () => {
        console.log('[DB] 保存元数据...')
        // 存储书籍元数据（确保 importedAt 在顶层以便索引）
        await db.books.add({
          ...bookMeta,
          hasContent: true,
          importedAt: bookMeta.metadata?.importedAt || new Date(),
        })

        console.log('[DB] 保存内容...')
        // 存储内容（大文本）到 IndexedDB
        await db.bookContents.add({
          bookId: book.id,
          content: content,
        })
      })

      console.log('[DB] 保存成功!')
      return book.id
    } catch (error) {
      console.error('[DB] 保存失败:', error)
      throw error
    }
  },

  /**
   * 获取所有书籍（不含内容）
   */
  async getAll() {
    try {
      const books = await db.books.orderBy('importedAt').reverse().toArray()
      console.log('[DB] 获取书籍列表，数量:', books.length)
      return books
    } catch (error) {
      console.error('[DB] 获取书籍列表失败:', error)
      // 回退：不排序直接获取
      const books = await db.books.toArray()
      console.log('[DB] 回退获取书籍列表，数量:', books.length)
      return books
    }
  },

  /**
   * 获取书籍详情（含内容）
   * @param {string} id
   */
  async getById(id) {
    const book = await db.books.get(id)
    if (!book) return null

    // 从 IndexedDB 获取内容
    const contentRecord = await db.bookContents.get(id)
    const content = contentRecord?.content || ''

    return { ...book, content }
  },

  /**
   * 删除书籍
   * @param {string} id
   */
  async delete(id) {
    await db.transaction('rw', db.books, db.bookContents, async () => {
      await db.books.delete(id)
      await db.bookContents.delete(id)
    })
  },

  /**
   * 更新书籍信息
   * @param {string} id
   * @param {Partial<Book>} updates
   */
  async update(id, updates) {
    const { content, ...rest } = updates

    await db.transaction('rw', db.books, db.bookContents, async () => {
      if (content !== undefined) {
        await db.bookContents.put({ bookId: id, content })
      }
      if (Object.keys(rest).length > 0) {
        await db.books.update(id, rest)
      }
    })
  },

  /**
   * 搜索书籍
   * @param {string} query
   */
  async search(query) {
    const lowerQuery = query.toLowerCase()
    return db.books
      .filter(
        (book) =>
          book.title.toLowerCase().includes(lowerQuery) ||
          book.author?.toLowerCase().includes(lowerQuery)
      )
      .toArray()
  },
}

/**
 * 阅读进度存储操作
 */
export const progressStore = {
  /**
   * 保存阅读进度
   * @param {string} bookId
   * @param {Object} progress
   */
  async save(bookId, progress) {
    await db.readingProgress.put({
      bookId,
      ...progress,
      updatedAt: new Date(),
    })
  },

  /**
   * 获取阅读进度
   * @param {string} bookId
   */
  async get(bookId) {
    return db.readingProgress.get(bookId)
  },

  /**
   * 获取所有阅读进度
   * @returns {Promise<Object>} - 以 bookId 为键的进度对象
   */
  async getAll() {
    const progressList = await db.readingProgress.toArray()
    const progressMap = {}
    for (const progress of progressList) {
      progressMap[progress.bookId] = progress
    }
    return progressMap
  },

  /**
   * 删除阅读进度
   * @param {string} bookId
   */
  async delete(bookId) {
    await db.readingProgress.delete(bookId)
  },
}

/**
 * 书签存储操作
 */
export const bookmarksStore = {
  /**
   * 添加书签
   * @param {Object} bookmark
   * @param {string} bookmark.bookId - 书籍ID
   * @param {number} bookmark.chapterIndex - 章节索引
   * @param {string} bookmark.chapterTitle - 章节标题
   * @param {number} bookmark.position - 文本位置
   * @param {string} bookmark.excerpt - 摘录文本（用于预览）
   * @param {string} [bookmark.note] - 备注
   */
  async add(bookmark) {
    const id = await db.bookmarks.add({
      ...bookmark,
      createdAt: new Date(),
    })
    return id
  },

  /**
   * 获取书籍的所有书签
   * @param {string} bookId
   */
  async getByBookId(bookId) {
    return db.bookmarks
      .where('bookId')
      .equals(bookId)
      .reverse()
      .sortBy('createdAt')
  },

  /**
   * 获取所有书签（按时间倒序）
   */
  async getAll() {
    return db.bookmarks.orderBy('createdAt').reverse().toArray()
  },

  /**
   * 删除书签
   * @param {number} id
   */
  async delete(id) {
    await db.bookmarks.delete(id)
  },

  /**
   * 删除书籍的所有书签
   * @param {string} bookId
   */
  async deleteByBookId(bookId) {
    await db.bookmarks.where('bookId').equals(bookId).delete()
  },

  /**
   * 更新书签备注
   * @param {number} id
   * @param {string} note
   */
  async updateNote(id, note) {
    await db.bookmarks.update(id, { note })
  },

  /**
   * 检查是否已有相同位置的书签
   * @param {string} bookId
   * @param {number} chapterIndex
   * @param {number} position
   */
  async exists(bookId, chapterIndex, position) {
    const bookmark = await db.bookmarks
      .where('bookId')
      .equals(bookId)
      .filter(
        (b) => b.chapterIndex === chapterIndex && b.position === position
      )
      .first()
    return bookmark || null
  },
}
