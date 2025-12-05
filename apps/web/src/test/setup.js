/**
 * Vitest 测试设置文件
 */

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// 扩展 Vitest 的 expect 方法
expect.extend(matchers)

// 每个测试后自动清理
afterEach(() => {
  cleanup()
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: function (key) {
    return this.store[key] || null
  },
  setItem: function (key, value) {
    this.store[key] = value.toString()
  },
  removeItem: function (key) {
    delete this.store[key]
  },
  clear: function () {
    this.store = {}
  },
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
