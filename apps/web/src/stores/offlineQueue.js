/**
 * 离线操作队列
 *
 * 在离线状态下将操作存入队列，恢复在线后自动执行
 * 支持操作去重、重试和失败处理
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import useToastStore from './toast'

/**
 * 操作类型枚举
 */
export const OperationType = {
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  CREATE_BOOKMARK: 'CREATE_BOOKMARK',
  DELETE_BOOKMARK: 'DELETE_BOOKMARK',
  SYNC_BOOK: 'SYNC_BOOK',
}

/**
 * 最大重试次数
 */
const MAX_RETRIES = 3

/**
 * 重试延迟（毫秒）
 */
const RETRY_DELAYS = [1000, 3000, 10000]

/**
 * 生成操作 ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 操作执行器映射
 * 每种操作类型对应一个异步执行函数
 */
const operationExecutors = {
  [OperationType.UPDATE_PROGRESS]: async (payload, api) => {
    const { progressApi } = await import('../services/api')
    await progressApi.update(payload)
  },

  [OperationType.CREATE_BOOKMARK]: async (payload, api) => {
    const { bookmarkApi } = await import('../services/api')
    await bookmarkApi.create(payload)
  },

  [OperationType.DELETE_BOOKMARK]: async (payload) => {
    const { bookmarkApi } = await import('../services/api')
    await bookmarkApi.delete(payload.bookmarkId)
  },

  [OperationType.SYNC_BOOK]: async (payload) => {
    const { bookApi } = await import('../services/api')
    // 同步逻辑根据需要实现
    await bookApi.getDetail(payload.bookId)
  },
}

const useOfflineQueueStore = create(
  persist(
    (set, get) => ({
      // 操作队列
      queue: [],

      // 是否正在处理队列
      isProcessing: false,

      // 上次同步时间
      lastSyncAt: null,

      // 添加操作到队列
      enqueue: (type, payload, options = {}) => {
        const { dedupe = true, dedupeKey = null } = options

        set((state) => {
          let newQueue = [...state.queue]

          // 去重：如果存在相同类型和 key 的操作，替换它
          if (dedupe) {
            const key = dedupeKey || JSON.stringify({ type, ...payload })
            newQueue = newQueue.filter(
              (op) =>
                !(op.type === type && op.dedupeKey === key)
            )
          }

          const operation = {
            id: generateId(),
            type,
            payload,
            dedupeKey: dedupeKey || JSON.stringify({ type, ...payload }),
            createdAt: Date.now(),
            retries: 0,
            lastError: null,
          }

          return { queue: [...newQueue, operation] }
        })

        // 如果在线，立即尝试处理
        if (navigator.onLine) {
          get().processQueue()
        }
      },

      // 移除操作
      dequeue: (operationId) => {
        set((state) => ({
          queue: state.queue.filter((op) => op.id !== operationId),
        }))
      },

      // 处理队列
      processQueue: async () => {
        const { queue, isProcessing } = get()

        // 如果已在处理或队列为空或离线，跳过
        if (isProcessing || queue.length === 0 || !navigator.onLine) {
          return
        }

        set({ isProcessing: true })

        const toast = useToastStore.getState()
        let successCount = 0
        let failCount = 0

        for (const operation of [...queue]) {
          try {
            const executor = operationExecutors[operation.type]
            if (!executor) {
              console.error(`Unknown operation type: ${operation.type}`)
              get().dequeue(operation.id)
              continue
            }

            await executor(operation.payload)
            get().dequeue(operation.id)
            successCount++
          } catch (error) {
            console.error(`Failed to execute operation:`, operation, error)

            // 更新重试次数
            set((state) => ({
              queue: state.queue.map((op) =>
                op.id === operation.id
                  ? {
                      ...op,
                      retries: op.retries + 1,
                      lastError: error.message,
                    }
                  : op
              ),
            }))

            // 超过最大重试次数，移除操作
            if (operation.retries + 1 >= MAX_RETRIES) {
              get().dequeue(operation.id)
              failCount++
            }
          }
        }

        set({
          isProcessing: false,
          lastSyncAt: Date.now(),
        })

        // 显示同步结果
        if (successCount > 0 || failCount > 0) {
          if (failCount === 0) {
            toast.success(`同步完成：${successCount} 个操作`)
          } else {
            toast.warning(`同步完成：${successCount} 成功，${failCount} 失败`)
          }
        }
      },

      // 清空队列
      clearQueue: () => {
        set({ queue: [], isProcessing: false })
      },

      // 获取队列长度
      getQueueLength: () => {
        return get().queue.length
      },

      // 重试失败的操作
      retryFailed: () => {
        set((state) => ({
          queue: state.queue.map((op) => ({
            ...op,
            retries: 0,
            lastError: null,
          })),
        }))
        get().processQueue()
      },
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        queue: state.queue,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
)

// 监听在线状态变化
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Online detected, processing queue...')
    useOfflineQueueStore.getState().processQueue()
  })
}

export default useOfflineQueueStore
