/**
 * 网络状态提示组件
 *
 * 显示离线/恢复在线状态提示
 * 显示离线队列同步状态
 */

import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import useOnlineStatus from '../../hooks/useOnlineStatus'
import useOfflineQueueStore from '../../stores/offlineQueue'

export default function NetworkStatus() {
  const { isOnline, wasOffline, clearWasOffline } = useOnlineStatus()
  const queueLength = useOfflineQueueStore((state) => state.queue.length)
  const isProcessing = useOfflineQueueStore((state) => state.isProcessing)

  // 在线且从未离线过且无待同步操作，不显示任何内容
  if (isOnline && !wasOffline && queueLength === 0 && !isProcessing) return null

  return (
    <AnimatePresence>
      {/* 离线状态 */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>
              网络已断开
              {queueLength > 0 && `，${queueLength} 个操作待同步`}
            </span>
          </div>
        </motion.div>
      )}

      {/* 恢复在线 */}
      {isOnline && wasOffline && !isProcessing && (
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

      {/* 正在同步 */}
      {isOnline && isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>正在同步离线操作...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
