/**
 * TXT 文件解析器
 *
 * 整合编码检测和章节识别，提供完整的 TXT 解析流程
 */

import { detectEncoding, decodeToUTF8 } from './encoding.js'
import { detectChapters, extractBookInfo, detectBestPattern } from './chapter-detector.js'
import { createEmptyBook, generateBookId } from '../types/book.js'

/**
 * 解析 TXT 文件
 *
 * @param {File} file - 文件对象
 * @param {Object} [options] - 解析选项
 * @param {string} [options.encoding] - 指定编码（不指定则自动检测）
 * @param {RegExp[]} [options.chapterPatterns] - 自定义章节正则
 * @param {Function} [options.onProgress] - 进度回调 (stage, percent)
 * @returns {Promise<import('../types/book.js').Book>}
 */
export async function parseTxtFile(file, options = {}) {
  const { encoding: specifiedEncoding, chapterPatterns, onProgress } = options

  // 创建空书籍对象
  const book = createEmptyBook()
  book.id = generateBookId()

  // 阶段 1: 读取文件
  onProgress?.('reading', 0)
  const buffer = await readFileAsArrayBuffer(file)
  onProgress?.('reading', 100)

  // 阶段 2: 检测编码
  onProgress?.('detecting_encoding', 0)
  let encoding = specifiedEncoding
  let confidence = 1.0

  if (!encoding) {
    const detected = detectEncoding(buffer)
    encoding = detected.encoding
    confidence = detected.confidence
  }
  onProgress?.('detecting_encoding', 100)

  // 阶段 3: 解码为 UTF-8
  onProgress?.('decoding', 0)
  const { text } = decodeToUTF8(buffer, encoding)
  onProgress?.('decoding', 100)

  // 阶段 4: 提取书籍信息
  onProgress?.('extracting_info', 0)
  const bookInfo = extractBookInfo(text)
  book.title = bookInfo.title || extractTitleFromFilename(file.name)
  book.author = bookInfo.author || ''
  onProgress?.('extracting_info', 100)

  // 阶段 5: 检测章节
  onProgress?.('detecting_chapters', 0)
  const chapters = detectChapters(text, chapterPatterns)
  book.chapters = chapters
  onProgress?.('detecting_chapters', 100)

  // 设置内容和元数据
  book.content = text
  book.metadata = {
    encoding,
    encodingConfidence: confidence,
    fileSize: file.size,
    totalChapters: chapters.length,
    totalCharacters: text.length,
    importedAt: new Date(),
  }

  return book
}

/**
 * 快速预览 TXT 文件（不解析全部内容）
 *
 * 用于快速获取文件基本信息，如书名、编码、预估章节数
 *
 * @param {File} file - 文件对象
 * @returns {Promise<{
 *   title: string,
 *   author: string,
 *   encoding: string,
 *   confidence: number,
 *   estimatedChapters: number,
 *   bestPattern: RegExp|null
 * }>}
 */
export async function previewTxtFile(file) {
  // 只读取前 100KB
  const previewSize = Math.min(file.size, 100 * 1024)
  const blob = file.slice(0, previewSize)
  const buffer = await readFileAsArrayBuffer(blob)

  // 检测编码
  const { encoding, confidence } = detectEncoding(buffer)

  // 解码
  const { text } = decodeToUTF8(buffer, encoding)

  // 提取书籍信息
  const bookInfo = extractBookInfo(text)
  const title = bookInfo.title || extractTitleFromFilename(file.name)

  // 检测最佳章节模式
  const bestPattern = detectBestPattern(text)

  // 估算章节数
  let estimatedChapters = 0
  if (bestPattern) {
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      if (bestPattern.test(line.trim())) {
        estimatedChapters++
      }
    }
    // 根据预览比例估算总数
    if (previewSize < file.size) {
      estimatedChapters = Math.round(estimatedChapters * (file.size / previewSize))
    }
  }

  return {
    title,
    author: bookInfo.author || '',
    encoding,
    confidence,
    estimatedChapters,
    bestPattern,
  }
}

/**
 * 从文件名提取书名
 * @param {string} filename
 * @returns {string}
 */
function extractTitleFromFilename(filename) {
  // 移除扩展名
  let name = filename.replace(/\.txt$/i, '')

  // 移除常见的前缀/后缀
  name = name.replace(/^\[.*?\]/, '') // [xxx]书名
  name = name.replace(/【.*?】/g, '') // 【xxx】
  name = name.replace(/\(.*?\)/g, '') // (xxx)
  name = name.replace(/（.*?）/g, '') // （xxx）

  return name.trim() || filename
}

/**
 * 将 File 读取为 ArrayBuffer
 * @param {Blob} blob
 * @returns {Promise<ArrayBuffer>}
 */
function readFileAsArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(blob)
  })
}

/**
 * 解析进度阶段
 */
export const PARSE_STAGES = {
  reading: '读取文件',
  detecting_encoding: '检测编码',
  decoding: '解码内容',
  extracting_info: '提取信息',
  detecting_chapters: '识别章节',
}
