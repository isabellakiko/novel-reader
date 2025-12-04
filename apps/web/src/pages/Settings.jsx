/**
 * 设置页面
 *
 * 阅读统计、应用设置
 */

import { useEffect } from 'react'
import {
  Clock,
  BookOpen,
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useStatsStore, formatDuration, formatCharacters } from '../stores/stats'
import { ThemeSelector } from '../components/ThemeToggle'
import { cn } from '../lib/utils'

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
