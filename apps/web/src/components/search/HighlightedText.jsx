/**
 * 高亮文本组件
 *
 * 在文本中高亮显示匹配的关键词
 */

import { memo } from 'react'
import { cn } from '../../lib/utils'

/**
 * 高亮样式类名（统一管理）
 */
const HIGHLIGHT_CLASS = cn(
  'bg-yellow-200 dark:bg-yellow-500/50',
  'text-yellow-900 dark:text-yellow-100',
  'px-0.5 rounded font-medium',
  'ring-1 ring-yellow-300 dark:ring-yellow-600/50'
)

/**
 * 高亮文本
 * @param {Object} props
 * @param {string} props.text - 原始文本
 * @param {number} props.matchOffset - 匹配在文本中的偏移位置
 * @param {number} props.matchLength - 匹配长度
 * @param {string} [props.className] - 容器类名
 */
function HighlightedText({ text, matchOffset, matchLength, className }) {
  if (matchOffset === undefined || matchLength === undefined) {
    return <span className={className}>{text}</span>
  }

  const before = text.slice(0, matchOffset)
  const match = text.slice(matchOffset, matchOffset + matchLength)
  const after = text.slice(matchOffset + matchLength)

  return (
    <span className={className}>
      {before}
      <mark className={HIGHLIGHT_CLASS}>
        {match}
      </mark>
      {after}
    </span>
  )
}

export default memo(HighlightedText)

/**
 * 根据查询词高亮文本（全局替换）
 *
 * 使用 split + capture group 的方式，奇数索引位置即为匹配项
 * 这比 regex.test() 更可靠，避免 lastIndex 状态问题
 */
export function HighlightQuery({ text, query, caseSensitive = false, className }) {
  if (!query || !text) {
    return <span className={className}>{text}</span>
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, caseSensitive ? 'g' : 'gi')
  const parts = text.split(regex)

  // 使用 split + capture group 时，匹配项总是在奇数索引位置
  // 例如: "abc hello def".split(/(hello)/) = ["abc ", "hello", " def"]
  //       索引 0 (非匹配), 索引 1 (匹配), 索引 2 (非匹配)
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // 奇数索引 = 匹配项
        const isMatch = index % 2 === 1

        if (isMatch) {
          return (
            <mark key={index} className={HIGHLIGHT_CLASS}>
              {part}
            </mark>
          )
        }
        return part ? <span key={index}>{part}</span> : null
      })}
    </span>
  )
}
