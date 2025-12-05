/**
 * 高亮菜单组件
 *
 * 选中文本时显示的浮动菜单
 * 支持：选择高亮颜色、添加笔记、复制文本
 */

import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, MessageSquare, Trash2, Check } from 'lucide-react'
import { HIGHLIGHT_COLORS, useHighlightStore } from '../../stores/highlight'
import { cn } from '../../lib/utils'
import useToastStore from '../../stores/toast'

/**
 * 颜色选择器
 */
const ColorPicker = memo(function ColorPicker({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-1">
      {Object.values(HIGHLIGHT_COLORS).map((color) => (
        <button
          key={color.id}
          onClick={() => onSelect(color.id)}
          className={cn(
            'w-6 h-6 rounded-full transition-all',
            'hover:scale-110 hover:ring-2 ring-offset-1 ring-offset-background',
            color.id === 'yellow' && 'bg-yellow-300 ring-yellow-400',
            color.id === 'green' && 'bg-green-300 ring-green-400',
            color.id === 'blue' && 'bg-blue-300 ring-blue-400',
            color.id === 'pink' && 'bg-pink-300 ring-pink-400',
            color.id === 'purple' && 'bg-purple-300 ring-purple-400',
            selected === color.id && 'ring-2'
          )}
          title={color.name}
        />
      ))}
    </div>
  )
})

/**
 * 高亮菜单（选中文本时显示）
 */
export function SelectionMenu({
  position,
  selectedText,
  bookId,
  chapterIndex,
  startOffset,
  endOffset,
  onClose,
  onHighlightAdded,
}) {
  const { addHighlight, lastColor } = useHighlightStore()
  const toast = useToastStore()
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  const [selectedColor, setSelectedColor] = useState(lastColor)
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // 聚焦笔记输入框
  useEffect(() => {
    if (showNoteInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showNoteInput])

  // 添加高亮
  const handleHighlight = (color = selectedColor) => {
    addHighlight({
      bookId,
      chapterIndex,
      startOffset,
      endOffset,
      text: selectedText,
      color,
      note: '',
    })
    toast.success('已添加高亮')
    onHighlightAdded?.()
    onClose()
  }

  // 添加带笔记的高亮
  const handleAddNote = () => {
    if (!note.trim()) {
      toast.error('请输入笔记内容')
      return
    }

    addHighlight({
      bookId,
      chapterIndex,
      startOffset,
      endOffset,
      text: selectedText,
      color: selectedColor,
      note: note.trim(),
    })
    toast.success('已添加笔记')
    onHighlightAdded?.()
    onClose()
  }

  // 复制文本
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText)
      toast.success('已复制到剪贴板')
      onClose()
    } catch (err) {
      toast.error('复制失败')
    }
  }

  // 计算菜单位置
  const menuStyle = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 280),
    top: Math.max(position.y - 60, 10),
    zIndex: 100,
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={menuStyle}
      className="bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[200px]"
    >
      {!showNoteInput ? (
        <div className="space-y-3">
          {/* 颜色选择 */}
          <div className="flex items-center justify-between">
            <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />
            <button
              onClick={() => handleHighlight()}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              高亮
            </button>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-border" />

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNoteInput(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-accent transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              添加笔记
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="复制"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 预览选中文本 */}
          <div className="text-xs text-muted-foreground line-clamp-2 p-2 bg-muted rounded-lg">
            "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </div>

          {/* 颜色选择 */}
          <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />

          {/* 笔记输入 */}
          <textarea
            ref={inputRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="输入笔记..."
            className="w-full px-3 py-2 text-sm bg-muted border-none rounded-lg resize-none focus:ring-2 focus:ring-primary focus:outline-none"
            rows={3}
          />

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowNoteInput(false)}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddNote}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Check className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/**
 * 高亮编辑菜单（点击已有高亮时显示）
 */
export function HighlightEditMenu({
  position,
  highlight,
  onClose,
  onUpdated,
}) {
  const { updateHighlight, deleteHighlight } = useHighlightStore()
  const toast = useToastStore()
  const [isEditing, setIsEditing] = useState(false)
  const [note, setNote] = useState(highlight.note || '')
  const [selectedColor, setSelectedColor] = useState(highlight.color)
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // 聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // 更改颜色
  const handleColorChange = (color) => {
    setSelectedColor(color)
    updateHighlight(highlight.bookId, highlight.id, { color })
    toast.success('已更改颜色')
  }

  // 保存笔记
  const handleSaveNote = () => {
    updateHighlight(highlight.bookId, highlight.id, { note: note.trim() })
    toast.success('已保存笔记')
    setIsEditing(false)
    onUpdated?.()
  }

  // 删除高亮
  const handleDelete = () => {
    deleteHighlight(highlight.bookId, highlight.id)
    toast.success('已删除高亮')
    onClose()
    onUpdated?.()
  }

  // 复制文本
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(highlight.text)
      toast.success('已复制到剪贴板')
    } catch (err) {
      toast.error('复制失败')
    }
  }

  const menuStyle = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 280),
    top: Math.max(position.y - 60, 10),
    zIndex: 100,
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={menuStyle}
      className="bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[240px]"
    >
      <div className="space-y-3">
        {/* 高亮文本预览 */}
        <div className="text-xs text-muted-foreground line-clamp-2 p-2 bg-muted rounded-lg">
          "{highlight.text.slice(0, 60)}{highlight.text.length > 60 ? '...' : ''}"
        </div>

        {/* 颜色选择 */}
        <ColorPicker selected={selectedColor} onSelect={handleColorChange} />

        {/* 笔记编辑 */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={inputRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="输入笔记..."
              className="w-full px-3 py-2 text-sm bg-muted border-none rounded-lg resize-none focus:ring-2 focus:ring-primary focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNote(highlight.note || '')
                  setIsEditing(false)
                }}
                className="px-3 py-1 text-xs rounded-lg hover:bg-accent"
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg"
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <>
            {highlight.note && (
              <div className="p-2 bg-muted/50 rounded-lg text-sm">
                {highlight.note}
              </div>
            )}
          </>
        )}

        {/* 分隔线 */}
        <div className="border-t border-border" />

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title={highlight.note ? '编辑笔记' : '添加笔记'}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="复制"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default SelectionMenu
