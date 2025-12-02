/**
 * 编码检测与转换模块
 *
 * 支持检测和转换以下编码：
 * - UTF-8
 * - GBK / GB2312 / GB18030
 * - Big5
 * - ASCII
 */

import jschardet from 'jschardet'
import iconv from 'iconv-lite'

/**
 * 支持的编码列表（按优先级排序）
 */
export const SUPPORTED_ENCODINGS = [
  'UTF-8',
  'GBK',
  'GB2312',
  'GB18030',
  'Big5',
  'ASCII',
]

/**
 * 编码别名映射（统一为标准名称）
 */
const ENCODING_ALIASES = {
  'utf-8': 'UTF-8',
  'utf8': 'UTF-8',
  'gbk': 'GBK',
  'gb2312': 'GBK', // GB2312 是 GBK 的子集
  'gb18030': 'GB18030',
  'big5': 'Big5',
  'ascii': 'ASCII',
  'iso-8859-1': 'GBK', // 常被误识别为 ISO-8859-1 的 GBK 文件
  'windows-1252': 'GBK', // 同上
}

/**
 * 标准化编码名称
 * @param {string} encoding
 * @returns {string}
 */
function normalizeEncoding(encoding) {
  if (!encoding) return 'UTF-8'
  const lower = encoding.toLowerCase()
  return ENCODING_ALIASES[lower] || encoding.toUpperCase()
}

/**
 * 检测 ArrayBuffer 的编码
 *
 * @param {ArrayBuffer} buffer - 文件内容
 * @returns {{ encoding: string, confidence: number }}
 *   - encoding: 检测到的编码（已标准化）
 *   - confidence: 置信度 (0-1)
 */
export function detectEncoding(buffer) {
  // 将 ArrayBuffer 转为 Uint8Array
  const uint8Array = new Uint8Array(buffer)

  // 只检测前 64KB（足够准确且快速）
  const sampleSize = Math.min(uint8Array.length, 65536)
  const sample = uint8Array.slice(0, sampleSize)

  // 先检查 BOM（Byte Order Mark）
  const bomEncoding = detectBOM(sample)
  if (bomEncoding) {
    return { encoding: bomEncoding, confidence: 1.0 }
  }

  // 使用 jschardet 检测
  // 需要转换为 binary string 供 jschardet 使用
  let binaryString = ''
  for (let i = 0; i < sample.length; i++) {
    binaryString += String.fromCharCode(sample[i])
  }

  const result = jschardet.detect(binaryString)
  const encoding = normalizeEncoding(result.encoding)
  const confidence = result.confidence || 0

  return { encoding, confidence }
}

/**
 * 检测 BOM（Byte Order Mark）
 * @param {Uint8Array} bytes
 * @returns {string|null}
 */
function detectBOM(bytes) {
  if (bytes.length < 2) return null

  // UTF-8 BOM: EF BB BF
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'UTF-8'
  }

  // UTF-16 LE BOM: FF FE
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return 'UTF-16LE'
  }

  // UTF-16 BE BOM: FE FF
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return 'UTF-16BE'
  }

  return null
}

/**
 * 将 ArrayBuffer 解码为 UTF-8 字符串
 *
 * @param {ArrayBuffer} buffer - 文件内容
 * @param {string} [encoding] - 源编码，如不提供则自动检测
 * @returns {{ text: string, encoding: string }}
 *   - text: 解码后的 UTF-8 文本
 *   - encoding: 使用的编码
 */
export function decodeToUTF8(buffer, encoding) {
  // 如果未指定编码，自动检测
  if (!encoding) {
    const detected = detectEncoding(buffer)
    encoding = detected.encoding
  } else {
    encoding = normalizeEncoding(encoding)
  }

  // 将 ArrayBuffer 转为 Uint8Array
  const uint8Array = new Uint8Array(buffer)

  // 使用 iconv-lite 解码
  // 在浏览器环境中使用 Uint8Array，Node.js 中转为 Buffer
  let input
  if (typeof Buffer !== 'undefined') {
    input = Buffer.from(uint8Array)
  } else {
    input = uint8Array
  }
  const text = iconv.decode(input, encoding)

  return { text, encoding }
}

/**
 * 检查给定的编码是否受支持
 * @param {string} encoding
 * @returns {boolean}
 */
export function isEncodingSupported(encoding) {
  const normalized = normalizeEncoding(encoding)
  return iconv.encodingExists(normalized)
}
