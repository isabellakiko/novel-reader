/**
 * Book 数据结构定义
 *
 * 这是整个阅读器的核心数据结构，所有解析后的书籍都遵循此格式。
 */

/**
 * 章节结构
 * @typedef {Object} Chapter
 * @property {number} index - 章节序号（从 0 开始）
 * @property {string} title - 章节标题（如 "第1章：被曝光的情书"）
 * @property {number} start - 章节在全文中的起始位置（字符索引）
 * @property {number} end - 章节在全文中的结束位置（字符索引）
 */

/**
 * 书籍元数据
 * @typedef {Object} BookMetadata
 * @property {string} encoding - 文件原始编码（如 "GBK", "UTF-8"）
 * @property {number} fileSize - 文件大小（字节）
 * @property {number} totalChapters - 章节总数
 * @property {number} totalCharacters - 字符总数
 * @property {Date} importedAt - 导入时间
 */

/**
 * 书籍结构
 * @typedef {Object} Book
 * @property {string} id - 唯一标识（使用 crypto.randomUUID 或时间戳生成）
 * @property {string} title - 书名
 * @property {string} author - 作者（如果能识别）
 * @property {string} content - 全文内容（UTF-8）
 * @property {Chapter[]} chapters - 章节列表
 * @property {BookMetadata} metadata - 元数据
 */

/**
 * 创建空的 Book 对象
 * @returns {Book}
 */
export function createEmptyBook() {
  return {
    id: '',
    title: '',
    author: '',
    content: '',
    chapters: [],
    metadata: {
      encoding: '',
      fileSize: 0,
      totalChapters: 0,
      totalCharacters: 0,
      importedAt: new Date(),
    },
  }
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
export function generateBookId() {
  // 优先使用 crypto.randomUUID，降级使用时间戳
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `book_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
