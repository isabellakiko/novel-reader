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
  // 注意：iso-8859-1 和 windows-1252 是西欧编码，不应映射到 GBK
  // 如果需要支持，应使用自动检测而非强制映射
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

  // UTF-8 BOM: EF BB BF（需要至少 3 个字节）
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
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

  // UTF-32 LE BOM: FF FE 00 00
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xfe && bytes[2] === 0x00 && bytes[3] === 0x00) {
    return 'utf-32le'
  }

  return null
}

/**
 * 检查是否为有效的 UTF-8 序列
 * 包含对非法序列和超长编码的检测
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
function isValidUTF8(bytes) {
  let i = 0
  let invalidCount = 0
  const maxInvalid = Math.max(1, Math.floor(bytes.length * 0.001)) // 允许 0.1% 的错误

  while (i < bytes.length) {
    const byte = bytes[i]

    // ASCII (0x00-0x7F)
    if (byte <= 0x7f) {
      i++
      continue
    }

    // 检测非法的起始字节
    // 0x80-0xBF: 这些是后续字节，不能作为起始
    // 0xC0-0xC1: 非法（会产生超长编码）
    // 0xF5-0xFF: 非法（超出 Unicode 范围）
    if (byte >= 0x80 && byte <= 0xbf) {
      invalidCount++
      i++
      continue
    }
    if (byte === 0xc0 || byte === 0xc1 || byte >= 0xf5) {
      invalidCount++
      i++
      continue
    }

    // 多字节序列的起始字节
    let expectedBytes = 0
    let minCodePoint = 0

    if ((byte & 0xe0) === 0xc0) {
      // 2字节序列 (110xxxxx) - 范围 U+0080 到 U+07FF
      expectedBytes = 2
      minCodePoint = 0x80
    } else if ((byte & 0xf0) === 0xe0) {
      // 3字节序列 (1110xxxx) - 范围 U+0800 到 U+FFFF
      expectedBytes = 3
      minCodePoint = 0x800
    } else if ((byte & 0xf8) === 0xf0) {
      // 4字节序列 (11110xxx) - 范围 U+10000 到 U+10FFFF
      expectedBytes = 4
      minCodePoint = 0x10000
    } else {
      // 其他无效的起始字节
      invalidCount++
      i++
      continue
    }

    // 检查后续字节是否足够
    if (i + expectedBytes > bytes.length) {
      invalidCount++
      break
    }

    // 检查后续字节格式（必须是 10xxxxxx）
    let valid = true
    let codePoint = byte & (0xff >> (expectedBytes + 1))

    for (let j = 1; j < expectedBytes; j++) {
      const nextByte = bytes[i + j]
      if ((nextByte & 0xc0) !== 0x80) {
        valid = false
        break
      }
      codePoint = (codePoint << 6) | (nextByte & 0x3f)
    }

    if (!valid) {
      invalidCount++
      i++
      continue
    }

    // 检查超长编码（overlong encoding）
    if (codePoint < minCodePoint) {
      invalidCount++
      i += expectedBytes
      continue
    }

    // 检查是否在有效的 Unicode 范围内
    // 排除代理对范围 (U+D800 到 U+DFFF) 和超出最大值
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
      invalidCount++
      i += expectedBytes
      continue
    }

    i += expectedBytes
  }

  // 如果无效字节太多，认为不是有效的 UTF-8
  return invalidCount <= maxInvalid
}

/**
 * 计算文本中中文字符的比例和有效性
 * @param {string} text
 * @returns {{ ratio: number, hasGarbage: boolean, consecutiveGarbage: number }}
 */
