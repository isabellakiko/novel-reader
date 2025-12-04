/**
 * 网络状态检测 Hook
 *
 * 监听浏览器在线/离线状态变化
 */

import { useState, useEffect, useCallback } from 'react'

export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    if (!navigator.onLine) return
    // 标记曾经离线过（用于显示恢复提示）
    if (wasOffline) {
      // 保持 wasOffline 状态一段时间，让 UI 有机会显示恢复提示
      setTimeout(() => setWasOffline(false), 3000)
    }
  }, [wasOffline])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return {
    isOnline,
    wasOffline,
    clearWasOffline: () => setWasOffline(false),
  }
}
