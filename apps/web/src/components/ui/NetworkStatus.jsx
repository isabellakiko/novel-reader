/**
 * 网络状态提示组件
 *
 * 显示离线/恢复在线状态提示
 */

import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'
import useOnlineStatus from '../../hooks/useOnlineStatus'

export default function NetworkStatus() {
  const { isOnline, wasOffline, clearWasOffline } = useOnlineStatus()

  // 在线且从未离线过，不显示任何内容
  if (isOnline && !wasOffline) return null

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>网络已断开，部分功能可能不可用</span>
          </div>
        </motion.div>
      )}

      {isOnline && wasOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          onAnimationComplete={() => {
            // 3秒后自动消失
            setTimeout(clearWasOffline, 3000)
          }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Wifi className="w-4 h-4" />
            <span>网络已恢复</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
