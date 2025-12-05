/**
 * 支持高亮的内容渲染组件
 *
 * 功能：
 * - 渲染带高亮的文本
 * - 处理文本选择
 * - 点击高亮显示编辑菜单
 */

import { useState, useCallback, useRef, memo, useMemo, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useHighlightStore, HIGHLIGHT_COLORS } from '../../stores/highlight'
import { SelectionMenu, HighlightEditMenu } from './HighlightMenu'

/**
 * 将高亮应用到文本行
 * @param {string} lineText - 原始文本
 * @param {number} lineStart - 行在章节中的起始位置
 * @param {Array} highlights - 该章节的高亮列表
 * @returns {Array} 渲染节点数组
 */
function applyHighlightsToLine(lineText, lineStart, highlights) {
  const lineEnd = lineStart + lineText.length

  // 筛选与当前行重叠的高亮
  const relevantHighlights = highlights.filter(
    (h) => h.startOffset < lineEnd && h.endOffset > lineStart
  )

  if (relevantHighlights.length === 0) {
    return [{ type: 'text', content: lineText }]
  }

  // 创建分割点
  const points = new Set([0, lineText.length])
  relevantHighlights.forEach((h) => {
    const start = Math.max(0, h.startOffset - lineStart)
    const end = Math.min(lineText.length, h.endOffset - lineStart)
    points.add(start)
    points.add(end)
  })

  const sortedPoints = Array.from(points).sort((a, b) => a - b)
  const segments = []

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i]
    const end = sortedPoints[i + 1]
    const content = lineText.slice(start, end)

    if (!content) continue

    // 找出覆盖这个片段的高亮
    const covering = relevantHighlights.find((h) => {
      const hStart = h.startOffset - lineStart
      const hEnd = h.endOffset - lineStart
      return start >= hStart && end <= hEnd
    })

    if (covering) {
      segments.push({
        type: 'highlight',
        content,
        highlight: covering,
      })
    } else {
      segments.push({ type: 'text', content })
    }
  }

  return segments
}

/**
 * 高亮渲染器
 */
const HighlightSpan = memo(function HighlightSpan({
  highlight,
  children,
  onClick,
}) {
  const colorConfig = HIGHLIGHT_COLORS[highlight.color] || HIGHLIGHT_COLORS.yellow

  return (
    <span
      className={`${colorConfig.bg} cursor-pointer hover:opacity-80 transition-opacity rounded-sm px-0.5`}
      onClick={(e) => {
        e.stopPropagation()
        onClick(highlight, e)
      }}
      data-highlight-id={highlight.id}
    >
      {children}
    </span>
  )
})

/**
 * 单行渲染
 */
const RenderedLine = memo(function RenderedLine({
  lineText,
  lineIndex,
  lineStart,
  highlights,
  settings,
  onHighlightClick,
}) {
  const segments = useMemo(
    () => applyHighlightsToLine(lineText, lineStart, highlights),
    [lineText, lineStart, highlights]
  )

  return (
    <p
      className="reading-content"
      style={{
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        textIndent: '2em',
      }}
    >
      {segments.map((segment, i) =>
        segment.type === 'highlight' ? (
          <HighlightSpan
            key={i}
            highlight={segment.highlight}
            onClick={onHighlightClick}
          >
            {segment.content}
          </HighlightSpan>
        ) : (
          <span key={i}>{segment.content}</span>
        )
      )}
    </p>
  )
})

/**
 * 主组件
 */
export default function HighlightedContent({
  lines,
  settings,
  bookId,
  chapterIndex,
  onHighlightChange,
}) {
  const { getChapterHighlights } = useHighlightStore()
  const containerRef = useRef(null)

  // 获取当前章节的高亮
  const highlights = useMemo(
    () => getChapterHighlights(bookId, chapterIndex),
    [bookId, chapterIndex, getChapterHighlights]
  )

  // 计算每行的起始位置
  const lineStarts = useMemo(() => {
    const starts = []
    let offset = 0
    lines.forEach((line) => {
      starts.push(offset)
      offset += line.length + 1 // +1 for newline
    })
    return starts
  }, [lines])

  // 选择菜单状态
  const [selectionMenu, setSelectionMenu] = useState(null)
  const [editMenu, setEditMenu] = useState(null)

  // 处理文本选择
  const handleMouseUp = useCallback(
    (e) => {
      // 忽略对高亮文本的点击
      if (e.target.closest('[data-highlight-id]')) {
        return
      }

      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (!text || text.length < 2) {
        setSelectionMenu(null)
        return
      }

      // 获取选区范围
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // 计算选区在章节中的位置
      // 这里简化处理，使用文本内容匹配
      let startOffset = -1
      let endOffset = -1
      let searchPos = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const textIndex = line.indexOf(text)
        if (textIndex !== -1) {
          startOffset = lineStarts[i] + textIndex
          endOffset = startOffset + text.length
          break
        }
        // 检查跨行选择
        if (i < lines.length - 1) {
          const combined = line + lines[i + 1]
          const combinedIndex = combined.indexOf(text)
          if (combinedIndex !== -1) {
            startOffset = lineStarts[i] + combinedIndex
            endOffset = startOffset + text.length
            break
          }
        }
      }

      if (startOffset === -1) {
        // 如果找不到精确位置，使用估算
        const fullText = lines.join('\n')
        const index = fullText.indexOf(text)
        if (index !== -1) {
          startOffset = index
          endOffset = index + text.length
        }
      }

      if (startOffset !== -1) {
        setEditMenu(null)
        setSelectionMenu({
          position: { x: rect.left + rect.width / 2, y: rect.top },
          selectedText: text,
          startOffset,
          endOffset,
        })
      }
    },
    [lines, lineStarts]
  )

  // 处理高亮点击
  const handleHighlightClick = useCallback((highlight, e) => {
    setSelectionMenu(null)
    setEditMenu({
      position: { x: e.clientX, y: e.clientY },
      highlight,
    })
  }, [])

  // 关闭菜单
  const closeMenus = useCallback(() => {
    setSelectionMenu(null)
    setEditMenu(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  // 高亮添加后的回调
  const handleHighlightAdded = useCallback(() => {
    onHighlightChange?.()
    window.getSelection()?.removeAllRanges()
  }, [onHighlightChange])

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp}>
      {/* 渲染内容 */}
      <div className="space-y-4">
        {lines.map((line, index) => (
          <RenderedLine
            key={index}
            lineText={line}
            lineIndex={index}
            lineStart={lineStarts[index]}
            highlights={highlights}
            settings={settings}
            onHighlightClick={handleHighlightClick}
          />
        ))}
      </div>

      {/* 选择菜单 */}
      <AnimatePresence>
        {selectionMenu && (
          <SelectionMenu
            position={selectionMenu.position}
            selectedText={selectionMenu.selectedText}
            bookId={bookId}
            chapterIndex={chapterIndex}
            startOffset={selectionMenu.startOffset}
            endOffset={selectionMenu.endOffset}
            onClose={closeMenus}
            onHighlightAdded={handleHighlightAdded}
          />
        )}
      </AnimatePresence>

      {/* 编辑菜单 */}
      <AnimatePresence>
        {editMenu && (
          <HighlightEditMenu
            position={editMenu.position}
            highlight={editMenu.highlight}
            onClose={closeMenus}
            onUpdated={handleHighlightAdded}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
