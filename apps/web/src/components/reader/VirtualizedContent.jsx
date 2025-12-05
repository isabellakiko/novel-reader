/**
 * 虚拟化章节内容组件
 *
 * 使用分块渲染 + Intersection Observer 实现大章节高效渲染
 * 每块包含多个段落，只渲染可见区域 + 缓冲区
 */

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { HighlightQuery } from '../search/HighlightedText'

// 每个块的段落数
const CHUNK_SIZE = 50
// 预加载的块数（可视区域上下各多少块）
const BUFFER_CHUNKS = 2

/**
 * 将段落数组分块
 */
function chunkArray(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push({
      id: i,
      startIndex: i,
      lines: array.slice(i, i + size),
    })
  }
  return chunks
}

/**
 * 内容块组件
 */
function ContentChunk({
  chunk,
  isVisible,
  settings,
  highlightQuery,
  onHeightMeasured,
}) {
  const ref = useRef(null)

  // 测量高度
  useEffect(() => {
    if (ref.current && isVisible) {
      const height = ref.current.offsetHeight
      onHeightMeasured?.(chunk.id, height)
    }
  }, [chunk.id, isVisible, onHeightMeasured])

  // 未加载时显示占位
  if (!isVisible) {
    return (
      <div
        className="content-chunk-placeholder"
        style={{ minHeight: chunk.estimatedHeight || CHUNK_SIZE * 40 }}
        data-chunk-id={chunk.id}
      />
    )
  }

  return (
    <div ref={ref} className="content-chunk" data-chunk-id={chunk.id}>
      {chunk.lines.map((line, index) => (
        <p
          key={chunk.startIndex + index}
          className="indent-8"
          style={{
            marginBottom: `${settings.paragraphSpacing || 1.5}em`,
            textAlign: settings.textAlign || 'left',
          }}
        >
          {highlightQuery ? (
            <HighlightQuery text={line} query={highlightQuery} />
          ) : (
            line
          )}
        </p>
      ))}
    </div>
  )
}

/**
 * 虚拟化内容主组件
 */
export default function VirtualizedContent({
  lines,
  settings,
  highlightQuery,
  onScroll,
}) {
  const containerRef = useRef(null)
  const [visibleChunks, setVisibleChunks] = useState(new Set([0, 1, 2]))
  const [chunkHeights, setChunkHeights] = useState({})

  // 将内容分块
  const chunks = useMemo(() => chunkArray(lines, CHUNK_SIZE), [lines])

  // 小章节不需要虚拟化（少于 200 行）
  const useVirtualization = lines.length > 200

  // 更新块高度
  const handleHeightMeasured = useCallback((chunkId, height) => {
    setChunkHeights((prev) => ({ ...prev, [chunkId]: height }))
  }, [])

  // Intersection Observer 监测可见块
  useEffect(() => {
    if (!useVirtualization || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const chunkId = parseInt(entry.target.dataset.chunkId, 10)
          if (isNaN(chunkId)) return

          setVisibleChunks((prev) => {
            const next = new Set(prev)

            if (entry.isIntersecting) {
              // 添加可见块和缓冲区
              for (
                let i = Math.max(0, chunkId - BUFFER_CHUNKS);
                i <= Math.min(chunks.length - 1, chunkId + BUFFER_CHUNKS);
                i++
              ) {
                next.add(i)
              }
            }

            return next
          })
        })
      },
      {
        root: containerRef.current.closest('main'),
        rootMargin: '200px 0px', // 预加载缓冲区
        threshold: 0,
      }
    )

    // 观察所有块占位符
    const placeholders = containerRef.current.querySelectorAll('[data-chunk-id]')
    placeholders.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [chunks.length, useVirtualization])

  // 滚动事件处理
  useEffect(() => {
    if (!onScroll) return

    const container = containerRef.current?.closest('main')
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const progress = scrollHeight > clientHeight
        ? scrollTop / (scrollHeight - clientHeight)
        : 0
      onScroll(progress)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [onScroll])

  // 小章节：直接渲染所有内容
  if (!useVirtualization) {
    return (
      <article
        ref={containerRef}
        className="reading-content"
        style={{
          fontSize: settings.fontSize,
          lineHeight: settings.lineHeight,
        }}
      >
        {lines.map((line, index) => (
          <p
            key={index}
            className="indent-8"
            style={{
              marginBottom: `${settings.paragraphSpacing || 1.5}em`,
              textAlign: settings.textAlign || 'left',
            }}
          >
            {highlightQuery ? (
              <HighlightQuery text={line} query={highlightQuery} />
            ) : (
              line
            )}
          </p>
        ))}
      </article>
    )
  }

  // 大章节：使用虚拟化
  return (
    <article
      ref={containerRef}
      className="reading-content"
      style={{
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
      }}
    >
      {chunks.map((chunk, index) => (
        <ContentChunk
          key={chunk.id}
          chunk={{
            ...chunk,
            estimatedHeight: chunkHeights[chunk.id] || CHUNK_SIZE * 40,
          }}
          isVisible={visibleChunks.has(index)}
          settings={settings}
          highlightQuery={highlightQuery}
          onHeightMeasured={handleHeightMeasured}
        />
      ))}
    </article>
  )
}
