/**
 * 通用动画配置
 *
 * 统一管理 Framer Motion 动画变体
 */

// ==================== 基础配置 ====================

/**
 * 通用弹簧配置
 */
export const springConfig = {
  soft: { type: 'spring', stiffness: 300, damping: 30 },
  medium: { type: 'spring', stiffness: 400, damping: 25 },
  stiff: { type: 'spring', stiffness: 500, damping: 30 },
  bouncy: { type: 'spring', stiffness: 600, damping: 15 },
}

/**
 * 通用缓动配置
 */
export const easingConfig = {
  smooth: [0.4, 0, 0.2, 1],
  snappy: [0.4, 0, 0.6, 1],
  bouncy: [0.68, -0.55, 0.265, 1.55],
}

// ==================== 页面动画 ====================

/**
 * 页面进入/退出动画
 */
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easingConfig.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
}

/**
 * 页面淡入淡出动画
 */
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// ==================== 列表动画 ====================

/**
 * 列表容器动画（带 stagger 效果）
 */
export const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

/**
 * 列表项动画
 */
export const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easingConfig.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
}

/**
 * 网格项动画（从各方向进入）
 */
export const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easingConfig.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
}

// ==================== 卡片动画 ====================

/**
 * 卡片悬停效果
 */
export const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    transition: springConfig.soft,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: springConfig.soft,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}

/**
 * 3D 卡片翻转效果
 */
export const card3DVariants = {
  rest: {
    rotateY: 0,
    rotateX: 0,
    transition: springConfig.soft,
  },
  hover: {
    rotateY: -5,
    rotateX: 2,
    transition: springConfig.soft,
  },
}

// ==================== 侧边栏/面板动画 ====================

/**
 * 从左侧滑入
 */
export const slideFromLeftVariants = {
  initial: { x: '-100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: springConfig.medium,
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

/**
 * 从右侧滑入
 */
export const slideFromRightVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: springConfig.medium,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

/**
 * 从底部滑入
 */
export const slideFromBottomVariants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: springConfig.medium,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

/**
 * 从顶部滑入
 */
export const slideFromTopVariants = {
  initial: { y: '-100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: springConfig.medium,
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// ==================== 弹窗/对话框动画 ====================

/**
 * 模态框动画
 */
export const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfig.medium,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
}

/**
 * 背景遮罩动画
 */
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// ==================== 提示/通知动画 ====================

/**
 * Toast 通知动画
 */
export const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig.bouncy,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

/**
 * 气泡提示动画
 */
export const tooltipVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.1 },
  },
}

// ==================== 加载动画 ====================

/**
 * 骨架屏闪烁
 */
export const skeletonVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * 脉冲动画
 */
export const pulseVariants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ==================== 特殊效果 ====================

/**
 * 闪烁高亮效果
 */
export const highlightFlashVariants = {
  initial: { backgroundColor: 'transparent' },
  animate: {
    backgroundColor: ['hsl(50 100% 50% / 0.5)', 'transparent'],
    transition: { duration: 1.5 },
  },
}

/**
 * 缩放进入效果
 */
export const scaleInVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springConfig.bouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

/**
 * 旋转进入效果
 */
export const rotateInVariants = {
  initial: { rotate: -180, opacity: 0 },
  animate: {
    rotate: 0,
    opacity: 1,
    transition: springConfig.medium,
  },
  exit: {
    rotate: 180,
    opacity: 0,
    transition: { duration: 0.3 },
  },
}