function analyzeChineseText(text) {
  if (!text || text.length === 0) {
    return { ratio: 0, hasGarbage: false, consecutiveGarbage: 0 }
  }

  let chineseCount = 0
  let garbageCount = 0
  let totalValid = 0
  let consecutiveGarbage = 0
  let maxConsecutiveGarbage = 0

  for (const char of text) {
    const code = char.charCodeAt(0)

    // CJK 统一表意文字（基本区）
    if (code >= 0x4e00 && code <= 0x9fff) {
      chineseCount++
      totalValid++
      consecutiveGarbage = 0
    }
    // CJK 扩展 A
    else if (code >= 0x3400 && code <= 0x4dbf) {
      chineseCount++
      totalValid++
      consecutiveGarbage = 0
    }
    // 日语平假名
    else if (code >= 0x3040 && code <= 0x309f) {
      chineseCount++ // 也算作东亚文字
      totalValid++
      consecutiveGarbage = 0
    }
    // 日语片假名
    else if (code >= 0x30a0 && code <= 0x30ff) {
      chineseCount++
      totalValid++
      consecutiveGarbage = 0
    }
    // 韩文音节
    else if (code >= 0xac00 && code <= 0xd7af) {
      chineseCount++
      totalValid++
      consecutiveGarbage = 0
    }
    // 常见标点和 ASCII
    else if (code <= 0x7f || (code >= 0x3000 && code <= 0x303f)) {
      totalValid++
      consecutiveGarbage = 0
    }
    // 中文全角标点和符号
    else if (code >= 0xff00 && code <= 0xffef) {
      totalValid++
      consecutiveGarbage = 0
    }
    // 替换字符（解码失败的标志）
    else if (code === 0xfffd) {
      garbageCount++
      consecutiveGarbage++
      maxConsecutiveGarbage = Math.max(maxConsecutiveGarbage, consecutiveGarbage)
    }
    // 控制字符（除了常见的换行等）
    else if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
      garbageCount++
      consecutiveGarbage++
      maxConsecutiveGarbage = Math.max(maxConsecutiveGarbage, consecutiveGarbage)
    }
    // 其他有效字符
    else {
      totalValid++
      consecutiveGarbage = 0
    }
  }

  // 乱码判定条件更严格：
  // 1. 乱码比例超过 0.5%
  // 2. 或连续乱码超过 3 个字符
  const garbageRatio = text.length > 0 ? garbageCount / text.length : 0
  const hasGarbage = garbageRatio > 0.005 || maxConsecutiveGarbage > 3

  return {
    ratio: totalValid > 0 ? chineseCount / totalValid : 0,
    hasGarbage,
    consecutiveGarbage: maxConsecutiveGarbage,
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
  let bestResult = null

  for (const encoding of candidates) {
    const result = tryDecode(sample, encoding)
    if (result && result.score > bestScore) {
      bestScore = result.score
      bestEncoding = encoding
      bestResult = result
    }
  }

  // 同时尝试 UTF-8 解码作为对比
  const utf8Result = tryDecode(sample, 'utf-8')
  const utf8Score = utf8Result ? utf8Result.score : 0

  // 选择策略：
  // 1. 如果 GBK 类编码的中文比例明显更高，使用它
  // 2. 如果差不多，优先选择 UTF-8（更通用）
  // 3. 阈值提高到 0.15，避免对低中文内容误判

  if (bestScore > 0.15 && bestScore > utf8Score * 1.2) {
    // 置信度计算：基于得分的非线性映射
    // score 0.15-0.3 -> confidence 0.6-0.75
    // score 0.3-0.6 -> confidence 0.75-0.9
    // score 0.6+ -> confidence 0.9
    let confidence
    if (bestScore >= 0.6) {
      confidence = 0.9
    } else if (bestScore >= 0.3) {
      confidence = 0.75 + (bestScore - 0.3) * 0.5
    } else {
      confidence = 0.6 + (bestScore - 0.15) * 1.0
    }
    return { encoding: bestEncoding, confidence }
  }

  // 如果 UTF-8 有合理的中文内容，优先使用
  if (utf8Score > 0.1) {
    return { encoding: 'utf-8', confidence: 0.7 + utf8Score * 0.2 }
  }

  // 默认使用 UTF-8，但置信度较低
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
