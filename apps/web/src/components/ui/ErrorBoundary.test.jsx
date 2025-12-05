/**
 * ErrorBoundary 组件测试
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

// 模拟会抛出错误的组件
function ThrowError({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>正常内容</div>
}

describe('ErrorBoundary', () => {
  // 禁用控制台错误输出
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div>测试内容</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('测试内容')).toBeInTheDocument()
  })

  it('捕获错误并显示错误界面', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('页面出现了问题')).toBeInTheDocument()
    expect(screen.getByText('重试')).toBeInTheDocument()
    expect(screen.getByText('返回首页')).toBeInTheDocument()
  })

  it('点击重试按钮重置错误状态', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('页面出现了问题')).toBeInTheDocument()

    // 点击重试
    fireEvent.click(screen.getByText('重试'))

    // 重新渲染不抛出错误的组件
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('正常内容')).toBeInTheDocument()
  })

  it('使用自定义 fallback', () => {
    const customFallback = <div>自定义错误页面</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('自定义错误页面')).toBeInTheDocument()
  })
})
