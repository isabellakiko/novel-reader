/**
 * 设置页面
 *
 * 阅读统计、应用设置
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Clock,
  BookOpen,
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
  Download,
  Upload,
  Database,
  FileJson,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useStatsStore, formatDuration, formatCharacters } from '../stores/stats'
import { ThemeSelector } from '../components/ThemeToggle'
import { cn } from '../lib/utils'
import {
  exportBookList,
  exportBookmarks,
  exportBookmarksAsMarkdown,
  exportReadingStats,
  exportReadingStatsAsCsv,
  exportAllData,
  importBackupData,
  previewBackupFile,
} from '../lib/export'
import useToastStore from '../stores/toast'

// 统计卡片组件
function StatCard({ icon: Icon, label, value, subValue, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 border border-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground/70">{subValue}</p>
        )}
      </div>
    </motion.div>
  )
}

// 周统计图表
function WeekChart({ weekStats }) {
  if (!weekStats?.byDate) return null

  // 生成过去7天的日期
  const days = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    days.push({
      date: date.toISOString().split('T')[0],
      day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
    })
  }

  // 获取最大值用于计算高度
  const maxDuration = Math.max(
    ...days.map((d) => weekStats.byDate[d.date]?.duration || 0),
    1
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">本周阅读</h3>
      </div>

      <div className="flex items-end justify-between gap-2 h-32">
        {days.map((day) => {
          const duration = weekStats.byDate[day.date]?.duration || 0
          const height = Math.max((duration / maxDuration) * 100, 4)
          const isToday = day.date === today.toISOString().split('T')[0]

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-full flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={cn(
                    'w-full max-w-8 rounded-t-md',
                    isToday ? 'bg-primary' : 'bg-primary/40'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs',
                  isToday ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {day.day}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">本周总计</span>
        <span className="font-medium">
          {formatDuration(weekStats.total?.duration || 0)}
        </span>
      </div>
    </motion.div>
  )
}

// 导出按钮组件
function ExportButton({ icon: Icon, label, description, onClick, isLoading }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg text-left w-full',
        'bg-muted/50 hover:bg-muted transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <Icon className="w-4 h-4 text-primary" />
        )}
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  )
}

// 数据导出部分
function ExportSection() {
  const [loading, setLoading] = useState(null)
  const toast = useToastStore()

  const handleExport = async (type, exportFn) => {
    setLoading(type)
    try {
      const result = await exportFn()
      if (typeof result === 'number') {
        toast.success(`导出成功：${result} 条记录`)
      } else if (typeof result === 'object') {
        toast.success(`导出成功：${result.books} 本书，${result.bookmarks} 个书签`)
      } else {
        toast.success('导出成功')
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('导出失败：' + error.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Download className="w-5 h-5 text-primary" />
        数据导出
      </h2>

      <div className="bg-card rounded-xl p-5 border border-border">
        <p className="text-sm text-muted-foreground mb-4">
          导出你的阅读数据，支持多种格式
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ExportButton
            icon={BookOpen}
            label="导出书籍列表"
            description="JSON 格式，不含内容"
            onClick={() => handleExport('books', exportBookList)}
            isLoading={loading === 'books'}
          />

          <ExportButton
            icon={FileJson}
            label="导出书签 (JSON)"
            description="包含所有书签信息"
            onClick={() => handleExport('bookmarks-json', exportBookmarks)}
            isLoading={loading === 'bookmarks-json'}
          />

          <ExportButton
            icon={FileText}
            label="导出书签 (Markdown)"
            description="按书籍分组，适合阅读"
            onClick={() => handleExport('bookmarks-md', exportBookmarksAsMarkdown)}
            isLoading={loading === 'bookmarks-md'}
          />

          <ExportButton
            icon={BarChart3}
            label="导出阅读统计 (JSON)"
            description="每日阅读时长和字数"
            onClick={() => handleExport('stats-json', exportReadingStats)}
            isLoading={loading === 'stats-json'}
          />

          <ExportButton
            icon={FileSpreadsheet}
            label="导出阅读统计 (CSV)"
            description="可用 Excel 打开"
            onClick={() => handleExport('stats-csv', exportReadingStatsAsCsv)}
            isLoading={loading === 'stats-csv'}
          />

          <ExportButton
            icon={Database}
            label="完整数据备份"
            description="包含所有数据（含书籍内容）"
            onClick={() => handleExport('all', exportAllData)}
            isLoading={loading === 'all'}
          />
        </div>
      </div>
    </section>
  )
}

// 数据导入部分
function ImportSection() {
  const fileInputRef = useRef(null)
  const toast = useToastStore()

  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [importOptions, setImportOptions] = useState({
    overwrite: false,
    skipBooks: false,
    skipProgress: false,
    skipBookmarks: false,
    skipStats: false,
  })

  // 处理文件选择
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setLoading(true)

    try {
      const previewData = await previewBackupFile(file)
      setPreview(previewData)
    } catch (error) {
      toast.error(error.message)
      setSelectedFile(null)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 执行导入
  const handleImport = useCallback(async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const result = await importBackupData(selectedFile, importOptions)

      const imported = result.books.imported + result.bookmarks.imported +
        result.progress.imported + result.stats.imported
      const skipped = result.books.skipped + result.bookmarks.skipped +
        result.progress.skipped + result.stats.skipped

      toast.success(`导入成功：${imported} 条数据${skipped > 0 ? `，跳过 ${skipped} 条` : ''}`)

      // 重置状态
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('导入失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }, [selectedFile, importOptions, toast])

  // 取消导入
  const handleCancel = useCallback(() => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        数据导入
      </h2>

      <div className="bg-card rounded-xl p-5 border border-border">
        <p className="text-sm text-muted-foreground mb-4">
          从备份文件恢复数据
        </p>

        {/* 文件选择区域 */}
        {!preview && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed border-border rounded-xl p-8',
              'flex flex-col items-center justify-center gap-3',
              'cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors',
              loading && 'opacity-50 pointer-events-none'
            )}
          >
            {loading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Database className="w-8 h-8 text-muted-foreground" />
            )}
            <div className="text-center">
              <p className="font-medium">选择备份文件</p>
              <p className="text-sm text-muted-foreground mt-1">
                支持 novel-reader-backup-*.json 格式
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* 预览和导入选项 */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* 备份信息 */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">备份信息</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    版本: {preview.version} · 导出时间: {new Date(preview.exportedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{preview.counts.books}</p>
                <p className="text-xs text-muted-foreground">本书籍</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{preview.counts.bookmarks}</p>
                <p className="text-xs text-muted-foreground">个书签</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{preview.counts.readingProgress}</p>
                <p className="text-xs text-muted-foreground">条进度</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{preview.counts.readingStats}</p>
                <p className="text-xs text-muted-foreground">条统计</p>
              </div>
            </div>

            {/* 书籍预览 */}
            {preview.bookTitles.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">包含书籍:</p>
                <div className="flex flex-wrap gap-2">
                  {preview.bookTitles.map((title, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-background rounded text-xs"
                    >
                      {title}
                    </span>
                  ))}
                  {preview.counts.books > 10 && (
                    <span className="px-2 py-1 text-muted-foreground text-xs">
                      等 {preview.counts.books} 本
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 导入选项 */}
            <div className="space-y-3">
              <p className="text-sm font-medium">导入选项</p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importOptions.overwrite}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    overwrite: e.target.checked
                  }))}
                  className="w-4 h-4 rounded border-border"
                />
                <div>
                  <p className="text-sm">覆盖已存在的数据</p>
                  <p className="text-xs text-muted-foreground">
                    如果书籍或数据已存在，将用备份数据覆盖
                  </p>
                </div>
              </label>

              <div className="pl-1 border-l-2 border-border ml-2 space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.skipBooks}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      skipBooks: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">跳过书籍数据</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.skipProgress}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      skipProgress: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">跳过阅读进度</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.skipBookmarks}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      skipBookmarks: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">跳过书签</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.skipStats}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      skipStats: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">跳过阅读统计</span>
                </label>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2',
                  'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    开始导入
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default function Settings() {
  const { todayStats, weekStats, allStats, isLoading, loadStats } =
    useStatsStore()

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold mb-2">设置</h1>
          <p className="text-muted-foreground">阅读统计和应用设置</p>
        </div>

        {/* 阅读统计 */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            阅读统计
          </h2>

          {/* 今日统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Clock}
              label="今日阅读"
              value={formatDuration(todayStats?.duration || 0)}
              color="primary"
            />
            <StatCard
              icon={FileText}
              label="今日字数"
              value={formatCharacters(todayStats?.characters || 0)}
              color="green"
            />
            <StatCard
              icon={Clock}
              label="累计时长"
              value={formatDuration(allStats?.duration || 0)}
              subValue={`共 ${allStats?.days || 0} 天`}
              color="blue"
            />
            <StatCard
              icon={BookOpen}
              label="阅读书籍"
              value={`${allStats?.books || 0} 本`}
              subValue={formatCharacters(allStats?.characters || 0)}
              color="amber"
            />
          </div>

          {/* 周统计图表 */}
          <WeekChart weekStats={weekStats} />
        </section>

        {/* 外观设置 */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            外观设置
          </h2>

          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">主题模式</h3>
                <p className="text-sm text-muted-foreground">
                  选择白天、夜间或护眼模式
                </p>
              </div>
              <ThemeSelector />
            </div>
          </div>
        </section>

        {/* 数据导出 */}
        <ExportSection />

        {/* 数据导入 */}
        <ImportSection />

        {/* 关于 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">关于</h2>
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Novel Reader</h3>
                <p className="text-sm text-muted-foreground">v0.1.0</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              一个精美、现代的本地小说阅读器。支持多编码 TXT 文件，提供舒适的阅读体验。
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
