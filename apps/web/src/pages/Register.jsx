/**
 * 注册页面
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, BookOpen, Loader2, Check, X } from 'lucide-react'
import useAuthStore from '../stores/auth'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  // 密码强度检查 - 与后端验证规则同步 (8+ 字符，大小写字母 + 数字)
  const passwordChecks = {
    length: formData.password.length >= 8,
    hasLowercase: /[a-z]/.test(formData.password),
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
  }
  const isPasswordValid = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch = formData.password === formData.confirmPassword

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isPasswordValid) {
      return
    }
    if (!passwordsMatch) {
      return
    }

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    })

    if (result.success) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">创建账号</h1>
          <p className="text-slate-400 mt-2">注册以同步多设备阅读进度</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                用户名
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl
                         text-white placeholder-slate-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                         transition-colors"
                placeholder="请输入用户名"
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                邮箱
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl
                         text-white placeholder-slate-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                         transition-colors"
                placeholder="请输入邮箱"
                required
                autoComplete="email"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl
                           text-white placeholder-slate-400
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                           transition-colors pr-12"
                  placeholder="请输入密码"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400
                           hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* 密码强度提示 */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <PasswordCheck checked={passwordChecks.length} text="至少 8 个字符" />
                  <PasswordCheck checked={passwordChecks.hasLowercase} text="包含小写字母" />
                  <PasswordCheck checked={passwordChecks.hasUppercase} text="包含大写字母" />
                  <PasswordCheck checked={passwordChecks.hasNumber} text="包含数字" />
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                确认密码
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl
                         text-white placeholder-slate-400
                         focus:outline-none focus:ring-1 transition-colors
                         ${
                           formData.confirmPassword
                             ? passwordsMatch
                               ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                               : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                             : 'border-slate-600 focus:border-amber-500 focus:ring-amber-500'
                         }`}
                placeholder="请再次输入密码"
                required
                autoComplete="new-password"
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-400">两次输入的密码不一致</p>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600
                       disabled:bg-amber-500/50 disabled:cursor-not-allowed
                       text-slate-900 font-semibold rounded-xl
                       transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          {/* 登录链接 */}
          <p className="mt-6 text-center text-slate-400">
            已有账号？{' '}
            <Link
              to="/login"
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              立即登录
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// 密码检查项组件
function PasswordCheck({ checked, text }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-slate-500" />
      )}
      <span className={checked ? 'text-green-500' : 'text-slate-500'}>{text}</span>
    </div>
  )
}
