/**
 * 阅读设置面板
 */

import { X, Type, AlignJustify, Maximize2 } from 'lucide-react'
import { motion } from 'framer-motion'
import * as Slider from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'
import { ThemeSelector } from '../ThemeToggle'

export default function ReaderSettings({ settings, onUpdate, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-72 h-full bg-card border-l border-border flex flex-col"
    >
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">阅读设置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 设置项 */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* 主题切换 */}
        <div>
          <label className="text-sm font-medium mb-3 block">阅读主题</label>
          <ThemeSelector />
        </div>

        {/* 字体大小 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Type className="w-4 h-4" />
              字体大小
            </label>
            <span className="text-sm text-muted-foreground">
              {settings.fontSize}px
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[settings.fontSize]}
            onValueChange={([value]) => onUpdate({ fontSize: value })}
            min={14}
            max={28}
            step={1}
          >
            <Slider.Track className="bg-muted relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="字体大小"
            />
          </Slider.Root>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>小</span>
            <span>大</span>
          </div>
        </div>

        {/* 行间距 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <AlignJustify className="w-4 h-4" />
              行间距
            </label>
            <span className="text-sm text-muted-foreground">
              {settings.lineHeight}
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[settings.lineHeight * 10]}
            onValueChange={([value]) => onUpdate({ lineHeight: value / 10 })}
            min={12}
            max={25}
            step={1}
          >
            <Slider.Track className="bg-muted relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="行间距"
            />
          </Slider.Root>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>紧凑</span>
            <span>宽松</span>
          </div>
        </div>

        {/* 内容宽度 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              内容宽度
            </label>
            <span className="text-sm text-muted-foreground">
              {settings.maxWidth}px
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[settings.maxWidth]}
            onValueChange={([value]) => onUpdate({ maxWidth: value })}
            min={500}
            max={1200}
            step={50}
          >
            <Slider.Track className="bg-muted relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="内容宽度"
            />
          </Slider.Root>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>窄</span>
            <span>宽</span>
          </div>
        </div>

        {/* 字体选择 */}
        <div>
          <label className="text-sm font-medium mb-3 block">字体</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'serif', label: '衬线', sample: '宋' },
              { value: 'sans', label: '无衬线', sample: '黑' },
            ].map((font) => (
              <button
                key={font.value}
                onClick={() => onUpdate({ fontFamily: font.value })}
                className={cn(
                  'px-4 py-3 rounded-lg border-2 transition-all',
                  'flex flex-col items-center gap-1',
                  settings.fontFamily === font.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span
                  className={cn(
                    'text-2xl',
                    font.value === 'serif' ? 'font-serif' : 'font-sans'
                  )}
                >
                  {font.sample}
                </span>
                <span className="text-xs text-muted-foreground">
                  {font.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
