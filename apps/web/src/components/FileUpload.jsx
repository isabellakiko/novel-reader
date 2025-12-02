/**
 * 文件上传组件
 *
 * 支持拖拽上传和点击选择
 */

import { useState, useCallback } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

/**
 * 支持的文件类型
 */
const ACCEPTED_TYPES = {
  'text/plain': ['.txt'],
  // 'application/epub+zip': ['.epub'], // 后续支持
}

const ACCEPTED_EXTENSIONS = Object.values(ACCEPTED_TYPES).flat()

export default function FileUpload({ onFileSelect, isLoading, className }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragError, setDragError] = useState(null)

  /**
   * 验证文件类型
   */
  const validateFile = useCallback((file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `不支持的文件类型: ${ext}`
    }
    return null
  }, [])

  /**
   * 处理文件选择
   */
  const handleFiles = useCallback(
    (files) => {
      if (files.length === 0) return

      const file = files[0]
      const error = validateFile(file)

      if (error) {
        setDragError(error)
        setTimeout(() => setDragError(null), 3000)
        return
      }

      setDragError(null)
      onFileSelect?.(file)
    },
    [onFileSelect, validateFile]
  )

  /**
   * 拖拽事件处理
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      handleFiles(files)
    },
    [handleFiles]
  )

  /**
   * 点击选择文件
   */
  const handleClick = useCallback(() => {
    if (isLoading) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED_EXTENSIONS.join(',')
    input.onchange = (e) => {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
    input.click()
  }, [handleFiles, isLoading])

  return (
    <motion.div
      className={cn(
        'relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
        'flex flex-col items-center justify-center gap-4',
        isDragOver
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-border hover:border-primary/50 hover:bg-accent/50',
        isLoading && 'pointer-events-none opacity-60',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      whileHover={{ scale: isLoading ? 1 : 1.01 }}
      whileTap={{ scale: isLoading ? 1 : 0.99 }}
    >
      {/* 图标 */}
      <motion.div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center',
          isDragOver ? 'bg-primary/10' : 'bg-muted'
        )}
        animate={{
          scale: isDragOver ? 1.1 : 1,
          rotate: isDragOver ? 5 : 0,
        }}
      >
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <Upload
            className={cn(
              'w-8 h-8',
              isDragOver ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        )}
      </motion.div>

      {/* 文字提示 */}
      <div className="text-center">
        <p className="font-medium">
          {isLoading ? '正在解析...' : '拖拽文件到这里，或点击选择'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          支持 TXT 格式，自动识别编码
        </p>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-4 left-4 right-4 bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <X className="w-4 h-4 flex-shrink-0" />
            {dragError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 支持的格式标签 */}
      <div className="flex gap-2">
        <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="w-3 h-3" />
          TXT
        </span>
      </div>
    </motion.div>
  )
}
