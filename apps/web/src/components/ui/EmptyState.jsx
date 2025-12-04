/**
 * 通用空状态组件
 *
 * 精美的空状态展示，带动画效果
 */

import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * 空状态插画动画
 */
function FloatingIllustration({ icon: Icon, className }) {
  return (
    <motion.div
      className={cn(
        'relative w-24 h-24 mx-auto mb-6',
        className
      )}
    >
      {/* 背景圆圈 - 带脉冲效果 */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 第二层圆圈 */}
      <motion.div
        className="absolute inset-2 rounded-full bg-primary/5"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* 图标容器 - 带浮动效果 */}
      <motion.div
        className="absolute inset-4 rounded-full bg-muted flex items-center justify-center"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Icon className="w-10 h-10 text-muted-foreground" />
      </motion.div>

      {/* 装饰点 */}
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/40"
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0.3,
        }}
      />
      <motion.div
        className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-primary/30"
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 1,
        }}
      />
    </motion.div>
  )
}

/**
 * 空状态组件
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - 图标组件
 * @param {string} props.title - 标题
 * @param {string} props.description - 描述文字
 * @param {React.ReactNode} props.action - 操作按钮
 * @param {string} props.className - 额外样式
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4',
        className
      )}
    >
      {/* 动画插画 */}
      <FloatingIllustration icon={icon} />

      {/* 标题 */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-2 text-center"
      >
        {title}
      </motion.h3>

      {/* 描述 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-sm mb-6"
      >
        {description}
      </motion.p>

      {/* 操作按钮 */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}

/**
 * 搜索无结果状态
 */
export function NoSearchResults({ query, className }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('text-center py-12', className)}
    >
      <motion.div
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center"
        animate={{
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <span className="text-2xl">🔍</span>
      </motion.div>
      <p className="text-muted-foreground">
        没有找到匹配 "<span className="text-foreground font-medium">{query}</span>" 的结果
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        试试其他关键词？
      </p>
    </motion.div>
  )
}
