/**
 * 阅读设置面板
 */

import { X, Type, AlignJustify, Maximize2, Palette, AlignLeft, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import * as Slider from '@radix-ui/react-slider'
import * as Switch from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'
import { ThemeSelector } from '../ThemeToggle'

// 预设背景色
const PRESET_BG_COLORS = [
  { value: null, label: '跟随主题', color: 'transparent' },
  { value: '#ffffff', label: '纯白', color: '#ffffff' },
  { value: '#f5f0e6', label: '米黄', color: '#f5f0e6' },
  { value: '#e8f5e9', label: '淡绿', color: '#e8f5e9' },
  { value: '#e3f2fd', label: '淡蓝', color: '#e3f2fd' },
  { value: '#fce4ec', label: '淡粉', color: '#fce4ec' },
  { value: '#1a1a1a', label: '深黑', color: '#1a1a1a' },
  { value: '#2d2d2d', label: '深灰', color: '#2d2d2d' },
]

// 字体选项
const FONT_OPTIONS = [
  { value: 'serif', label: '宋体', sample: '宋', family: 'serif' },
  { value: 'sans', label: '黑体', sample: '黑', family: 'sans-serif' },
  { value: 'kai', label: '楷体', sample: '楷', family: '"楷体", "KaiTi", "STKaiti", serif' },
  { value: 'fangsong', label: '仿宋', sample: '仿', family: '"仿宋", "FangSong", "STFangsong", serif' },
]

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
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                onClick={() => onUpdate({ fontFamily: font.value })}
                className={cn(
                  'px-4 py-2.5 rounded-lg border-2 transition-all',
                  'flex flex-col items-center gap-0.5',
                  settings.fontFamily === font.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span
                  className="text-xl"
                  style={{ fontFamily: font.family }}
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

        {/* 段落间距 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <AlignJustify className="w-4 h-4" />
              段落间距
            </label>
            <span className="text-sm text-muted-foreground">
              {settings.paragraphSpacing || 1.5}em
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[(settings.paragraphSpacing || 1.5) * 10]}
            onValueChange={([value]) => onUpdate({ paragraphSpacing: value / 10 })}
            min={5}
            max={30}
            step={1}
          >
            <Slider.Track className="bg-muted relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="段落间距"
            />
          </Slider.Root>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>紧凑</span>
            <span>宽松</span>
          </div>
        </div>

        {/* 两端对齐 */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <AlignLeft className="w-4 h-4" />
            两端对齐
          </label>
          <Switch.Root
            checked={settings.textAlign === 'justify'}
            onCheckedChange={(checked) => onUpdate({ textAlign: checked ? 'justify' : 'left' })}
            className={cn(
              'w-11 h-6 rounded-full relative transition-colors',
              settings.textAlign === 'justify' ? 'bg-primary' : 'bg-muted'
            )}
          >
            <Switch.Thumb
              className={cn(
                'block w-5 h-5 bg-white rounded-full transition-transform',
                'shadow-md',
                settings.textAlign === 'justify' ? 'translate-x-[22px]' : 'translate-x-0.5'
              )}
            />
          </Switch.Root>
        </div>

        {/* 背景色 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              阅读背景
            </label>
            {settings.backgroundColor && (
              <button
                onClick={() => onUpdate({ backgroundColor: null, textColor: null })}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                重置
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_BG_COLORS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  if (preset.value === null) {
                    onUpdate({ backgroundColor: null, textColor: null })
                  } else {
                    // 深色背景自动配白色文字
                    const isDark = preset.value === '#1a1a1a' || preset.value === '#2d2d2d'
                    onUpdate({
                      backgroundColor: preset.value,
                      textColor: isDark ? '#e5e5e5' : '#1a1a1a',
                    })
                  }
                }}
                className={cn(
                  'aspect-square rounded-lg border-2 transition-all relative overflow-hidden',
                  'hover:scale-105',
                  settings.backgroundColor === preset.value ||
                    (preset.value === null && !settings.backgroundColor)
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border'
                )}
                title={preset.label}
              >
                {preset.value === null ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background to-muted">
                    <span className="text-xs text-muted-foreground">自动</span>
                  </div>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: preset.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
