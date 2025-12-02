/**
 * 编码检测与转换模块（浏览器兼容版）
 *
 * 使用浏览器原生 TextDecoder API
 * 支持检测和转换以下编码：
 * - UTF-8
 * - GBK / GB2312 / GB18030
 * - Big5
 * - ASCII
 */

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
 * 编码别名映射（统一为 TextDecoder 支持的名称）
 */
const ENCODING_ALIASES = {
  'utf-8': 'utf-8',
  'utf8': 'utf-8',
  'gbk': 'gbk',
  'gb2312': 'gbk', // GB2312 是 GBK 的子集
  'gb18030': 'gb18030',
  'big5': 'big5',
  'ascii': 'utf-8', // ASCII 是 UTF-8 的子集
  'iso-8859-1': 'gbk', // 常被误识别
  'windows-1252': 'gbk',
}

/**
 * 标准化编码名称（转为 TextDecoder 支持的格式）
 * @param {string} encoding
 * @returns {string}
 */
function normalizeEncoding(encoding) {
  if (!encoding) return 'utf-8'
  const lower = encoding.toLowerCase()
  return ENCODING_ALIASES[lower] || lower
}

/**
 * 检测 BOM（Byte Order Mark）
 * @param {Uint8Array} bytes
 * @returns {string|null}
 */
function detectBOM(bytes) {
  if (bytes.length < 2) return null

  // UTF-8 BOM: EF BB BF
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8'
  }

  // UTF-16 LE BOM: FF FE
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le'
  }

  // UTF-16 BE BOM: FE FF
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be'
  }

  return null
}

/**
 * 检查是否为有效的 UTF-8 序列
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
function isValidUTF8(bytes) {
  let i = 0
  while (i < bytes.length) {
    const byte = bytes[i]

    // ASCII (0x00-0x7F)
    if (byte <= 0x7f) {
      i++
      continue
    }

    // 多字节序列的起始字节
    let expectedBytes = 0
    if ((byte & 0xe0) === 0xc0) {
      // 2字节序列 (110xxxxx)
      expectedBytes = 2
    } else if ((byte & 0xf0) === 0xe0) {
      // 3字节序列 (1110xxxx)
      expectedBytes = 3
    } else if ((byte & 0xf8) === 0xf0) {
      // 4字节序列 (11110xxx)
      expectedBytes = 4
    } else {
      // 无效的起始字节
      return false
    }

    // 检查后续字节
    if (i + expectedBytes > bytes.length) {
      return false
    }

    for (let j = 1; j < expectedBytes; j++) {
      if ((bytes[i + j] & 0xc0) !== 0x80) {
        // 后续字节必须是 10xxxxxx
        return false
      }
    }

    i += expectedBytes
  }

  return true
}

/**
 * 计算文本中中文字符的比例和有效性
 * @param {string} text
 * @returns {{ ratio: number, hasGarbage: boolean }}
 */
function analyzeChineseText(text) {
  if (!text || text.length === 0) {
    return { ratio: 0, hasGarbage: false }
  }

  let chineseCount = 0
  let garbageCount = 0
  let totalValid = 0

  for (const char of text) {
    const code = char.charCodeAt(0)

    // 中文字符范围 (CJK Unified Ideographs)
    if (code >= 0x4e00 && code <= 0x9fff) {
      chineseCount++
      totalValid++
    }
    // 常见标点和ASCII
    else if (code <= 0x7f || (code >= 0x3000 && code <= 0x303f)) {
      totalValid++
    }
    // 其他CJK扩展
    else if (
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x20000 && code <= 0x2a6df)
    ) {
      chineseCount++
      totalValid++
    }
    // 替换字符（解码失败的标志）
    else if (code === 0xfffd) {
      garbageCount++
    }
    // 中文全角标点
    else if (code >= 0xff00 && code <= 0xffef) {
      totalValid++
    }
    // 其他
    else {
      totalValid++
    }
  }

  return {
    ratio: totalValid > 0 ? chineseCount / totalValid : 0,
    hasGarbage: garbageCount > text.length * 0.01, // 超过1%的乱码
  }
}

/**
 * 尝试用指定编码解码并评估结果质量
 * @param {Uint8Array} bytes
 * @param {string} encoding
 * @returns {{ text: string, score: number } | null}
 */
function tryDecode(bytes, encoding) {
  try {
    const decoder = new TextDecoder(encoding, { fatal: false })
    const text = decoder.decode(bytes)

    const analysis = analyzeChineseText(text)

    // 如果有太多乱码，得分为0
    if (analysis.hasGarbage) {
      return { text, score: 0 }
    }

    // 得分基于中文字符比例
    const score = analysis.ratio
    return { text, score }
  } catch {
    return null
  }
}

/**
 * 检测 ArrayBuffer 的编码
 *
 * @param {ArrayBuffer} buffer - 文件内容
 * @returns {{ encoding: string, confidence: number }}
 *   - encoding: 检测到的编码
 *   - confidence: 置信度 (0-1)
 */
export function detectEncoding(buffer) {
  const uint8Array = new Uint8Array(buffer)

  // 只检测前 64KB
  const sampleSize = Math.min(uint8Array.length, 65536)
  const sample = uint8Array.slice(0, sampleSize)

  // 1. 检查 BOM
  const bomEncoding = detectBOM(sample)
  if (bomEncoding) {
    return { encoding: bomEncoding, confidence: 1.0 }
  }

  // 2. 检查是否为有效 UTF-8
  if (isValidUTF8(sample)) {
    // 尝试解码确认
    const result = tryDecode(sample, 'utf-8')
    if (result && !result.text.includes('\ufffd')) {
      return { encoding: 'utf-8', confidence: 0.95 }
    }
  }

  // 3. 尝试各种编码，选择最佳的
  const candidates = ['gbk', 'gb18030', 'big5']
  let bestEncoding = 'utf-8'
  let bestScore = 0

  for (const encoding of candidates) {
    const result = tryDecode(sample, encoding)
    if (result && result.score > bestScore) {
      bestScore = result.score
      bestEncoding = encoding
    }
  }

  // 如果GBK类编码得分很高，使用它
  if (bestScore > 0.1) {
    return { encoding: bestEncoding, confidence: Math.min(bestScore * 2, 0.9) }
  }

  // 默认使用 UTF-8
  return { encoding: 'utf-8', confidence: 0.5 }
}

/**
 * 将 ArrayBuffer 解码为 UTF-8 字符串
 *
 * @param {ArrayBuffer} buffer - 文件内容
 * @param {string} [encoding] - 源编码，如不提供则自动检测
 * @returns {{ text: string, encoding: string }}
 */
export function decodeToUTF8(buffer, encoding) {
  if (!encoding) {
    const detected = detectEncoding(buffer)
    encoding = detected.encoding
  } else {
    encoding = normalizeEncoding(encoding)
  }

  try {
    const decoder = new TextDecoder(encoding, { fatal: false })
    const text = decoder.decode(buffer)
    return { text, encoding }
  } catch {
    // 回退到 UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const text = decoder.decode(buffer)
    return { text, encoding: 'utf-8' }
  }
}

/**
 * 检查给定的编码是否受支持
 * @param {string} encoding
 * @returns {boolean}
 */
export function isEncodingSupported(encoding) {
  const normalized = normalizeEncoding(encoding)
  try {
    new TextDecoder(normalized)
    return true
  } catch {
    return false
  }
}
