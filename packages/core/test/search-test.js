/**
 * 搜索引擎性能测试
 *
 * 运行: node packages/core/test/search-test.js
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { detectEncoding, decodeToUTF8, detectChapters } from '../src/index.js'
import { searchBook } from '../src/search/search-engine.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 测试文件路径
const samplePath = join(__dirname, '../../../samples/张成.txt')

console.log('=== @novel-reader/core 搜索性能测试 ===\n')

try {
  // 读取并解析文件
  console.log('📖 加载测试文件...')
  const buffer = readFileSync(samplePath)
  const { encoding } = detectEncoding(buffer.buffer)
  const { text: content } = decodeToUTF8(buffer.buffer, encoding)
  const chapters = detectChapters(content)

  const book = {
    id: 'test-book',
    title: '测试书籍',
    content,
    chapters,
  }

  console.log(`   文件大小: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   字符数: ${content.length.toLocaleString()}`)
  console.log(`   章节数: ${chapters.length}\n`)

  // 测试搜索性能
  const testQueries = ['林老师', '张成', '学校', '第一章']

  console.log('🔍 搜索性能测试...\n')

  for (const query of testQueries) {
    console.log(`   搜索词: "${query}"`)

    const startTime = performance.now()
    const result = searchBook(book, query, { maxResults: 1000 })
    const endTime = performance.now()

    const timeMs = (endTime - startTime).toFixed(2)
    console.log(`   匹配数: ${result.totalMatches}`)
    console.log(`   章节数: ${result.chapters.length}`)
    console.log(`   耗时: ${timeMs}ms`)
    console.log()
  }

  // 极端测试：单字符搜索
  console.log('⚡ 极端测试（高频字符）...\n')

  const extremeQueries = ['的', '了', '是']

  for (const query of extremeQueries) {
    console.log(`   搜索词: "${query}"`)

    const startTime = performance.now()
    const result = searchBook(book, query, {
      maxResults: 500,
      maxResultsPerChapter: 10,
    })
    const endTime = performance.now()

    const timeMs = (endTime - startTime).toFixed(2)
    console.log(`   匹配数: ${result.totalMatches} (限制 500)`)
    console.log(`   耗时: ${timeMs}ms`)
    console.log()
  }

  console.log('✅ 所有测试通过!')
} catch (error) {
  console.error('❌ 测试失败:', error.message)
  process.exit(1)
}
