/**
 * 核心解析模块测试
 *
 * 运行: node packages/core/test/parse-test.js
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import {
  detectEncoding,
  decodeToUTF8,
  detectChapters,
  extractBookInfo,
  detectBestPattern,
} from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 测试文件路径
const samplePath = join(__dirname, '../../../samples/张成.txt')

console.log('=== @novel-reader/core 解析测试 ===\n')

try {
  // 读取文件
  console.log('📖 读取文件...')
  const buffer = readFileSync(samplePath)
  console.log(`   文件大小: ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n`)

  // 测试编码检测
  console.log('🔍 检测编码...')
  const { encoding, confidence } = detectEncoding(buffer.buffer)
  console.log(`   编码: ${encoding}`)
  console.log(`   置信度: ${(confidence * 100).toFixed(1)}%\n`)

  // 测试解码
  console.log('📝 解码为 UTF-8...')
  const { text } = decodeToUTF8(buffer.buffer, encoding)
  console.log(`   字符数: ${text.length.toLocaleString()}\n`)

  // 测试书籍信息提取
  console.log('📚 提取书籍信息...')
  const bookInfo = extractBookInfo(text)
  console.log(`   书名: ${bookInfo.title || '(未检测到)'}`)
  console.log(`   作者: ${bookInfo.author || '(未检测到)'}\n`)

  // 测试最佳模式检测
  console.log('🎯 检测最佳章节模式...')
  const bestPattern = detectBestPattern(text)
  console.log(`   模式: ${bestPattern?.toString() || '(无)'}\n`)

  // 测试章节检测
  console.log('📑 检测章节...')
  const startTime = Date.now()
  const chapters = detectChapters(text)
  const parseTime = Date.now() - startTime
  console.log(`   章节数: ${chapters.length}`)
  console.log(`   解析耗时: ${parseTime}ms\n`)

  // 显示前 5 章和后 5 章
  console.log('📖 章节预览:')
  console.log('   前 5 章:')
  chapters.slice(0, 5).forEach((ch, i) => {
    console.log(`     ${i + 1}. ${ch.title}`)
  })

  if (chapters.length > 10) {
    console.log('   ...')
    console.log('   后 5 章:')
    chapters.slice(-5).forEach((ch, i) => {
      console.log(`     ${chapters.length - 4 + i}. ${ch.title}`)
    })
  }

  console.log('\n✅ 所有测试通过!')
} catch (error) {
  console.error('❌ 测试失败:', error.message)
  process.exit(1)
}
