/**
 * 全局错误边界组件
 *
 * 捕获 React 组件树中的 JavaScript 错误，防止应用白屏崩溃
 * 显示友好的错误界面，支持重试和返回首页
 */

import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 可选：发送错误到监控服务
    // reportError(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 自定义 fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error } = this.state
      const isDev = import.meta.env.DEV

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 text-center">
            {/* 错误图标 */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* 错误标题 */}
            <h1 className="text-xl font-semibold text-foreground mb-2">
              页面出现了问题
            </h1>

            {/* 错误描述 */}
            <p className="text-muted-foreground mb-6">
              很抱歉，应用遇到了意外错误。您可以尝试刷新页面或返回首页。
            </p>

            {/* 开发模式显示错误详情 */}
            {isDev && error && (
              <div className="mb-6 p-3 bg-muted rounded-md text-left overflow-auto max-h-32">
                <p className="text-xs font-mono text-red-600 dark:text-red-400">
                  {error.toString()}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                <Home className="w-4 h-4" />
                返回首页
              </button>
            </div>

            {/* 错误报告提示 */}
            <p className="mt-6 text-xs text-muted-foreground">
              如果问题持续出现，请刷新浏览器缓存或联系管理员
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
