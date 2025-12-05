/**
 * 阅读统计图表组件
 *
 * 显示过去 7 天的阅读时长柱状图
 * 纯 CSS 实现，无需图表库
 */

import { useMemo } from 'react'
import { cn } from '../../lib/utils'

/**
 * 格式化时长为小时
 */
function formatHours(seconds) {
  const hours = seconds / 3600
  if (hours < 1) {
    return `${Math.round(seconds / 60)}分`
  }
  return `${hours.toFixed(1)}时`
}

/**
 * 获取星期几的简称
 */
function getWeekdayName(dateStr) {
  const date = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return weekdays[date.getDay()]
}

/**
 * 生成过去 N 天的日期列表
 */
function getLastNDays(n) {
  const dates = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

/**
 * 阅读时长柱状图
 */
export function ReadingBarChart({ data, days = 7 }) {
  // 生成日期列表
  const dates = useMemo(() => getLastNDays(days), [days])

  // 合并数据
  const chartData = useMemo(() => {
    return dates.map((date) => ({
      date,
      weekday: getWeekdayName(date),
      duration: data?.[date]?.duration || 0,
      characters: data?.[date]?.characters || 0,
    }))
  }, [dates, data])

  // 计算最大值（用于比例）
  const maxDuration = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.duration), 1)
    // 向上取整到最近的小时
    return Math.ceil(max / 3600) * 3600
  }, [chartData])

  // 判断今天
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="w-full">
      {/* 图表区域 */}
      <div className="flex items-end justify-between gap-1 sm:gap-2 h-32 px-1">
        {chartData.map((item) => {
          const heightPercent = maxDuration > 0 ? (item.duration / maxDuration) * 100 : 0
          const isToday = item.date === todayStr
          const hasData = item.duration > 0

          return (
            <div
              key={item.date}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center whitespace-nowrap">
                {hasData ? formatHours(item.duration) : '-'}
              </div>

              {/* 柱子 */}
              <div
                className={cn(
                  'w-full rounded-t-sm transition-all duration-300',
                  isToday
                    ? 'bg-primary'
                    : hasData
                    ? 'bg-primary/60'
                    : 'bg-muted',
                  'min-h-[4px]'
                )}
                style={{
                  height: `${Math.max(heightPercent, 3)}%`,
                }}
                title={`${item.date}: ${formatHours(item.duration)}`}
              />
            </div>
          )
        })}
      </div>

      {/* X 轴标签 */}
      <div className="flex justify-between mt-2 px-1">
        {chartData.map((item) => {
          const isToday = item.date === todayStr
          return (
            <div
              key={item.date}
              className={cn(
                'flex-1 text-center text-xs',
                isToday ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              {isToday ? '今' : item.weekday}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 阅读统计卡片
 */
export function StatsCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div
          className={cn(
            'mt-2 text-xs flex items-center gap-1',
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% vs 上周</span>
        </div>
      )}
    </div>
  )
}

/**
 * 阅读统计面板
 */
export default function ReadingStatsPanel({ weekStats, todayStats, allStats }) {
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="今日阅读"
          value={todayStats ? formatHours(todayStats.duration) : '0分'}
          subtitle={`${todayStats?.booksRead || 0} 本书`}
        />
        <StatsCard
          title="本周阅读"
          value={weekStats ? formatHours(weekStats.total.duration) : '0分'}
        />
        <StatsCard
          title="累计阅读"
          value={allStats ? formatHours(allStats.duration) : '0分'}
          subtitle={`${allStats?.days || 0} 天`}
        />
        <StatsCard
          title="阅读书籍"
          value={`${allStats?.books || 0} 本`}
        />
      </div>

      {/* 周阅读图表 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium mb-4">近 7 天阅读时长</h3>
        <ReadingBarChart data={weekStats?.byDate} days={7} />
      </div>
    </div>
  )
}
