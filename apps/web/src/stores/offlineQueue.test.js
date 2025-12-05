/**
 * OfflineQueue Store 测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import useOfflineQueueStore, { OperationType } from './offlineQueue'

describe('OfflineQueue Store', () => {
  beforeEach(() => {
    // 重置 store 状态
    useOfflineQueueStore.setState({
      queue: [],
      isProcessing: false,
      lastSyncAt: null,
    })
    // 清理 localStorage
    localStorage.clear()
  })

  describe('enqueue', () => {
    it('添加操作到队列', () => {
      const { enqueue, queue } = useOfflineQueueStore.getState()

      enqueue(OperationType.UPDATE_PROGRESS, {
        bookId: '123',
        chapterIndex: 5,
      })

      const state = useOfflineQueueStore.getState()
      expect(state.queue).toHaveLength(1)
      expect(state.queue[0].type).toBe(OperationType.UPDATE_PROGRESS)
      expect(state.queue[0].payload.bookId).toBe('123')
    })

    it('去重相同类型和 payload 的操作', () => {
      const { enqueue } = useOfflineQueueStore.getState()

      // 添加两次相同的操作
      enqueue(OperationType.UPDATE_PROGRESS, {
        bookId: '123',
        chapterIndex: 5,
      })
      enqueue(OperationType.UPDATE_PROGRESS, {
        bookId: '123',
        chapterIndex: 5,
      })

      const state = useOfflineQueueStore.getState()
      expect(state.queue).toHaveLength(1)
    })

    it('不同操作不会被去重', () => {
      const { enqueue } = useOfflineQueueStore.getState()

      enqueue(OperationType.UPDATE_PROGRESS, {
        bookId: '123',
        chapterIndex: 5,
      })
      enqueue(OperationType.UPDATE_PROGRESS, {
        bookId: '456',
        chapterIndex: 10,
      })

      const state = useOfflineQueueStore.getState()
      expect(state.queue).toHaveLength(2)
    })

    it('使用自定义 dedupeKey', () => {
      const { enqueue } = useOfflineQueueStore.getState()

      enqueue(
        OperationType.UPDATE_PROGRESS,
        { bookId: '123', chapterIndex: 5 },
        { dedupeKey: 'progress-123' }
      )
      enqueue(
        OperationType.UPDATE_PROGRESS,
        { bookId: '123', chapterIndex: 10 },
        { dedupeKey: 'progress-123' }
      )

      const state = useOfflineQueueStore.getState()
      expect(state.queue).toHaveLength(1)
      expect(state.queue[0].payload.chapterIndex).toBe(10)
    })
  })

  describe('dequeue', () => {
    it('从队列移除操作', () => {
      const { enqueue, dequeue } = useOfflineQueueStore.getState()

      enqueue(OperationType.CREATE_BOOKMARK, { bookId: '123' })
      const state1 = useOfflineQueueStore.getState()
      const opId = state1.queue[0].id

      dequeue(opId)

      const state2 = useOfflineQueueStore.getState()
      expect(state2.queue).toHaveLength(0)
    })
  })

  describe('clearQueue', () => {
    it('清空队列', () => {
      const { enqueue, clearQueue } = useOfflineQueueStore.getState()

      enqueue(OperationType.UPDATE_PROGRESS, { bookId: '1' })
      enqueue(OperationType.UPDATE_PROGRESS, { bookId: '2' })
      enqueue(OperationType.CREATE_BOOKMARK, { bookId: '3' })

      clearQueue()

      const state = useOfflineQueueStore.getState()
      expect(state.queue).toHaveLength(0)
      expect(state.isProcessing).toBe(false)
    })
  })

  describe('getQueueLength', () => {
    it('返回正确的队列长度', () => {
      const { enqueue, getQueueLength } = useOfflineQueueStore.getState()

      expect(getQueueLength()).toBe(0)

      enqueue(OperationType.UPDATE_PROGRESS, { bookId: '1' })
      expect(useOfflineQueueStore.getState().getQueueLength()).toBe(1)

      enqueue(OperationType.CREATE_BOOKMARK, { bookId: '2' })
      expect(useOfflineQueueStore.getState().getQueueLength()).toBe(2)
    })
  })
})
