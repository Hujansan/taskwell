'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'

type ActiveDated = {
  active_from?: string | null
  active_to?: string | null
}

function isActiveOnDate(dateStr: string, item?: ActiveDated | null) {
  const from = item?.active_from ?? '0000-01-01'
  const to = item?.active_to ?? '9999-12-31'
  return dateStr >= from && dateStr <= to
}

function toDateOrNull(value: string) {
  return value && value.trim() ? value : null
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin')
  const [view, setView] = useState<'dashboard' | 'tasks' | 'daily' | 'today' | 'settings'>('dashboard')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const supabase = createClient()

  // Load dark mode preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      const savedDarkMode =
        saved === null ? window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false : saved === 'true'
      setDarkMode(savedDarkMode)
      if (savedDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  // Apply dark mode class to html element when darkMode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      if (darkMode) {
        html.classList.add('dark')
        localStorage.setItem('darkMode', 'true')
      } else {
        html.classList.remove('dark')
        localStorage.setItem('darkMode', 'false')
      }
    }
  }, [darkMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // Check if this is a password reset event
      if (_event === 'PASSWORD_RECOVERY') {
        setAuthView('reset')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Check your email for the confirmation link!')
      setEmail('')
      setPassword('')
    }
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      setEmail('')
      setPassword('')
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password reset email sent! Check your inbox for instructions.')
    }
    setLoading(false)
  }

  const handleResetPassword = async (newPassword: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated successfully!')
      setAuthView('signin')
      setPassword('')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setView('dashboard')
    setShowChangePassword(false)
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8] dark:bg-gray-900">
          <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center mb-6 dark:text-white" style={{ color: '#11551a' }}>Welcome</h2>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-4 text-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-[#e8f5e9] dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-2 rounded-lg mb-4 text-lg">
                {success}
              </div>
            )}

            {authView === 'signin' && (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="flex-1 text-white py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: '#11551a' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1a7a28')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <button
                    onClick={() => {
                      setAuthView('signup')
                      setError(null)
                      setSuccess(null)
                    }}
                    disabled={loading}
                    className="flex-1 text-white py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: '#f6d413' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#e5c312')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
                  >
                    Sign Up
                  </button>
                </div>
                <button
                  onClick={() => {
                    setAuthView('forgot')
                    setError(null)
                    setSuccess(null)
                  }}
                  className="w-full text-lg underline cursor-pointer transition-colors"
                  style={{ color: '#11551a' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1a7a28')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#11551a')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {authView === 'signup' && (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <input
                  type="password"
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="flex-1 text-white py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: '#f6d413' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#e5c312')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
                  >
                    {loading ? 'Signing up...' : 'Sign Up'}
                  </button>
                  <button
                    onClick={() => {
                      setAuthView('signin')
                      setError(null)
                      setSuccess(null)
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {authView === 'forgot' && (
              <div className="space-y-3">
                <p className="text-gray-600 dark:text-gray-300 text-center text-lg">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="flex-1 text-white py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: '#11551a' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1a7a28')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    onClick={() => {
                      setAuthView('signin')
                      setError(null)
                      setSuccess(null)
                      setEmail('')
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {authView === 'reset' && (
              <ResetPasswordForm
                onReset={handleResetPassword}
                onCancel={() => {
                  setAuthView('signin')
                  setError(null)
                  setSuccess(null)
                }}
                error={error}
                success={success}
                loading={loading}
              />
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => setView('dashboard')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="Go to Dashboard"
              >
                <Image 
                  src="/taskwell-logo.png" 
                  alt="Taskwell" 
                  height={48}
                  width={200}
                  className="h-12 w-auto"
                  style={{ width: 'auto' }}
                  priority
                />
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setView('dashboard')}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  view === 'dashboard'
                    ? 'text-white shadow-md bg-[#11551a]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('tasks')}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  view === 'tasks'
                    ? 'text-white shadow-md bg-[#11551a]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setView('daily')}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  view === 'daily'
                    ? 'text-white shadow-md bg-[#11551a]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setView('today')}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  view === 'today'
                    ? 'text-white shadow-md bg-[#11551a]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Workflow
              </button>
              <button
                onClick={() => setView('settings')}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  view === 'settings'
                    ? 'text-white shadow-md bg-[#11551a]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: '#f56714' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e55d13')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f56714')}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setView('dashboard')
                    setMobileMenuOpen(false)
                  }}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label="Go to Dashboard"
                >
                  <Image 
                    src="/taskwell-logo.png" 
                    alt="Taskwell" 
                    height={40}
                    width={167}
                    className="h-10 w-auto"
                    style={{ width: 'auto' }}
                    priority
                  />
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg transition-all duration-200 active:scale-[0.95] cursor-pointer"
                style={{ backgroundColor: mobileMenuOpen ? '#11551a' : '#f0f0f0' }}
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: mobileMenuOpen ? '#ffffff' : '#11551a' }}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            {mobileMenuOpen && (
              <div className="mt-3 space-y-2 mobile-menu-enter">
                <button
                  onClick={() => {
                    setView('dashboard')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    view === 'dashboard' ? 'text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  style={view === 'dashboard' ? { backgroundColor: '#11551a' } : {}}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setView('tasks')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    view === 'tasks' ? 'text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  style={view === 'tasks' ? { backgroundColor: '#11551a' } : {}}
                >
                  Tasks
                </button>
                <button
                  onClick={() => {
                    setView('daily')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    view === 'daily' ? 'text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  style={view === 'daily' ? { backgroundColor: '#11551a' } : {}}
                >
                  Daily
                </button>
                <button
                  onClick={() => {
                    setView('today')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    view === 'today' ? 'text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  style={view === 'today' ? { backgroundColor: '#11551a' } : {}}
                >
                  Workflow
                </button>
                <button
                  onClick={() => {
                    setView('settings')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    view === 'settings' ? 'text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  style={view === 'settings' ? { backgroundColor: '#11551a' } : {}}
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-white px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: '#f56714' }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' ? <DashboardView /> : view === 'tasks' ? <TasksView /> : view === 'daily' ? <DailyView /> : view === 'today' ? <TodayView /> : <SettingsView user={user} darkMode={darkMode} setDarkMode={setDarkMode} />}
      </div>
    </div>
  )
}

function ResetPasswordForm({ onReset, onCancel, error, success, loading }: any) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = () => {
    if (newPassword !== confirmPassword) {
      return
    }
    onReset(newPassword)
  }

  return (
    <div className="space-y-3">
      <p className="text-gray-600 dark:text-gray-300 text-center text-lg">
        Enter your new password below.
      </p>
      <input
        type="password"
        placeholder="New Password (min. 6 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
      />
      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <p className="text-red-600 dark:text-red-400 text-lg">Passwords do not match</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
          className="flex-1 text-white py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{ backgroundColor: '#11551a' }}
          onMouseEnter={(e) => !loading && newPassword === confirmPassword && newPassword.length >= 6 && (e.currentTarget.style.backgroundColor = '#1a7a28')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function DashboardView() {
  const [tasks, setTasks] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [habitGroups, setHabitGroups] = useState<any[]>([])
  const [calibrations, setCalibrations] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<any[]>([])
  const supabase = createClient()

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, categories(*), sub_tasks(*)')
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  const loadHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('sort_order')
    if (data) setHabits(data)
  }

  const loadHabitGroups = async () => {
    const { data } = await supabase
      .from('habit_groups')
      .select('*')
      .order('sort_order')
    if (data) setHabitGroups(data)
  }

  const loadCalibrations = async () => {
    const { data } = await supabase
      .from('calibrations')
      .select('*')
      .order('sort_order')
    if (data) setCalibrations(data)
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (data) setCategories(data)
  }

  const getTotalHabitItemsForDate = (dateStr: string) => {
    const groupsById = new Map<string, any>(habitGroups.map(g => [g.id, g]))
    const isGroupActive = (groupId: string) => {
      const group = groupsById.get(groupId)
      return !!group && isActiveOnDate(dateStr, group)
    }

    const activeHabits = habits.filter(h => {
      if (!isActiveOnDate(dateStr, h)) return false
      if (h.group_id) return isGroupActive(h.group_id)
      return true
    })

    const activeGroupIds = new Set(activeHabits.filter(h => h.group_id).map(h => h.group_id))
    const activeUngroupedCount = activeHabits.filter(h => !h.group_id).length
    return activeGroupIds.size + activeUngroupedCount
  }

  // Calculate habit completions for a specific date (groups + ungrouped habits)
  const calculateHabitCompletionsForDate = async (dateStr: string) => {
    // Get all habit completions for this date
    const { data: habitCompletions } = await supabase
      .from('habit_completions')
      .select('habit_id, completed')
      .eq('date', dateStr)
    
    const groupsById = new Map<string, any>(habitGroups.map(g => [g.id, g]))
    const isGroupActive = (groupId: string) => {
      const group = groupsById.get(groupId)
      return !!group && isActiveOnDate(dateStr, group)
    }

    // Group habits by group_id
    const habitsByGroup = new Map<string, string[]>()
    const ungroupedHabits: string[] = []
    
    habits.forEach(habit => {
      if (!isActiveOnDate(dateStr, habit)) return
      if (habit.group_id && !isGroupActive(habit.group_id)) return
      if (habit.group_id) {
        if (!habitsByGroup.has(habit.group_id)) {
          habitsByGroup.set(habit.group_id, [])
        }
        habitsByGroup.get(habit.group_id)!.push(habit.id)
      } else {
        ungroupedHabits.push(habit.id)
      }
    })
    
    // Create a map of habit_id to completion status
    const completionMap = new Map<string, boolean>()
    if (habitCompletions) {
      habitCompletions.forEach(hc => {
        completionMap.set(hc.habit_id, hc.completed)
      })
    }
    
    // Check which groups have at least one completed habit
    const completedGroups = new Set<string>()
    habitsByGroup.forEach((habitIds, groupId) => {
      const hasCompleted = habitIds.some(habitId => completionMap.get(habitId) === true)
      if (hasCompleted) {
        completedGroups.add(groupId)
      }
    })
    
    // Count completed ungrouped habits
    const completedUngrouped = ungroupedHabits.filter(habitId => completionMap.get(habitId) === true).length
    
    const totalGroups = habitsByGroup.size
    const totalUngrouped = ungroupedHabits.length
    const completed = completedGroups.size + completedUngrouped
    const total = totalGroups + totalUngrouped
    
    return { completed, total }
  }

  const calculateDailyData = async () => {
    const today = new Date()
    const days = []
    
    for (let i = 9; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const dateStr = date.toISOString().split('T')[0]
      
      // Calculate task points for this day
      let taskPoints = 0
      const completedTasks = tasks.filter(task => {
        if (task.sub_tasks && task.sub_tasks.length > 0) {
          return false
        }
        return task.status === 'Complete' && task.completion_date === dateStr
      })
      taskPoints = completedTasks.reduce((sum, task) => sum + (task.points ?? 10), 0)
      
      // Add points from completed subtasks
      tasks.forEach(task => {
        // Dropped tasks should not contribute points to scores
        if (task.status === 'Dropped') return
        if (task.sub_tasks && task.sub_tasks.length > 0) {
          task.sub_tasks
            .filter((st: any) => st.completion_date === dateStr)
            .forEach((st: any) => {
              taskPoints += (st.points ?? 0)
            })
        }
      })
      
      // Calculate habit completions (groups + ungrouped habits)
      const habitCompletions = await calculateHabitCompletionsForDate(dateStr)
      const habitCount = habitCompletions.completed
      const totalHabits = habitCompletions.total
      
      // Calculate average calibration score (only calibrations active on this date)
      const { data: calibrationScores } = await supabase
        .from('calibration_scores')
        .select('*')
        .eq('date', dateStr)
      
      const activeCalibrationIds = new Set(
        calibrations
          .filter(c => isActiveOnDate(dateStr, c))
          .map(c => c.id)
      )

      const relevantScores = (calibrationScores || []).filter((cs: any) => activeCalibrationIds.has(cs.calibration_id))
      const avgCalibration = relevantScores.length > 0
        ? relevantScores.reduce((sum: number, cs: any) => sum + cs.score, 0) / relevantScores.length
        : 0
      
      // Format date as "Fri 19 Dec", "Tue 6 Jan" etc.
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).replace(',', '').trim()
      const day = date.getDate()
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      const dateLabel = `${weekday} ${day} ${month}`
      
      days.push({
        date: dateStr,
        dateLabel,
        taskPoints,
        habitCount,
        totalHabits,
        avgCalibration
      })
    }
    
    setDailyData(days)
  }

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        loadTasks(),
        loadHabits(),
        loadHabitGroups(),
        loadCalibrations(),
        loadCategories()
      ])
    }
    loadAll()
  }, [])

  useEffect(() => {
    if (tasks.length > 0 || habits.length > 0 || habitGroups.length > 0 || calibrations.length > 0) {
      calculateDailyData()
    }
  }, [tasks, habits, habitGroups, calibrations])

  // Task summary calculations
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'Complete').length
  const totalPoints = tasks
    .filter(t => t.status !== 'Dropped')
    .reduce((sum, t) => sum + (t.points ?? 10), 0)
  const completedPoints = tasks.reduce((sum, task) => {
    // Dropped tasks should not contribute points to scores
    if (task.status === 'Dropped') return sum
    if (task.sub_tasks && task.sub_tasks.length > 0) {
      return sum + task.sub_tasks
        .filter((st: any) => st.completion_date !== null)
        .reduce((stSum: number, st: any) => stSum + (st.points ?? 0), 0)
    }
    return sum + (task.status === 'Complete' ? (task.points ?? 10) : 0)
  }, 0)
  
  // Status breakdown
  const statusBreakdown = ['Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped'].map(status => ({
    status,
    count: tasks.filter(t => t.status === status).length
  })).filter(s => s.count > 0)

  // Category breakdown
  const categoryBreakdown = categories.map(cat => ({
    category: cat,
    count: tasks.filter(t => t.category_id === cat.id).length
  })).filter(c => c.count > 0)

  // Calculate 10-day averages
  const avgHabitCompletion = dailyData.length > 0 
    ? dailyData.reduce((sum, d) => sum + d.habitCount, 0) / dailyData.length
    : 0
  const avgCalibration = dailyData.length > 0
    ? dailyData.reduce((sum, d) => sum + d.avgCalibration, 0) / dailyData.length
    : 0
  const avgPoints = dailyData.length > 0
    ? dailyData.reduce((sum, d) => sum + d.taskPoints, 0) / dailyData.length
    : 0

  // Calculate Habits Score for a specific day (out of 100)
  const calculateHabitsScore = (day: any) => {
    return day.totalHabits > 0 ? (day.habitCount / day.totalHabits) * 100 : 0
  }

  // Calculate 10-day average Habits Score
  const calculateHabitsScoreAverage = () => {
    if (dailyData.length === 0) return 0
    const sum = dailyData.reduce((sum, day) => sum + calculateHabitsScore(day), 0)
    return sum / dailyData.length
  }

  // Calculate Calibration Score for a specific day (out of 100)
  const calculateCalibrationScore = (day: any) => {
    return (day.avgCalibration / 5) * 100
  }

  // Calculate 10-day average Calibration Score
  const calculateCalibrationScoreAverage = () => {
    if (dailyData.length === 0) return 0
    const sum = dailyData.reduce((sum, day) => sum + calculateCalibrationScore(day), 0)
    return sum / dailyData.length
  }

  // Calculate Overall Score for a specific day
  const calculateOverallScore = (day: any) => {
    // Habits completion %
    const habitsPercent = calculateHabitsScore(day)
    
    // Calibration % (out of max 5)
    const calibrationPercent = calculateCalibrationScore(day)
    
    // Tasks % (points earned / total points available, capped at 100)
    const tasksPercent = totalPoints > 0 ? Math.min(100, (day.taskPoints / totalPoints) * 100) : 0
    
    // Average of the three percentages
    return (habitsPercent + calibrationPercent + tasksPercent) / 3
  }

  // Calculate 10-day average Overall Score
  const calculateOverallScoreAverage = () => {
    if (dailyData.length === 0) return 0
    const sum = dailyData.reduce((sum, day) => sum + calculateOverallScore(day), 0)
    return sum / dailyData.length
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const totalHabitItems = getTotalHabitItemsForDate(todayStr)
  const maxPoints = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.taskPoints), 10) : 10
  const maxHabits = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.totalHabits), 1) : 1
  const totalCalibrations = calibrations.filter(c => isActiveOnDate(todayStr, c)).length

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold" style={{ color: '#11551a' }}>Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Overall Score</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Yesterday:</span>
              <span className="font-bold text-2xl" style={{ color: '#11551a' }}>
                {dailyData.length >= 2 ? Math.round(calculateOverallScore(dailyData[dailyData.length - 2])) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">10-day Avg:</span>
              <span className="font-bold text-3xl" style={{ color: '#11551a' }}>
                {dailyData.length > 0 ? Math.round(calculateOverallScoreAverage()) : '-'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
              <div 
                className="h-3 rounded-full transition-all"
                style={{ 
                  width: `${dailyData.length > 0 ? calculateOverallScoreAverage() : 0}%`,
                  backgroundColor: '#11551a'
                }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Tasks</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Yesterday:</span>
              <span className="font-bold text-2xl" style={{ color: '#11551a' }}>
                {dailyData.length >= 2 ? dailyData[dailyData.length - 2].taskPoints : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">10-day Avg:</span>
              <span className="font-bold text-3xl" style={{ color: '#11551a' }}>
                {dailyData.length > 0 ? Math.round(avgPoints) : '-'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
              <div 
                className="h-3 rounded-full transition-all"
                style={{ 
                  width: `${maxPoints > 0 ? (avgPoints / maxPoints) * 100 : 0}%`,
                  backgroundColor: '#11551a'
                }}
              />
            </div>
          </div>
        </div>

        {/* Habits Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Habits</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Yesterday:</span>
              <span className="font-bold text-2xl" style={{ color: '#11551a' }}>
                {dailyData.length >= 2 ? Math.round(calculateHabitsScore(dailyData[dailyData.length - 2])) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">10-day Avg:</span>
              <span className="font-bold text-3xl" style={{ color: '#11551a' }}>
                {dailyData.length > 0 ? Math.round(calculateHabitsScoreAverage()) : '-'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
              <div 
                className="h-3 rounded-full transition-all"
                style={{ 
                  width: `${dailyData.length > 0 ? calculateHabitsScoreAverage() : 0}%`,
                  backgroundColor: '#11551a'
                }}
              />
            </div>
          </div>
        </div>

        {/* Calibration Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Calibration</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Yesterday:</span>
              <span className="font-bold text-2xl" style={{ color: '#11551a' }}>
                {dailyData.length >= 2 ? Math.round(calculateCalibrationScore(dailyData[dailyData.length - 2])) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">10-day Avg:</span>
              <span className="font-bold text-3xl" style={{ color: '#11551a' }}>
                {dailyData.length > 0 ? Math.round(calculateCalibrationScoreAverage()) : '-'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
              <div 
                className="h-3 rounded-full transition-all"
                style={{ 
                  width: `${dailyData.length > 0 ? calculateCalibrationScoreAverage() : 0}%`,
                  backgroundColor: '#11551a'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Progress Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 md:p-5">
        <h3 className="text-xl font-bold mb-5" style={{ color: '#11551a' }}>Daily Progress (Last 10 Days)</h3>
        
        <div className="space-y-6">
          {/* Task Points Chart */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Task Points</h4>
            {/* Desktop: Horizontal bars */}
            <div className="hidden md:flex items-end justify-between gap-2 h-48">
              {dailyData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '180px' }}>
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${(day.taskPoints / maxPoints) * 160}px`,
                        backgroundColor: '#11551a',
                        minHeight: day.taskPoints > 0 ? '4px' : '0px'
                      }}
                      title={`${day.dateLabel}: ${day.taskPoints} points`}
                    />
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {day.taskPoints}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center whitespace-nowrap">
                    {day.dateLabel}
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile: Vertical bars with dates on left */}
            <div className="md:hidden space-y-2">
              {dailyData.slice().reverse().map((day, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-20 text-[10px] text-gray-500 flex-shrink-0">
                    {day.dateLabel}
                  </div>
                  <div className="text-xs text-gray-600 w-10 flex-shrink-0 text-right">
                    {day.taskPoints}
                  </div>
                  <div className="flex-1 h-6 bg-gray-200 rounded relative overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${(day.taskPoints / maxPoints) * 100}%`,
                        backgroundColor: '#11551a',
                        minWidth: day.taskPoints > 0 ? '2px' : '0px'
                      }}
                      title={`${day.dateLabel}: ${day.taskPoints} points`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Habits Chart */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Habits Completed</h4>
            {/* Desktop: Horizontal bars */}
            <div className="hidden md:flex items-end justify-between gap-2 h-48">
              {dailyData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '180px' }}>
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${maxHabits > 0 ? (day.habitCount / maxHabits) * 160 : 0}px`,
                        backgroundColor: '#3B82F6',
                        minHeight: day.habitCount > 0 ? '4px' : '0px'
                      }}
                      title={`${day.dateLabel}: ${day.habitCount}/${day.totalHabits} habits`}
                    />
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {day.habitCount}/{day.totalHabits}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center whitespace-nowrap">
                    {day.dateLabel}
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile: Vertical bars with dates on left */}
            <div className="md:hidden space-y-2">
              {dailyData.slice().reverse().map((day, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-20 text-[10px] text-gray-500 flex-shrink-0">
                    {day.dateLabel}
                  </div>
                  <div className="text-xs text-gray-600 w-12 flex-shrink-0 text-right">
                    {day.habitCount}/{day.totalHabits}
                  </div>
                  <div className="flex-1 h-6 bg-gray-200 rounded relative overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${maxHabits > 0 ? (day.habitCount / maxHabits) * 100 : 0}%`,
                        backgroundColor: '#3B82F6',
                        minWidth: day.habitCount > 0 ? '2px' : '0px'
                      }}
                      title={`${day.dateLabel}: ${day.habitCount}/${day.totalHabits} habits`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calibration Chart */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Average Calibration Score</h4>
            {/* Desktop: Horizontal bars */}
            <div className="hidden md:flex items-end justify-between gap-2 h-48">
              {dailyData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '180px' }}>
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${(day.avgCalibration / 5) * 160}px`,
                        backgroundColor: '#8B5CF6',
                        minHeight: day.avgCalibration > 0 ? '4px' : '0px'
                      }}
                      title={`${day.dateLabel}: ${day.avgCalibration.toFixed(1)}/5`}
                    />
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {day.avgCalibration > 0 ? day.avgCalibration.toFixed(1) : '-'}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center whitespace-nowrap">
                    {day.dateLabel}
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile: Vertical bars with dates on left */}
            <div className="md:hidden space-y-2">
              {dailyData.slice().reverse().map((day, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-20 text-[10px] text-gray-500 flex-shrink-0">
                    {day.dateLabel}
                  </div>
                  <div className="text-xs text-gray-600 w-10 flex-shrink-0 text-right">
                    {day.avgCalibration > 0 ? day.avgCalibration.toFixed(1) : '-'}
                  </div>
                  <div className="flex-1 h-6 bg-gray-200 rounded relative overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${(day.avgCalibration / 5) * 100}%`,
                        backgroundColor: '#8B5CF6',
                        minWidth: day.avgCalibration > 0 ? '2px' : '0px'
                      }}
                      title={`${day.dateLabel}: ${day.avgCalibration.toFixed(1)}/5`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status and Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Tasks by Status</h3>
          <div className="space-y-2">
            {statusBreakdown.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{status}:</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 rounded-full transition-all"
                      style={{
                        width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%`,
                        backgroundColor: status === 'Complete' ? '#11551a' : '#6B7280'
                      }}
                    />
                  </div>
                  <span className="font-semibold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Tasks by Category</h3>
          <div className="space-y-2">
            {categoryBreakdown.map(({ category, count }) => (
              <div key={category.id} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{category.name}:</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 rounded-full transition-all"
                      style={{
                        width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                  <span className="font-semibold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <p className="text-gray-500 text-center py-4">No categorized tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TodayView() {
  const [todayItems, setTodayItems] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadTodayItems()
    loadTasks()
    loadHabits()
    loadCategories()
  }, [])

  const loadTodayItems = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('today_items')
      .select('*')
      .eq('user_id', user?.id)
      .order('sort_order', { ascending: true })
    
    if (data) setTodayItems(data)
  }

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, categories(*), sub_tasks(*)')
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  const loadHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('sort_order')
    if (data) setHabits(data)
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (data) setCategories(data)
  }

  const getTodayItemsWithData = () => {
    return todayItems.map(item => {
      if (item.item_type === 'task') {
        const task = tasks.find(t => t.id === item.item_id)
        return { ...item, data: task, type: 'task' }
      } else {
        const habit = habits.find(h => h.id === item.item_id)
        return { ...item, data: habit, type: 'habit' }
      }
    }).filter(item => item.data) // Filter out items where data doesn't exist
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', itemId)
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (itemId !== draggedItemId) {
      setDragOverItemId(itemId)
    }
  }

  const handleDragLeave = () => {
    setDragOverItemId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault()
    setDragOverItemId(null)
    
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null)
      return
    }

    const items = [...todayItems].sort((a, b) => a.sort_order - b.sort_order)
    const draggedIndex = items.findIndex(item => item.id === draggedItemId)
    const targetIndex = items.findIndex(item => item.id === targetItemId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null)
      return
    }

    // Remove dragged item from array
    const [draggedItem] = items.splice(draggedIndex, 1)
    // Insert at new position
    items.splice(targetIndex, 0, draggedItem)

    // Update sort_order for all items
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index
    }))

    // Update all items in database
    for (const update of updates) {
      await supabase
        .from('today_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
    
    setDraggedItemId(null)
    loadTodayItems()
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
    setDragOverItemId(null)
  }

  const calculateNextDueDate = (currentDueDate: string, frequency: any): string => {
    const date = new Date(currentDueDate + 'T00:00:00')
    
    try {
      const parsed = typeof frequency === 'string' ? JSON.parse(frequency) : frequency
      if (parsed.interval && parsed.unit) {
        const interval = parsed.interval
        switch (parsed.unit) {
          case 'days':
            date.setDate(date.getDate() + interval)
            break
          case 'weeks':
            date.setDate(date.getDate() + (interval * 7))
            break
          case 'months':
            date.setMonth(date.getMonth() + interval)
            break
          case 'years':
            date.setFullYear(date.getFullYear() + interval)
            break
        }
        return date.toISOString().split('T')[0]
      }
    } catch {
      // Not JSON, treat as simple string
    }
    
    // Handle simple frequency strings
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1)
        break
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    
    return date.toISOString().split('T')[0]
  }

  const toggleTaskComplete = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const isDone = task.status === 'Complete' || task.status === 'Dropped'
    
    await supabase
      .from('tasks')
      .update({
        status: isDone ? 'To do' : 'Complete',
        completion_date: isDone ? null : today
      })
      .eq('id', task.id)
    
    loadTasks()
  }

  const toggleHabitComplete = async (habitId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', today)
      .eq('user_id', user?.id)
      .single()
    
    const completed = existing?.completed || false
    
    await supabase
      .from('habit_completions')
      .upsert({
        habit_id: habitId,
        date: today,
        user_id: user?.id,
        completed: !completed
      }, {
        onConflict: 'habit_id,date,user_id'
      })
    
    // Reload habits to sync with Daily page
    loadHabits()
  }

  const removeFromToday = async (itemId: string) => {
    await supabase
      .from('today_items')
      .delete()
      .eq('id', itemId)
    
    loadTodayItems()
  }

  const getCompletedPoints = (task: any): number => {
    if (task.sub_tasks && task.sub_tasks.length > 0) {
      return task.sub_tasks
        .filter((st: any) => st.completion_date !== null)
        .reduce((sum: number, st: any) => sum + (st.points ?? 0), 0)
    } else {
      return (task.status === 'Complete' || task.status === 'Dropped') ? (task.points ?? 10) : 0
    }
  }

  const getTotalPoints = (task: any): number => {
    return task.points ?? 10
  }

  const getCompletedSubtasksCount = (task: any): number => {
    if (!task.sub_tasks || task.sub_tasks.length === 0) return 0
    return task.sub_tasks.filter((st: any) => st.completion_date !== null).length
  }

  const getHabitCompletionStatus = async (habitId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('habit_completions')
      .select('completed')
      .eq('habit_id', habitId)
      .eq('date', today)
      .eq('user_id', user?.id)
      .single()
    
    return data?.completed || false
  }

  const itemsWithData = getTodayItemsWithData()
  const sortedItems = [...itemsWithData].sort((a, b) => a.sort_order - b.sort_order)

  const clearCompleted = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Remove completed items from workflow (delete today_items entries)
    // without changing their completion status
    for (const item of todayItems) {
      if (item.item_type === 'task') {
        const task = tasks.find(t => t.id === item.item_id)
        if (task && (task.status === 'Complete' || task.status === 'Dropped')) {
          // Only remove from workflow, keep task as complete
          await supabase
            .from('today_items')
            .delete()
            .eq('id', item.id)
        }
      } else if (item.item_type === 'habit') {
        const habit = habits.find(h => h.id === item.item_id)
        if (habit) {
          // Check if habit is completed for the date associated with this workflow item
          const { data: completion } = await supabase
            .from('habit_completions')
            .select('completed')
            .eq('habit_id', habit.id)
            .eq('date', item.date)
            .eq('user_id', user?.id)
            .maybeSingle()
          
          if (completion?.completed) {
            // Only remove from workflow, keep habit as complete
            await supabase
              .from('today_items')
              .delete()
              .eq('id', item.id)
          }
        }
      }
    }
    
    loadTodayItems()
  }

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Remove all items from workflow (delete all today_items entries)
    // without changing their completion status
    for (const item of todayItems) {
      await supabase
        .from('today_items')
        .delete()
        .eq('id', item.id)
    }
    
    loadTodayItems()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <h2 className="text-2xl font-bold dark:text-white" style={{ color: '#11551a' }}>Workflow</h2>
        <div className="flex gap-2">
          <button
            onClick={clearCompleted}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Clear completed
          </button>
          <button
            onClick={clearAll}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      </div>
      
      {selectedTask ? (
        /* Task Detail View */
        <TaskDetailView
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (id: string | null, updates: any) => {
            const { data: { user } } = await supabase.auth.getUser()
            const skipRecurrence = updates?._skipRecurrence === true
            const allowedFields = ['title', 'status', 'category_id', 'description', 'due_date', 'is_hard_deadline', 'completion_date', 'is_recurring', 'recurring_frequency', 'is_repeating', 'repeating_frequency', 'points']
            const filteredUpdates: any = {}
            for (const key of allowedFields) {
              if (key in updates) {
                filteredUpdates[key] = updates[key]
              }
            }
            
            // Only adjust completion_date when status is being updated
            if ('status' in filteredUpdates) {
              if ((filteredUpdates.status === 'Complete' || filteredUpdates.status === 'Dropped') && !filteredUpdates.completion_date) {
                filteredUpdates.completion_date = new Date().toISOString().split('T')[0]
              }
              if (filteredUpdates.status !== 'Complete' && filteredUpdates.status !== 'Dropped') {
                filteredUpdates.completion_date = null
              }
            }
            
            // If marking task as Complete, check if it's recurring or repeating and create new task
            if (!skipRecurrence && id !== null && 'status' in filteredUpdates && (filteredUpdates.status === 'Complete' || filteredUpdates.status === 'Dropped')) {
              // Fetch the original task to check if it's recurring/repeating
              const { data: originalTask } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single()
              
              if (originalTask) {
                const isDone = originalTask.status === 'Complete' || originalTask.status === 'Dropped'
                
                // If completing a recurring task, create a duplicate with next due date
                const isRecurring = originalTask.is_recurring === true || originalTask.is_recurring === 'true' || originalTask.is_recurring === 1
                if (!isDone && isRecurring && originalTask.recurring_frequency && originalTask.due_date) {
                  const nextDueDate = calculateNextDueDate(originalTask.due_date, originalTask.recurring_frequency)
                  
                  // Create duplicate task
                  const duplicateTask = {
                    title: originalTask.title,
                    status: 'To do',
                    category_id: originalTask.category_id,
                    description: originalTask.description,
                    due_date: nextDueDate,
                    is_hard_deadline: originalTask.is_hard_deadline,
                    is_recurring: originalTask.is_recurring,
                    recurring_frequency: originalTask.recurring_frequency,
                    is_repeating: originalTask.is_repeating || false,
                    repeating_frequency: originalTask.repeating_frequency || null,
                    points: originalTask.points ?? 10,
                    user_id: user?.id
                  }
                  
                  const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
                  if (insertError) {
                    console.error('Error creating recurring task:', insertError)
                  }
                }
                
                // If completing a repeating task, create a duplicate with next due date after completion
                const isRepeating = originalTask.is_repeating === true || originalTask.is_repeating === 'true' || originalTask.is_repeating === 1
                if (!isDone && isRepeating && originalTask.repeating_frequency) {
                  // Calculate next due date from today (completion date) instead of original due date
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const todayStr = today.toISOString().split('T')[0]
                  const nextDueDate = calculateNextDueDate(todayStr, originalTask.repeating_frequency)
                  
                  // Create duplicate task
                  const duplicateTask = {
                    title: originalTask.title,
                    status: 'To do',
                    category_id: originalTask.category_id,
                    description: originalTask.description,
                    due_date: nextDueDate,
                    is_hard_deadline: originalTask.is_hard_deadline,
                    is_recurring: originalTask.is_recurring || false,
                    recurring_frequency: originalTask.recurring_frequency || null,
                    is_repeating: originalTask.is_repeating,
                    repeating_frequency: originalTask.repeating_frequency,
                    points: originalTask.points ?? 10,
                    user_id: user?.id
                  }
                  
                  const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
                  if (insertError) {
                    console.error('Error creating repeating task:', insertError)
                  }
                }
              }
            }
            
            const result = await supabase
              .from('tasks')
              .update(filteredUpdates)
              .eq('id', id)
              .select('*, categories(*)')
              .single()
            
            if (result.data) {
              loadTasks()
              loadTodayItems()
              return result.data
            }
            return null
          }}
          onDelete={async (id: string) => {
            await supabase.from('tasks').delete().eq('id', id)
            loadTasks()
            loadTodayItems()
            setSelectedTask(null)
          }}
          onShowCategories={() => {}}
        />
      ) : sortedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No items selected for today</p>
          <p className="text-gray-400 text-base mt-2">Add tasks from the Tasks page or habits from the Daily page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item, index) => {
            if (item.type === 'task' && item.data) {
              const task = item.data
              const isDone = task.status === 'Complete' || task.status === 'Dropped'
              
              return (
                <div
                  key={item.id}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-3 group ${
                    dragOverItemId === item.id ? 'border-2 border-green-500' : ''
                  }`}
                  style={{ minHeight: '80px' }}
                >
                  <div className="flex items-start gap-2 h-full">
                    {/* Drag Handle */}
                    <div 
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation()
                        handleDragStart(e, item.id)
                      }}
                      onDragEnd={handleDragEnd}
                      className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="Drag to reorder"
                    >
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 5h2v2H9V5zm0 6h2v2H9v-2zm0 6h2v2H9v-2zm4-12h2v2h-2V5zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2z" />
                      </svg>
                    </div>

                    {/* Completion Checkbox and Remove Button */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleTaskComplete(task, e as any)
                        }}
                        className="w-5 h-5 mt-0.5 cursor-pointer"
                        style={{ accentColor: '#11551a' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {/* Remove Circle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromToday(item.id)
                        }}
                        className="w-5 h-5 rounded-full border-2 bg-green-600 border-green-600 hover:border-red-600 hover:bg-red-50 flex-shrink-0 transition-all"
                        title="Remove from today"
                        style={{ backgroundColor: '#11551a', borderColor: '#11551a' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#dc2626'
                          e.currentTarget.style.backgroundColor = '#fee2e2'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#11551a'
                          e.currentTarget.style.backgroundColor = '#11551a'
                        }}
                      />
                    </div>
                    
                    {/* Task Info - Clickable to open detail view */}
                    <div 
                      className="flex-1 flex flex-col overflow-hidden cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className={`font-semibold text-base transition-colors ${
                              isDone ? 'line-through text-gray-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-400'
                            }`}>
                              {task.title}
                            </h4>
                            {(task.is_recurring === true || task.is_recurring === 'true') && (
                              <span className="text-base" title="Recurring task">🔁</span>
                            )}
                            {(task.is_repeating === true || task.is_repeating === 'true') && (
                              <span className="text-base" title="Repeating task">⏭️</span>
                            )}
                            {task.sub_tasks && task.sub_tasks.length > 0 && (
                              <span className="text-base" title={`${task.sub_tasks.length} subtask${task.sub_tasks.length > 1 ? 's' : ''}`}>📋</span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                            <span>{task.status}</span>
                            <span className="text-gray-400">•</span>
                            <span>Points: {getCompletedPoints(task)}/{getTotalPoints(task)}</span>
                            {task.sub_tasks && task.sub_tasks.length > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span>Subtasks: {getCompletedSubtasksCount(task)}/{task.sub_tasks.length}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {task.categories && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-md text-sm text-white font-medium flex-shrink-0"
                            style={{ backgroundColor: task.categories.color }}
                          >
                            {task.categories.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto pt-1.5">
                        {(task.due_date || task.completion_date) && (
                          <p className="text-sm">
                            {task.due_date && (
                              <span className={task.is_hard_deadline ? 'font-bold text-red-600' : 'text-gray-600'}>
                                Due: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                                {task.is_hard_deadline && <span className="ml-1" style={{ fontSize: '16px' }}>❗</span>}
                              </span>
                            )}
                            {task.due_date && task.completion_date && <span className="mx-2 text-gray-400">|</span>}
                            {task.completion_date && (
                              <span style={{ color: '#11551a' }}>
                                ✓ {new Date(task.completion_date + 'T00:00:00').toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            } else if (item.type === 'habit' && item.data) {
              const habit = item.data
              
              return (
                <HabitCard
                  key={item.id}
                  itemId={item.id}
                  habit={habit}
                  today={today}
                  onToggleComplete={toggleHabitComplete}
                  onRemove={() => removeFromToday(item.id)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  draggedItemId={draggedItemId}
                  dragOverItemId={dragOverItemId}
                />
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

function HabitCard({ habit, today, onToggleComplete, onRemove, itemId, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, draggedItemId, dragOverItemId }: any) {
  const [completed, setCompleted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadCompletionStatus()
  }, [habit.id, today])

  const loadCompletionStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('habit_completions')
      .select('completed')
      .eq('habit_id', habit.id)
      .eq('date', today)
      .eq('user_id', user?.id)
      .single()
    
    setCompleted(data?.completed || false)
  }

  const handleToggle = async () => {
    const newCompleted = !completed
    setCompleted(newCompleted)
    await onToggleComplete(habit.id)
    // Reload to sync
    setTimeout(() => loadCompletionStatus(), 100)
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, itemId)}
      onDragOver={(e) => onDragOver(e, itemId)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, itemId)}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-3 ${
        draggedItemId === itemId ? 'opacity-50' : ''
      } ${
        dragOverItemId === itemId ? 'border-2 border-green-500' : ''
      }`}
      style={{ minHeight: '80px', cursor: 'default' }}
    >
      <div className="flex items-start gap-2 h-full">
        {/* Drag Handle */}
        <div 
          className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-0.5"
          onMouseDown={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 5h2v2H9V5zm0 6h2v2H9v-2zm0 6h2v2H9v-2zm4-12h2v2h-2V5zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2z" />
          </svg>
        </div>

        {/* Completion Checkbox and Remove Button */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <input
            type="checkbox"
            checked={completed}
            onChange={handleToggle}
            className="w-5 h-5 mt-0.5 cursor-pointer"
            style={{ accentColor: '#11551a' }}
          />
          {/* Remove Circle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="w-5 h-5 rounded-full border-2 bg-green-600 border-green-600 hover:border-red-600 hover:bg-red-50 flex-shrink-0 transition-all"
            title="Remove from today"
            style={{ backgroundColor: '#11551a', borderColor: '#11551a' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#dc2626'
              e.currentTarget.style.backgroundColor = '#fee2e2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#11551a'
              e.currentTarget.style.backgroundColor = '#11551a'
            }}
          />
        </div>
        
        {/* Habit Info */}
        <div className="flex-1 flex flex-col">
          <h4 className={`font-semibold text-base ${
            completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'
          }`}>
            {habit.name}
          </h4>
          <span className="text-sm text-gray-500 mt-1">Habit</span>
        </div>
      </div>
      </div>
  )
}

function SettingsView({ user, darkMode, setDarkMode }: { user: User; darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  const handleChangePassword = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    // Verify current password by attempting to sign in
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser?.email) {
      setError('Unable to verify user')
      setLoading(false)
      return
    }

    // Try to sign in with current password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    })

    if (signInError) {
      setError('Current password is incorrect')
      setLoading(false)
      return
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    
    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
      <h2 className="text-2xl font-bold mb-5 dark:text-white" style={{ color: '#11551a' }}>Settings</h2>
      
      <div className="space-y-5">
        {/* Dark Mode Toggle */}
        <div>
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Appearance</h3>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Toggle dark mode for a better viewing experience in low light</p>
              </div>
              <button
                onClick={() => {
                  setDarkMode(!darkMode)
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode ? 'bg-green-600' : 'bg-gray-300'
                }`}
                style={darkMode ? { backgroundColor: '#11551a' } : {}}
                role="switch"
                aria-checked={darkMode}
                aria-label="Toggle dark mode"
                type="button"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div>
          <h3 className="text-lg font-semibold mb-2 dark:text-white">Account Information</h3>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">Email</p>
            <p className="text-gray-900 dark:text-white">{user.email}</p>
          </div>
        </div>

        {/* Change Password */}
        <div>
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Change Password</h3>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 text-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-[#e8f5e9] dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-2 rounded-lg mb-3 text-lg">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter new password (min. 6 characters)"
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Confirm new password"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-600 dark:text-red-400 text-lg mt-1">Passwords do not match</p>
              )}
            </div>
            
            <button
              onClick={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="text-white px-5 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: '#11551a' }}
              onMouseEnter={(e) => {
                if (!loading && currentPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6) {
                  e.currentTarget.style.backgroundColor = '#1a7a28'
                }
              }}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TasksView() {
  const [tasks, setTasks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [todayItems, setTodayItems] = useState<Map<string, boolean>>(new Map())
  
  // Load saved state from localStorage
  const loadSavedState = () => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem('tasksViewState')
      if (saved) {
        const parsed = JSON.parse(saved)
        const statusFiltersSet = new Set<string>((parsed.statusFilters || []) as string[])
        const categoryFiltersSet = new Set<string>((parsed.categoryFilters || ['All']) as string[])
        // Handle both old string format and new Set format for dateFilter
        const dateFiltersSet = parsed.dateFilters 
          ? new Set<string>((parsed.dateFilters || ['All']) as string[])
          : parsed.dateFilter 
          ? new Set<string>([parsed.dateFilter])
          : new Set<string>(['All'])
        const attributeFiltersSet = new Set<string>((parsed.attributeFilters || ['All']) as string[])
        const result = {
          sortBy: (parsed.sortBy === 'completion_date' ? 'completion_date' : parsed.sortBy === 'status' ? 'status' : parsed.sortBy === 'category' ? 'category' : parsed.sortBy === 'title' ? 'title' : 'due_date') as 'due_date' | 'completion_date' | 'status' | 'category' | 'title',
          sortOrder: parsed.sortOrder || 'desc',
          statusFilters: statusFiltersSet,
          dateFilters: dateFiltersSet,
          categoryFilters: categoryFiltersSet,
          attributeFilters: attributeFiltersSet
        }
        return result
      }
    } catch (e) {
      console.error('Error loading saved state:', e)
    }
    return null
  }

  const savedState = loadSavedState()
  const [sortBy, setSortBy] = useState<'due_date' | 'completion_date' | 'status' | 'category' | 'title'>(
    (savedState?.sortBy === 'completion_date' || savedState?.sortBy === 'status' || savedState?.sortBy === 'due_date' || savedState?.sortBy === 'category' || savedState?.sortBy === 'title') 
      ? savedState.sortBy 
      : 'due_date'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(savedState?.sortOrder || 'desc')
  const [statusFilters, setStatusFilters] = useState<Set<string>>(savedState?.statusFilters || new Set(['All']))
  const [dateFilters, setDateFilters] = useState<Set<string>>(savedState?.dateFilters || new Set(['All']))
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(savedState?.categoryFilters || new Set(['All']))
  const [attributeFilters, setAttributeFilters] = useState<Set<string>>(savedState?.attributeFilters || new Set(['All']))
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [mobileFilterTab, setMobileFilterTab] = useState<'Status' | 'Date' | 'Category' | 'Attribute' | 'Sort'>('Status')
  const supabase = createClient()

  // Save state to localStorage whenever filters/sorts change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('tasksViewState', JSON.stringify({
        sortBy,
        sortOrder,
        statusFilters: Array.from(statusFilters),
        dateFilters: Array.from(dateFilters),
        categoryFilters: Array.from(categoryFilters),
        attributeFilters: Array.from(attributeFilters)
      }))
    } catch (e) {
      console.error('Error saving state:', e)
    }
  }, [sortBy, sortOrder, statusFilters, dateFilters, categoryFilters, attributeFilters])

  useEffect(() => {
    loadTasks()
    loadCategories()
    loadTodayItems()
  }, [])

  const loadTodayItems = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('today_items')
      .select('item_id')
      .eq('user_id', user?.id)
      .eq('date', today)
      .eq('item_type', 'task')
    
    const itemsMap = new Map<string, boolean>()
    if (data) {
      data.forEach(item => itemsMap.set(item.item_id, true))
    }
    setTodayItems(itemsMap)
  }

  const toggleTaskInToday = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const isInToday = todayItems.get(taskId)
    
    if (isInToday) {
      // Remove from today
      await supabase
        .from('today_items')
        .delete()
        .eq('user_id', user?.id)
        .eq('date', today)
        .eq('item_type', 'task')
        .eq('item_id', taskId)
    } else {
      // Add to today - get max sort_order and add 1
      const { data: existing } = await supabase
        .from('today_items')
        .select('sort_order')
        .eq('user_id', user?.id)
        .eq('date', today)
        .order('sort_order', { ascending: false })
        .limit(1)
      
      const maxSortOrder = existing && existing.length > 0 ? existing[0].sort_order : -1
      
      await supabase
        .from('today_items')
        .insert({
          user_id: user?.id,
          item_type: 'task',
          item_id: taskId,
          date: today,
          sort_order: maxSortOrder + 1
        })
    }
    
    loadTodayItems()
  }

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, categories(*), sub_tasks(*)')
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (data) setCategories(data)
  }

  const handleAddTask = async () => {
    // Open blank task detail view for new task
    const { data: { user } } = await supabase.auth.getUser()
    setSelectedTask({
      id: null,
      title: '',
      status: 'To do',
      category_id: null,
      description: '',
      due_date: null,
      is_hard_deadline: false,
      completion_date: null,
      is_recurring: false,
      recurring_frequency: null,
      is_repeating: false,
      repeating_frequency: null,
      points: 10,
      user_id: user?.id
    })
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    loadTasks()
    if (selectedTask?.id === id) setSelectedTask(null)
  }

  const updateTask = async (id: string | null, updates: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    const skipRecurrence = updates?._skipRecurrence === true
    
    // Filter out non-updatable fields (id, user_id, created_at, categories from join)
    const allowedFields = ['title', 'status', 'category_id', 'description', 'due_date', 'is_hard_deadline', 'completion_date', 'is_recurring', 'recurring_frequency', 'is_repeating', 'repeating_frequency', 'points']
    const filteredUpdates: any = {}
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }
    
    // Only adjust completion_date when status is being updated
    if ('status' in filteredUpdates) {
      // Auto-set completion date when status changes to Complete or Dropped
      if ((filteredUpdates.status === 'Complete' || filteredUpdates.status === 'Dropped') && !filteredUpdates.completion_date) {
        filteredUpdates.completion_date = new Date().toISOString().split('T')[0]
      }
      
      // Clear completion date if status is not Complete/Dropped
      if (filteredUpdates.status !== 'Complete' && filteredUpdates.status !== 'Dropped') {
        filteredUpdates.completion_date = null
      }
    }
  
    // If marking task as Complete, check if it's recurring or repeating and create new task
    if (!skipRecurrence && id !== null && 'status' in filteredUpdates && (filteredUpdates.status === 'Complete' || filteredUpdates.status === 'Dropped')) {
      // Fetch the original task to check if it's recurring/repeating
      const { data: originalTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      
      if (originalTask) {
        const isDone = originalTask.status === 'Complete' || originalTask.status === 'Dropped'
        
        // If completing a recurring task, create a duplicate with next due date
        const isRecurring = originalTask.is_recurring === true || originalTask.is_recurring === 'true' || originalTask.is_recurring === 1
        if (!isDone && isRecurring && originalTask.recurring_frequency && originalTask.due_date) {
          const nextDueDate = calculateNextDueDate(originalTask.due_date, originalTask.recurring_frequency)
          
          // Create duplicate task
          const duplicateTask = {
            title: originalTask.title,
            status: 'To do',
            category_id: originalTask.category_id,
            description: originalTask.description,
            due_date: nextDueDate,
            is_hard_deadline: originalTask.is_hard_deadline,
            is_recurring: originalTask.is_recurring,
            recurring_frequency: originalTask.recurring_frequency,
            is_repeating: originalTask.is_repeating || false,
            repeating_frequency: originalTask.repeating_frequency || null,
            points: originalTask.points ?? 10,
            user_id: user?.id
          }
          
          const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
          if (insertError) {
            console.error('Error creating recurring task:', insertError)
          }
        }
        
        // If completing a repeating task, create a duplicate with next due date after completion
        const isRepeating = originalTask.is_repeating === true || originalTask.is_repeating === 'true' || originalTask.is_repeating === 1
        if (!isDone && isRepeating && originalTask.repeating_frequency) {
          // Calculate next due date from today (completion date) instead of original due date
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayStr = today.toISOString().split('T')[0]
          const nextDueDate = calculateNextDueDate(todayStr, originalTask.repeating_frequency)
          
          // Create duplicate task
          const duplicateTask = {
            title: originalTask.title,
            status: 'To do',
            category_id: originalTask.category_id,
            description: originalTask.description,
            due_date: nextDueDate,
            is_hard_deadline: originalTask.is_hard_deadline,
            is_recurring: originalTask.is_recurring || false,
            recurring_frequency: originalTask.recurring_frequency || null,
            is_repeating: originalTask.is_repeating,
            repeating_frequency: originalTask.repeating_frequency,
            points: originalTask.points ?? 10,
            user_id: user?.id
          }
          
          const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
          if (insertError) {
            console.error('Error creating repeating task:', insertError)
          }
        }
      }
    }
  
    let error
    let result
    
    if (id === null) {
      // Create new task
      // Default points to 10 for new tasks if not specified
      const insertData = {
        ...filteredUpdates,
        points: filteredUpdates.points ?? 10,
        user_id: user?.id
      }
      result = await supabase
        .from('tasks')
        .insert(insertData)
        .select('*, categories(*)')
        .single()
      error = result.error
    } else {
      // Update existing task
      result = await supabase
        .from('tasks')
        .update(filteredUpdates)
        .eq('id', id)
        .select('*, categories(*)')
        .single()
      error = result.error
    }
    
    if (error) {
      console.error('Full error:', JSON.stringify(error, null, 2))
      alert('Error: ' + (error.message || 'Failed to save task'))
      return null
    } else {
      loadTasks() // This reloads all tasks with categories
      return result.data
    }
  }

  const toggleComplete = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening detail view
    
    const isDone = task.status === 'Complete' || task.status === 'Dropped'
    
    // If completing a recurring task, create a duplicate with next due date
    if (!isDone && (task.is_recurring === true || task.is_recurring === 'true') && task.recurring_frequency && task.due_date) {
      const nextDueDate = calculateNextDueDate(task.due_date, task.recurring_frequency)
      
      // Create duplicate task
      const { data: { user } } = await supabase.auth.getUser()
      const duplicateTask = {
        title: task.title,
        status: 'To do',
        category_id: task.category_id,
        description: task.description,
        due_date: nextDueDate,
        is_hard_deadline: task.is_hard_deadline,
        is_recurring: task.is_recurring,
        recurring_frequency: task.recurring_frequency,
        is_repeating: task.is_repeating || false,
        repeating_frequency: task.repeating_frequency || null,
        points: task.points ?? 10,
        user_id: user?.id
      }
      
      await supabase.from('tasks').insert(duplicateTask)
    }
    
    // If completing a repeating task, create a duplicate with next due date after completion
    // Check for both boolean true and string 'true' to handle database type variations
    const isRepeating = task.is_repeating === true || task.is_repeating === 'true' || task.is_repeating === 1
    if (!isDone && isRepeating && task.repeating_frequency) {
      console.log('Creating repeating task. Task data:', { 
        is_repeating: task.is_repeating, 
        repeating_frequency: task.repeating_frequency,
        task_id: task.id 
      })
      // Calculate next due date from today (completion date) instead of original due date
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const nextDueDate = calculateNextDueDate(todayStr, task.repeating_frequency)
      
      // Create duplicate task
      const { data: { user } } = await supabase.auth.getUser()
      const duplicateTask = {
        title: task.title,
        status: 'To do',
        category_id: task.category_id,
        description: task.description,
        due_date: nextDueDate,
        is_hard_deadline: task.is_hard_deadline,
        is_recurring: task.is_recurring || false,
        recurring_frequency: task.recurring_frequency || null,
        is_repeating: task.is_repeating,
        repeating_frequency: task.repeating_frequency,
        points: task.points ?? 10,
        user_id: user?.id
      }
      
      const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
      if (insertError) {
        console.error('Error creating repeating task:', insertError)
        alert('Error creating repeating task: ' + insertError.message)
      } else {
        console.log('Repeating task created successfully with due date:', nextDueDate)
      }
    }
    
    await updateTask(task.id, {
      status: isDone ? 'To do' : 'Complete',
      completion_date: isDone ? null : new Date().toISOString().split('T')[0],
      _skipRecurrence: true
    })
  }

  const calculateNextDueDate = (currentDueDate: string, frequency: any): string => {
    const date = new Date(currentDueDate + 'T00:00:00')
    
    try {
      const parsed = typeof frequency === 'string' ? JSON.parse(frequency) : frequency
      if (parsed.interval && parsed.unit) {
        const interval = parsed.interval
        switch (parsed.unit) {
          case 'days':
            date.setDate(date.getDate() + interval)
            break
          case 'weeks':
            date.setDate(date.getDate() + (interval * 7))
            break
          case 'months':
            date.setMonth(date.getMonth() + interval)
            break
          case 'years':
            date.setFullYear(date.getFullYear() + interval)
            break
        }
        return date.toISOString().split('T')[0]
      }
    } catch {
      // Not JSON, treat as simple string
    }
    
    // Handle simple frequency strings
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1)
        break
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    
    return date.toISOString().split('T')[0]
  }

  // Calculate today's points from completed tasks and subtasks
  const getTodayPoints = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    
    let totalPoints = 0
    
    // Add points from completed tasks (only if task itself is completed today and has no subtasks)
    tasks
      .filter(task => task.status === 'Complete' && task.completion_date === todayStr)
      .forEach(task => {
        // Only count task points if it has no subtasks
        const hasSubTasks = task.sub_tasks && task.sub_tasks.length > 0
        if (!hasSubTasks) {
          totalPoints += (task.points ?? 10)
        }
      })
    
    // Add points from completed subtasks
    tasks.forEach(task => {
      // Dropped tasks should not contribute points to scores
      if (task.status === 'Dropped') return
      if (task.sub_tasks && task.sub_tasks.length > 0) {
        task.sub_tasks
          .filter((st: any) => st.completion_date === todayStr)
          .forEach((st: any) => {
            totalPoints += (st.points ?? 0)
          })
      }
    })
    
    return totalPoints
  }

  // Status order for sorting
  const statusOrder = ['Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped']
  const getStatusIndex = (status: string) => {
    const index = statusOrder.indexOf(status)
    return index === -1 ? 999 : index
  }

  // Filter tasks based on current filter settings
  const getFilteredTasks = () => {
    let filtered = [...tasks]

    // Apply status filter
    if (statusFilters.size > 0 && !statusFilters.has('All')) {
      filtered = filtered.filter(task => {
        // Check if "Ongoing" is selected
        if (statusFilters.has('Ongoing')) {
          if (['To do', 'In progress', 'Waiting'].includes(task.status)) {
            return true
          }
        }
        // Check if specific status is selected
        if (statusFilters.has(task.status)) {
          return true
        }
        return false
      })
    }

    // Apply date filter (multiple selections supported - OR logic)
    if (dateFilters.size > 0 && !dateFilters.has('All')) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      filtered = filtered.filter(task => {
        // Check if task matches any of the selected date filters (OR logic)
        if (dateFilters.has('Today & overdue')) {
          if (task.due_date && task.due_date <= todayStr) return true
        }
        if (dateFilters.has('Next 7 days')) {
          if (task.due_date && task.due_date >= todayStr && task.due_date <= sevenDaysStr) return true
        }
        if (dateFilters.has('Completed last 7 days')) {
          if (task.completion_date && task.completion_date >= sevenDaysAgoStr && task.completion_date <= todayStr) return true
        }
        if (dateFilters.has('No due date')) {
          if (!task.due_date) return true
        }
        return false
      })
    }

    // Apply category filter (multiple selections supported - OR logic)
    if (categoryFilters.size > 0 && !categoryFilters.has('All')) {
      filtered = filtered.filter(task => {
        // Check if task matches any of the selected category filters (OR logic)
        if (categoryFilters.has('None')) {
          if (!task.category_id) return true
        }
        if (task.category_id && categoryFilters.has(task.category_id)) {
          return true
        }
        return false
      })
    }

    // Apply attribute filter (multiple selections supported - OR logic)
    if (attributeFilters.size > 0 && !attributeFilters.has('All')) {
      filtered = filtered.filter(task => {
        // Check if task matches any of the selected attribute filters (OR logic)
        if (attributeFilters.has('Hard deadline')) {
          if (task.is_hard_deadline === true || task.is_hard_deadline === 'true' || task.is_hard_deadline === 1) return true
        }
        if (attributeFilters.has('Recurring')) {
          if (task.is_recurring === true || task.is_recurring === 'true' || task.is_recurring === 1) return true
        }
        if (attributeFilters.has('Repeating')) {
          if (task.is_repeating === true || task.is_repeating === 'true' || task.is_repeating === 1) return true
        }
        if (attributeFilters.has('None')) {
          const hasHardDeadline = task.is_hard_deadline === true || task.is_hard_deadline === 'true' || task.is_hard_deadline === 1
          const hasRecurring = task.is_recurring === true || task.is_recurring === 'true' || task.is_recurring === 1
          const hasRepeating = task.is_repeating === true || task.is_repeating === 'true' || task.is_repeating === 1
          if (!hasHardDeadline && !hasRecurring && !hasRepeating) return true
        }
        return false
      })
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(task => {
        const titleMatch = task.title?.toLowerCase().includes(searchLower) || false
        const descriptionMatch = task.description?.toLowerCase().includes(searchLower) || false
        return titleMatch || descriptionMatch
      })
    }

    return filtered
  }

  // Get task count for a specific status filter option
  const getStatusCount = (statusOption: string, baseTasks: any[]) => {
    let count = 0
    if (statusOption === 'All') {
      count = baseTasks.length
    } else if (statusOption === 'Ongoing') {
      count = baseTasks.filter(t => ['To do', 'In progress', 'Waiting'].includes(t.status)).length
    } else {
      count = baseTasks.filter(t => t.status === statusOption).length
    }
    return count
  }

  // Get task count for a specific date filter option
  const getDateCount = (dateOption: string, baseTasks: any[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    if (dateOption === 'All') {
      return baseTasks.length
    } else if (dateOption === 'Today & overdue') {
      return baseTasks.filter(t => t.due_date && t.due_date <= todayStr).length
    } else if (dateOption === 'Next 7 days') {
      return baseTasks.filter(t => t.due_date && t.due_date >= todayStr && t.due_date <= sevenDaysStr).length
    } else if (dateOption === 'Completed last 7 days') {
      return baseTasks.filter(t => t.completion_date && t.completion_date >= sevenDaysAgoStr && t.completion_date <= todayStr).length
    } else if (dateOption === 'No due date') {
      return baseTasks.filter(t => !t.due_date).length
    }
    return 0
  }

  // Get task count for a specific category filter option
  const getCategoryCount = (categoryId: string, baseTasks: any[]) => {
    if (categoryId === 'All') {
      return baseTasks.length
    } else if (categoryId === 'None') {
      return baseTasks.filter(t => !t.category_id).length
    }
    return baseTasks.filter(t => t.category_id === categoryId).length
  }

  // Get task count for a specific attribute filter option
  const getAttributeCount = (attributeOption: string, baseTasks: any[]) => {
    if (attributeOption === 'All') {
      return baseTasks.length
    } else if (attributeOption === 'Hard deadline') {
      return baseTasks.filter(t => t.is_hard_deadline === true || t.is_hard_deadline === 'true' || t.is_hard_deadline === 1).length
    } else if (attributeOption === 'Recurring') {
      return baseTasks.filter(t => t.is_recurring === true || t.is_recurring === 'true' || t.is_recurring === 1).length
    } else if (attributeOption === 'Repeating') {
      return baseTasks.filter(t => t.is_repeating === true || t.is_repeating === 'true' || t.is_repeating === 1).length
    } else if (attributeOption === 'None') {
      return baseTasks.filter(t => {
        const hasHardDeadline = t.is_hard_deadline === true || t.is_hard_deadline === 'true' || t.is_hard_deadline === 1
        const hasRecurring = t.is_recurring === true || t.is_recurring === 'true' || t.is_recurring === 1
        const hasRepeating = t.is_repeating === true || t.is_repeating === 'true' || t.is_repeating === 1
        return !hasHardDeadline && !hasRecurring && !hasRepeating
      }).length
    }
    return 0
  }

  // Calculate completed points for a task
  const getCompletedPoints = (task: any): number => {
    if (task.sub_tasks && task.sub_tasks.length > 0) {
      // Sum points from completed subtasks
      return task.sub_tasks
        .filter((st: any) => st.completion_date !== null)
        .reduce((sum: number, st: any) => sum + (st.points ?? 0), 0)
    } else {
      // If no subtasks, task is either fully completed (points) or not (0)
      return task.status === 'Complete' ? (task.points ?? 10) : 0
    }
  }

  // Get total points for a task
  const getTotalPoints = (task: any): number => {
    return task.points ?? 10
  }

  // Calculate completed subtasks count
  const getCompletedSubtasksCount = (task: any): number => {
    if (!task.sub_tasks || task.sub_tasks.length === 0) return 0
    return task.sub_tasks.filter((st: any) => st.completion_date !== null).length
  }

  // Get base tasks for counting (apply other filters but not the one being counted)
  const getBaseTasksForStatusCount = (statusOption: string) => {
    let base = [...tasks]

    // Apply date filter (multiple selections supported - OR logic)
    if (dateFilters.size > 0 && !dateFilters.has('All')) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      base = base.filter(task => {
        // Check if task matches any of the selected date filters (OR logic)
        if (dateFilters.has('Today & overdue')) {
          if (task.due_date && task.due_date <= todayStr) return true
        }
        if (dateFilters.has('Next 7 days')) {
          if (task.due_date && task.due_date >= todayStr && task.due_date <= sevenDaysStr) return true
        }
        if (dateFilters.has('Completed last 7 days')) {
          if (task.completion_date && task.completion_date >= sevenDaysAgoStr && task.completion_date <= todayStr) return true
        }
        if (dateFilters.has('No due date')) {
          if (!task.due_date) return true
        }
        return false
      })
    }

    // Apply category filter (multiple selections supported - OR logic)
    if (categoryFilters.size > 0 && !categoryFilters.has('All')) {
      base = base.filter(task => {
        // Check if task matches any of the selected category filters (OR logic)
        if (categoryFilters.has('None')) {
          if (!task.category_id) return true
        }
        if (task.category_id && categoryFilters.has(task.category_id)) {
          return true
        }
        return false
      })
    }

    return base
  }

  const getBaseTasksForDateCount = (dateOption: string) => {
    let base = [...tasks]

    // Apply status filter
    if (statusFilters.size > 0 && !statusFilters.has('All')) {
      base = base.filter(task => {
        if (statusFilters.has('Ongoing')) {
          if (['To do', 'In progress', 'Waiting'].includes(task.status)) {
            return true
          }
        }
        if (statusFilters.has(task.status)) {
          return true
        }
        return false
      })
    }

    // Apply category filter (multiple selections supported - OR logic)
    if (categoryFilters.size > 0 && !categoryFilters.has('All')) {
      base = base.filter(task => {
        // Check if task matches any of the selected category filters (OR logic)
        if (categoryFilters.has('None')) {
          if (!task.category_id) return true
        }
        if (task.category_id && categoryFilters.has(task.category_id)) {
          return true
        }
        return false
      })
    }

    return base
  }

  const getBaseTasksForCategoryCount = (categoryId: string) => {
    let base = [...tasks]

    // Apply status filter
    if (statusFilters.size > 0 && !statusFilters.has('All')) {
      base = base.filter(task => {
        if (statusFilters.has('Ongoing')) {
          if (['To do', 'In progress', 'Waiting'].includes(task.status)) {
            return true
          }
        }
        if (statusFilters.has(task.status)) {
          return true
        }
        return false
      })
    }

    // Apply date filter (multiple selections supported - OR logic)
    if (dateFilters.size > 0 && !dateFilters.has('All')) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      base = base.filter(task => {
        // Check if task matches any of the selected date filters (OR logic)
        if (dateFilters.has('Today & overdue')) {
          if (task.due_date && task.due_date <= todayStr) return true
        }
        if (dateFilters.has('Next 7 days')) {
          if (task.due_date && task.due_date >= todayStr && task.due_date <= sevenDaysStr) return true
        }
        if (dateFilters.has('Completed last 7 days')) {
          if (task.completion_date && task.completion_date >= sevenDaysAgoStr && task.completion_date <= todayStr) return true
        }
        if (dateFilters.has('No due date')) {
          if (!task.due_date) return true
        }
        return false
      })
    }

    return base
  }

  const getBaseTasksForAttributeCount = (attributeOption: string) => {
    let base = [...tasks]

    // Apply status filter
    if (statusFilters.size > 0 && !statusFilters.has('All')) {
      base = base.filter(task => {
        if (statusFilters.has('Ongoing')) {
          if (['To do', 'In progress', 'Waiting'].includes(task.status)) {
            return true
          }
        }
        if (statusFilters.has(task.status)) {
          return true
        }
        return false
      })
    }

    // Apply date filter (multiple selections supported - OR logic)
    if (dateFilters.size > 0 && !dateFilters.has('All')) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      base = base.filter(task => {
        // Check if task matches any of the selected date filters (OR logic)
        if (dateFilters.has('Today & overdue')) {
          if (task.due_date && task.due_date <= todayStr) return true
        }
        if (dateFilters.has('Next 7 days')) {
          if (task.due_date && task.due_date >= todayStr && task.due_date <= sevenDaysStr) return true
        }
        if (dateFilters.has('Completed last 7 days')) {
          if (task.completion_date && task.completion_date >= sevenDaysAgoStr && task.completion_date <= todayStr) return true
        }
        if (dateFilters.has('No due date')) {
          if (!task.due_date) return true
        }
        return false
      })
    }

    // Apply category filter (multiple selections supported - OR logic)
    if (categoryFilters.size > 0 && !categoryFilters.has('All')) {
      base = base.filter(task => {
        // Check if task matches any of the selected category filters (OR logic)
        if (categoryFilters.has('None')) {
          if (!task.category_id) return true
        }
        if (task.category_id && categoryFilters.has(task.category_id)) {
          return true
        }
        return false
      })
    }

    return base
  }

  // Sort tasks based on current sort settings
  const getSortedTasks = () => {
    const filtered = getFilteredTasks()
    const sorted = [...filtered]
    
    sorted.sort((a, b) => {
      if (sortBy === 'due_date') {
        // Handle null/undefined due dates - put them at the end
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        
        const dateA = new Date(a.due_date).getTime()
        const dateB = new Date(b.due_date).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      } else if (sortBy === 'completion_date') {
        // Handle null/undefined completion dates - put them at the end
        if (!a.completion_date && !b.completion_date) return 0
        if (!a.completion_date) return 1
        if (!b.completion_date) return -1
        
        const dateA = new Date(a.completion_date).getTime()
        const dateB = new Date(b.completion_date).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      } else if (sortBy === 'status') {
        // Sort by status
        const indexA = getStatusIndex(a.status)
        const indexB = getStatusIndex(b.status)
        return sortOrder === 'asc' ? indexA - indexB : indexB - indexA
      } else if (sortBy === 'category') {
        // Sort by category name
        const categoryA = a.categories?.name || ''
        const categoryB = b.categories?.name || ''
        
        // Tasks without categories go at the end (or beginning for desc)
        if (!categoryA && !categoryB) return 0
        if (!categoryA) return sortOrder === 'asc' ? 1 : -1
        if (!categoryB) return sortOrder === 'asc' ? -1 : 1
        
        const comparison = categoryA.localeCompare(categoryB)
        return sortOrder === 'asc' ? comparison : -comparison
      } else if (sortBy === 'title') {
        // Sort by title alphabetically
        const titleA = (a.title || '').toLowerCase()
        const titleB = (b.title || '').toLowerCase()
        
        const comparison = titleA.localeCompare(titleB)
        return sortOrder === 'asc' ? comparison : -comparison
      }
      return 0
    })
    
    return sorted
  }

  // Distribute tasks across 3 columns (top-left to bottom-right)
  const distributeTasks = (sortedTasks: any[]) => {
    const columns: any[][] = [[], [], []]
    sortedTasks.forEach((task, index) => {
      columns[index % 3].push(task)
    })
    return columns
  }

  const sortedTasks = getSortedTasks()
  const columns = distributeTasks(sortedTasks)

  // Status filter handlers
  const toggleStatusFilter = (status: string) => {
    const newFilters = new Set(statusFilters)
    if (status === 'All') {
      if (newFilters.has('All')) {
        // If All is already selected, do nothing
        return
      } else {
        // Select All and unselect everything else
        setStatusFilters(new Set(['All']))
      }
    } else {
      // Remove All if it's selected
      newFilters.delete('All')
      if (newFilters.has(status)) {
        newFilters.delete(status)
      } else {
        newFilters.add(status)
      }
      // If no status filters selected, select All
      if (newFilters.size === 0) {
        setStatusFilters(new Set(['All']))
      } else {
        setStatusFilters(newFilters)
      }
    }
  }

  // Date filter handlers
  const toggleDateFilter = (dateOption: string) => {
    const newFilters = new Set(dateFilters)
    if (dateOption === 'All') {
      if (newFilters.has('All')) {
        // If All is already selected, do nothing
        return
      } else {
        // Select All and unselect everything else
        setDateFilters(new Set(['All']))
      }
    } else {
      // Remove All if it's selected
      newFilters.delete('All')
      if (newFilters.has(dateOption)) {
        newFilters.delete(dateOption)
      } else {
        newFilters.add(dateOption)
      }
      // If no date filters selected, select All
      if (newFilters.size === 0) {
        setDateFilters(new Set(['All']))
      } else {
        setDateFilters(newFilters)
      }
    }
  }

  // Category filter handlers
  const toggleCategoryFilter = (categoryId: string) => {
    const newFilters = new Set(categoryFilters)
    if (categoryId === 'All') {
      if (newFilters.has('All')) {
        // If All is already selected, do nothing
        return
      } else {
        // Select All and unselect everything else
        setCategoryFilters(new Set(['All']))
      }
    } else {
      // Remove All if it's selected
      newFilters.delete('All')
      if (newFilters.has(categoryId)) {
        newFilters.delete(categoryId)
      } else {
        newFilters.add(categoryId)
      }
      // If no categories selected, select All
      if (newFilters.size === 0) {
        setCategoryFilters(new Set(['All']))
      } else {
        setCategoryFilters(newFilters)
      }
    }
  }

  // Attribute filter handlers
  const toggleAttributeFilter = (attributeOption: string) => {
    const newFilters = new Set(attributeFilters)
    if (attributeOption === 'All') {
      if (newFilters.has('All')) {
        // If All is already selected, do nothing
        return
      } else {
        // Select All and unselect everything else
        setAttributeFilters(new Set(['All']))
      }
    } else {
      // Remove All if it's selected
      newFilters.delete('All')
      if (newFilters.has(attributeOption)) {
        newFilters.delete(attributeOption)
      } else {
        newFilters.add(attributeOption)
      }
      // If no attribute filters selected, select All
      if (newFilters.size === 0) {
        setAttributeFilters(new Set(['All']))
      } else {
        setAttributeFilters(newFilters)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {!selectedTask && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-2xl font-bold dark:text-white" style={{ color: '#11551a' }}>My Tasks</h2>
              <div className="text-base text-gray-600 mt-1">
                Today's Points: <span className="font-semibold" style={{ color: '#11551a' }}>{getTodayPoints()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
              >
                Categories
              </button>
              <button
                onClick={handleAddTask}
                className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
              >
                Add Task
              </button>
            </div>
          </div>
          
          {/* Mobile Filter Tabs - Only visible on mobile */}
          <div className="md:hidden">
            {/* Tab Headers */}
            <div className="flex gap-1 mb-3 border-b">
              {(['Status', 'Date', 'Category', 'Attribute', 'Sort'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileFilterTab(tab)}
                  className={`flex-1 px-2 py-2 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 ${
                    mobileFilterTab === tab
                      ? 'border-green-700 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  style={mobileFilterTab === tab ? { borderBottomColor: '#11551a', color: '#11551a' } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mb-3 min-h-[100px]">
              {mobileFilterTab === 'Status' && (
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Ongoing', 'Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped'].map(status => {
                    const baseTasks = getBaseTasksForStatusCount(status)
                    const count = getStatusCount(status, baseTasks)
                    const isSelected = statusFilters.has(status)
                    return (
                      <button
                        key={status}
                        onClick={() => toggleStatusFilter(status)}
                        className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-md border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                            : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                        }`}
                        style={isSelected ? { backgroundColor: '#11551a' } : {}}
                      >
                        {status} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {mobileFilterTab === 'Date' && (
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Today & overdue', 'Next 7 days', 'Completed last 7 days', 'No due date'].map(dateOption => {
                    const baseTasks = getBaseTasksForDateCount(dateOption)
                    const count = getDateCount(dateOption, baseTasks)
                    const isSelected = dateFilters.has(dateOption)
                    return (
                      <button
                        key={dateOption}
                        onClick={() => toggleDateFilter(dateOption)}
                        className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-md border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                            : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                        }`}
                        style={isSelected ? { backgroundColor: '#11551a' } : {}}
                      >
                        {dateOption} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {mobileFilterTab === 'Category' && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => toggleCategoryFilter('All')}
                    className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      categoryFilters.has('All')
                        ? 'text-white shadow-md border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                        : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                    }`}
                    style={categoryFilters.has('All') ? { backgroundColor: '#11551a' } : {}}
                  >
                    All ({getCategoryCount('All', getBaseTasksForCategoryCount('All'))})
                  </button>
                  {categories.map(category => {
                    const baseTasks = getBaseTasksForCategoryCount(category.id)
                    const count = getCategoryCount(category.id, baseTasks)
                    const isSelected = categoryFilters.has(category.id)
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategoryFilter(category.id)}
                        className={`px-2.5 py-1 rounded-lg text-sm font-medium text-white transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                            : 'border-2 border-transparent'
                        }`}
                        style={{ 
                          backgroundColor: category.color
                        }}
                      >
                        {category.name} ({count})
                      </button>
                    )
                  })}
                  <button
                    onClick={() => toggleCategoryFilter('None')}
                    className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      categoryFilters.has('None')
                        ? 'text-white shadow-md border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                        : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                    }`}
                    style={categoryFilters.has('None') ? { backgroundColor: '#6b7280' } : {}}
                  >
                    None ({getCategoryCount('None', getBaseTasksForCategoryCount('None'))})
                  </button>
                </div>
              )}

              {mobileFilterTab === 'Attribute' && (
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Hard deadline', 'Recurring', 'Repeating', 'None'].map(attributeOption => {
                    const baseTasks = getBaseTasksForAttributeCount(attributeOption)
                    const count = getAttributeCount(attributeOption, baseTasks)
                    const isSelected = attributeFilters.has(attributeOption)
                    return (
                      <button
                        key={attributeOption}
                        onClick={() => toggleAttributeFilter(attributeOption)}
                        className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-md border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                            : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                        }`}
                        style={isSelected ? { backgroundColor: '#11551a' } : {}}
                      >
                        {attributeOption} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {mobileFilterTab === 'Sort' && (
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'due_date' | 'completion_date' | 'status' | 'category' | 'title')}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      style={{ focusRingColor: '#11551a' } as any}
                    >
                      <option value="due_date">Due Date</option>
                      <option value="completion_date">Completion Date</option>
                      <option value="status">Status</option>
                      <option value="category">Category</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center bg-white dark:bg-gray-700"
                      title={sortOrder === 'asc' ? 'Ascending - Click to sort descending' : 'Descending - Click to sort ascending'}
                    >
                      {sortOrder === 'asc' ? (
                        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-3 items-center">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Search:</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search tasks..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Filters - Hidden on mobile */}
          <div className="hidden md:block space-y-3 mt-3">
            {/* Status Filter */}
            <div>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Ongoing', 'Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped'].map(status => {
                  const baseTasks = getBaseTasksForStatusCount(status)
                  const count = getStatusCount(status, baseTasks)
                  const isSelected = statusFilters.has(status)
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md border-2 border-gray-900 dark:border-gray-300'
                          : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                      }`}
                      style={isSelected ? { backgroundColor: '#11551a' } : {}}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#e0e0e0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#e5e7eb'
                        }
                      }}
                    >
                      {status} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Today & overdue', 'Next 7 days', 'Completed last 7 days', 'No due date'].map(dateOption => {
                  const baseTasks = getBaseTasksForDateCount(dateOption)
                  const count = getDateCount(dateOption, baseTasks)
                  const isSelected = dateFilters.has(dateOption)
                  return (
                    <button
                      key={dateOption}
                      onClick={() => toggleDateFilter(dateOption)}
                      className={`px-2.5 py-1 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md border-2 border-gray-900 dark:border-gray-300'
                          : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                      }`}
                      style={isSelected ? { backgroundColor: '#11551a' } : {}}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#e0e0e0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#e5e7eb'
                        }
                      }}
                    >
                      {dateOption} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => toggleCategoryFilter('All')}
                  className={`px-2.5 py-1 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                    categoryFilters.has('All')
                      ? 'text-white shadow-md border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                      : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                  }`}
                  style={categoryFilters.has('All') ? { backgroundColor: '#11551a' } : {}}
                  onMouseEnter={(e) => {
                    if (!categoryFilters.has('All')) {
                      e.currentTarget.style.backgroundColor = '#e0e0e0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!categoryFilters.has('All')) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb'
                    }
                  }}
                >
                  All ({getCategoryCount('All', getBaseTasksForCategoryCount('All'))})
                </button>
                {categories.map(category => {
                  const baseTasks = getBaseTasksForCategoryCount(category.id)
                  const count = getCategoryCount(category.id, baseTasks)
                  const isSelected = categoryFilters.has(category.id)
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategoryFilter(category.id)}
                      className={`px-2.5 py-1 rounded-lg text-lg font-medium text-white transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? 'border-2 border-gray-900 dark:border-gray-300'
                          : 'border-2 border-transparent'
                      }`}
                      style={{ 
                        backgroundColor: category.color
                      }}
                    >
                      {category.name} ({count})
                    </button>
                  )
                })}
                <button
                  onClick={() => toggleCategoryFilter('None')}
                  className={`px-2.5 py-1 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                    categoryFilters.has('None')
                      ? 'text-white shadow-md border-2 border-black dark:border-white shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_black]'
                      : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                  }`}
                  style={categoryFilters.has('None') ? { backgroundColor: '#6b7280' } : {}}
                  onMouseEnter={(e) => {
                    if (!categoryFilters.has('None')) {
                      e.currentTarget.style.backgroundColor = '#e0e0e0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!categoryFilters.has('None')) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb'
                    }
                  }}
                >
                  None ({getCategoryCount('None', getBaseTasksForCategoryCount('None'))})
                </button>
              </div>
            </div>

            {/* Attribute Filter */}
            <div>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Hard deadline', 'Recurring', 'Repeating', 'None'].map(attributeOption => {
                  const baseTasks = getBaseTasksForAttributeCount(attributeOption)
                  const count = getAttributeCount(attributeOption, baseTasks)
                  const isSelected = attributeFilters.has(attributeOption)
                  return (
                    <button
                      key={attributeOption}
                      onClick={() => toggleAttributeFilter(attributeOption)}
                      className={`px-2.5 py-1 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md border-2 border-gray-900 dark:border-gray-300'
                          : 'bg-gray-200 text-gray-700 border-2 border-transparent'
                      }`}
                      style={isSelected ? { backgroundColor: '#11551a' } : {}}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#e0e0e0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#e5e7eb'
                        }
                      }}
                    >
                      {attributeOption} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="hidden md:flex gap-3 items-center mt-3">
            <label className="text-lg font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due_date' | 'completion_date' | 'status' | 'category' | 'title')}
              className="px-2 py-1 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="due_date">Due Date</option>
              <option value="completion_date">Completion Date</option>
              <option value="status">Status</option>
              <option value="category">Category</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center bg-white dark:bg-gray-700"
              title={sortOrder === 'asc' ? 'Ascending - Click to sort descending' : 'Descending - Click to sort ascending'}
            >
              {sortOrder === 'asc' ? (
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            <label className="text-lg font-medium text-gray-700 ml-2">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="px-3 py-1 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Three Column Layout (Desktop) / Single Column (Mobile) */}
      {!selectedTask ? (
        <div>
          {/* Desktop: Three columns */}
          <div className="hidden md:grid md:grid-cols-3 gap-3">
            {columns.map((columnTasks, colIndex) => (
              <div key={colIndex} className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] p-3 cursor-pointer group"
                    style={{ minHeight: '120px', maxHeight: '120px' }}
                  >
                    <div className="flex items-start gap-2 h-full">
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {/* Completion Checkbox */}
                        <input
                          type="checkbox"
                          checked={task.status === 'Complete' || task.status === 'Dropped'}
                          onChange={(e) => toggleComplete(task, e as any)}
                          className="w-5 h-5 mt-0.5 cursor-pointer accent-green-600"
                          title={(task.status === 'Complete' || task.status === 'Dropped') ? 'Mark as incomplete' : 'Mark as complete'}
                          style={{ accentColor: '#11551a' }}
                        />
                        {/* Today Circle Button */}
                        <button
                          onClick={(e) => toggleTaskInToday(task.id, e)}
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                            todayItems.get(task.id)
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-400 hover:border-green-600'
                          }`}
                          title={todayItems.get(task.id) ? 'Remove from today' : 'Add to today'}
                          style={todayItems.get(task.id) ? { backgroundColor: '#11551a', borderColor: '#11551a' } : {}}
                        />
                      </div>
                      
                      {/* Task Info */}
                      <div 
                        className="flex-1 flex flex-col overflow-hidden"
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className={`font-semibold text-base transition-colors ${
                                  (task.status === 'Complete' || task.status === 'Dropped') ? 'line-through text-gray-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-400'
                              }`}>
                                {task.title}
                              </h4>
                              {(task.is_recurring === true || task.is_recurring === 'true') && (
                                <span className="text-base" title="Recurring task">🔁</span>
                              )}
                              {(task.is_repeating === true || task.is_repeating === 'true') && (
                                <span className="text-base" title="Repeating task">⏭️</span>
                              )}
                              {task.sub_tasks && task.sub_tasks.length > 0 && (
                                <span className="text-base" title={`${task.sub_tasks.length} subtask${task.sub_tasks.length > 1 ? 's' : ''}`}>📋</span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                              <span>{task.status}</span>
                              <span className="text-gray-400">•</span>
                              <span>Points: {getCompletedPoints(task)}/{getTotalPoints(task)}</span>
                              {task.sub_tasks && task.sub_tasks.length > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span>Subtasks: {getCompletedSubtasksCount(task)}/{task.sub_tasks.length}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {task.categories && (
                            <span
                              className="inline-block px-2 py-0.5 rounded-md text-sm text-white font-medium flex-shrink-0"
                              style={{ backgroundColor: task.categories.color }}
                            >
                              {task.categories.name}
                            </span>
                          )}
                        </div>
                        <div className="mt-auto pt-1.5">
                          {(task.due_date || task.completion_date) && (
                            <p className="text-sm">
                              {task.due_date && (
                                <span className={task.is_hard_deadline ? 'font-bold text-red-600' : 'text-gray-600'}>
                                  Due: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                                  {task.is_hard_deadline && <span className="ml-1" style={{ fontSize: '16px' }}>❗</span>}
                                </span>
                              )}
                              {task.due_date && task.completion_date && <span className="mx-2 text-gray-400">|</span>}
                              {task.completion_date && (
                                <span style={{ color: '#11551a' }}>
                                  ✓ {new Date(task.completion_date + 'T00:00:00').toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile: Single column */}
          <div className="md:hidden space-y-3">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md active:shadow-xl transition-all duration-200 active:scale-[0.98] p-3 group"
                style={{ minHeight: '120px' }}
              >
                <div className="flex items-start gap-2 h-full">
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {/* Completion Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.status === 'Complete' || task.status === 'Dropped'}
                      onChange={(e) => toggleComplete(task, e as any)}
                      className="w-6 h-6 mt-0.5 cursor-pointer"
                      title={(task.status === 'Complete' || task.status === 'Dropped') ? 'Mark as incomplete' : 'Mark as complete'}
                      style={{ accentColor: '#11551a' }}
                    />
                    {/* Today Circle Button */}
                    <button
                      onClick={(e) => toggleTaskInToday(task.id, e)}
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${
                        todayItems.get(task.id)
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-400 hover:border-green-600'
                      }`}
                      title={todayItems.get(task.id) ? 'Remove from today' : 'Add to today'}
                      style={todayItems.get(task.id) ? { backgroundColor: '#11551a', borderColor: '#11551a' } : {}}
                    />
                  </div>
                  
                  {/* Task Info */}
                  <div 
                    className="flex-1 flex flex-col overflow-hidden"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`font-semibold text-lg ${
                            (task.status === 'Complete' || task.status === 'Dropped') ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {task.title}
                          </h4>
                          {(task.is_recurring === true || task.is_recurring === 'true') && (
                            <span className="text-lg" title="Recurring task">🔁</span>
                          )}
                          {(task.is_repeating === true || task.is_repeating === 'true') && (
                            <span className="text-lg" title="Repeating task">⏭️</span>
                          )}
                        </div>
                        <div className="mt-1 text-base text-gray-500 flex items-center gap-2">
                          <span>{task.status}</span>
                          <span className="text-gray-400">•</span>
                          <span>Points: {getCompletedPoints(task)}/{getTotalPoints(task)}</span>
                          {task.sub_tasks && task.sub_tasks.length > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>Subtasks: {getCompletedSubtasksCount(task)}/{task.sub_tasks.length}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {task.categories && (
                        <span
                          className="inline-block px-2.5 py-1 rounded-md text-sm text-white font-medium flex-shrink-0"
                          style={{ backgroundColor: task.categories.color }}
                        >
                          {task.categories.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto pt-2">
                      {(task.due_date || task.completion_date) && (
                        <p className="text-base">
                          {task.due_date && (
                            <span className={task.is_hard_deadline ? 'font-bold text-red-600' : 'text-gray-600'}>
                              Due: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                              {task.is_hard_deadline && <span className="ml-1" style={{ fontSize: '18px' }}>❗</span>}
                            </span>
                          )}
                          {task.due_date && task.completion_date && <span className="mx-2 text-gray-400">|</span>}
                          {task.completion_date && (
                            <span style={{ color: '#11551a' }}>
                              ✓ {new Date(task.completion_date + 'T00:00:00').toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <TaskDetailView
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onShowCategories={() => setShowCategoryManager(true)}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => {
            setShowCategoryManager(false)
            loadCategories() // Refresh categories when closing
          }}
        />
      )}
    </div>
  )
}

function TaskDetailView({ task, categories, onClose, onUpdate, onDelete, onShowCategories }: any) {
  const [editedTask, setEditedTask] = useState(task)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showRepeatingModal, setShowRepeatingModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [subTasks, setSubTasks] = useState<any[]>([])
  const supabase = createClient()

  const loadSubTasks = useCallback(async () => {
    if (!task?.id) return
    const { data } = await supabase
      .from('sub_tasks')
      .select('*')
      .eq('task_id', task.id)
      .order('sort_order', { ascending: true })
    if (data) setSubTasks(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id])

  // Update editedTask when task prop changes
  useEffect(() => {
    setEditedTask(task)
    if (task?.id) {
      loadSubTasks()
    } else {
      setSubTasks([])
    }
  }, [task, loadSubTasks])

  // Distribute points evenly across subtasks
  const distributePoints = (totalPoints: number, numSubTasks: number): number[] => {
    if (numSubTasks === 0) return []
    const basePoints = Math.floor(totalPoints / numSubTasks)
    const remainder = totalPoints % numSubTasks
    const points: number[] = []
    for (let i = 0; i < numSubTasks; i++) {
      points.push(basePoints + (i < remainder ? 1 : 0))
    }
    return points
  }

  // Calculate point balance
  const getPointBalance = () => {
    const totalPoints = editedTask.points ?? 10
    const subTaskPoints = subTasks.reduce((sum, st) => sum + (st.points ?? 0), 0)
    return totalPoints - subTaskPoints
  }

  const handleSave = async () => {
    const savedTask = await onUpdate(task.id, editedTask)
    if (savedTask) {
      // If this was a new task, we need to save subtasks
      if (task.id === null && subTasks.length > 0) {
        const newTaskId = savedTask.id
        
        // Save all subtasks with their current points (may have been manually adjusted)
        for (let i = 0; i < subTasks.length; i++) {
          await supabase
            .from('sub_tasks')
            .insert({
              task_id: newTaskId,
              title: subTasks[i].title || '',
              due_date: subTasks[i].due_date || null,
              completion_date: subTasks[i].completion_date || null,
              points: subTasks[i].points || 0,
              sort_order: subTasks[i].sort_order !== undefined ? subTasks[i].sort_order : i
            })
        }
      }
      onClose() // Close the detail view after successful save
    }
  }

  const handleDelete = () => {
    if (task.id) {
      onDelete(task.id)
      onClose()
    }
  }

  // Calculate next due date based on frequency (same logic as in TasksView)
  const calculateNextDueDate = (currentDueDate: string, frequency: any): string => {
    const date = new Date(currentDueDate + 'T00:00:00')
    
    try {
      const parsed = typeof frequency === 'string' ? JSON.parse(frequency) : frequency
      if (parsed.interval && parsed.unit) {
        const interval = parsed.interval
        switch (parsed.unit) {
          case 'days':
            date.setDate(date.getDate() + interval)
            break
          case 'weeks':
            date.setDate(date.getDate() + (interval * 7))
            break
          case 'months':
            date.setMonth(date.getMonth() + interval)
            break
          case 'years':
            date.setFullYear(date.getFullYear() + interval)
            break
        }
        return date.toISOString().split('T')[0]
      }
    } catch {
      // Not JSON, treat as simple string
    }
    
    // Handle simple frequency strings
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1)
        break
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    
    return date.toISOString().split('T')[0]
  }

  const handleComplete = async () => {
    if (!task.id) return
    
    const today = new Date().toISOString().split('T')[0]
    
    // If completing a recurring task, create a duplicate with next due date
    const isRecurring = task.is_recurring === true || task.is_recurring === 'true' || task.is_recurring === 1 || editedTask.is_recurring === true || editedTask.is_recurring === 'true' || editedTask.is_recurring === 1
    const recurringFrequency = task.recurring_frequency || editedTask.recurring_frequency
    const taskDueDate = task.due_date || editedTask.due_date
    
    if (isRecurring && recurringFrequency && taskDueDate) {
      const nextDueDate = calculateNextDueDate(taskDueDate, recurringFrequency)
      
      // Create duplicate task
      const { data: { user } } = await supabase.auth.getUser()
      const duplicateTask = {
        title: task.title || editedTask.title,
        status: 'To do',
        category_id: task.category_id || editedTask.category_id,
        description: task.description || editedTask.description,
        due_date: nextDueDate,
        is_hard_deadline: task.is_hard_deadline || editedTask.is_hard_deadline || false,
        is_recurring: task.is_recurring || editedTask.is_recurring || false,
        recurring_frequency: recurringFrequency,
        is_repeating: task.is_repeating || editedTask.is_repeating || false,
        repeating_frequency: task.repeating_frequency || editedTask.repeating_frequency || null,
        points: task.points || editedTask.points || 10,
        user_id: user?.id
      }
      
      const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
      if (insertError) {
        console.error('Error creating recurring task:', insertError)
        alert('Error creating recurring task: ' + insertError.message)
      } else {
        console.log('Recurring task created successfully with due date:', nextDueDate)
      }
    }
    
    // If completing a repeating task, create a duplicate with next due date after completion
    const isRepeating = task.is_repeating === true || task.is_repeating === 'true' || task.is_repeating === 1 || editedTask.is_repeating === true || editedTask.is_repeating === 'true' || editedTask.is_repeating === 1
    const repeatingFrequency = task.repeating_frequency || editedTask.repeating_frequency
    
    if (isRepeating && repeatingFrequency) {
      // Calculate next due date from today (completion date) instead of original due date
      const nextDueDate = calculateNextDueDate(today, repeatingFrequency)
      
      // Create duplicate task
      const { data: { user } } = await supabase.auth.getUser()
      const duplicateTask = {
        title: task.title || editedTask.title,
        status: 'To do',
        category_id: task.category_id || editedTask.category_id,
        description: task.description || editedTask.description,
        due_date: nextDueDate,
        is_hard_deadline: task.is_hard_deadline || editedTask.is_hard_deadline || false,
        is_recurring: task.is_recurring || editedTask.is_recurring || false,
        recurring_frequency: task.recurring_frequency || editedTask.recurring_frequency || null,
        is_repeating: true,
        repeating_frequency: repeatingFrequency,
        points: task.points || editedTask.points || 10,
        user_id: user?.id
      }
      
      const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
      if (insertError) {
        console.error('Error creating repeating task:', insertError)
        alert('Error creating repeating task: ' + insertError.message)
      } else {
        console.log('Repeating task created successfully with due date:', nextDueDate)
      }
    }
    
    // Mark task as complete
    const updatedTask = await onUpdate(task.id, {
      status: 'Complete',
      completion_date: today,
      _skipRecurrence: true
    })
    
    // Update editedTask state
    if (updatedTask) {
      setEditedTask({
        ...editedTask,
        status: 'Complete',
        completion_date: today
      })
    }
    
    // Mark all incomplete subtasks as complete
    const updatePromises = subTasks.map(async (st: any) => {
      if (!st.completion_date) {
        // Update in database if it exists
        if (st.id) {
          await supabase
            .from('sub_tasks')
            .update({ completion_date: today })
            .eq('id', st.id)
        }
        // Update local state
        return { ...st, completion_date: today }
      }
      return st
    })
    const updatedSubtasks = await Promise.all(updatePromises)
    setSubTasks(updatedSubtasks)
    
    // Reload subtasks to reflect database changes
    await loadSubTasks()
    setShowCompleteModal(false)
  }

  const statuses = ['Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped']

  const isNewTask = task.id === null
  const isCompletionDateEditable = editedTask.status === 'Complete' || editedTask.status === 'Dropped'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <h2 className="text-2xl font-bold dark:text-white" style={{ color: '#11551a' }}>{isNewTask ? 'New Task' : 'Task Details'}</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onShowCategories}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Categories
          </button>
          {!isNewTask && (
            <>
              <button
                onClick={handleDelete}
                className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
              >
                Complete
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={editedTask.status}
            onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={editedTask.category_id || ''}
            onChange={(e) => setEditedTask({ ...editedTask, category_id: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">No category</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Description / Notes
          </label>
          <textarea
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            placeholder="Add notes about this task..."
            className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Points */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Points
          </label>
          <input
            type="number"
            min="1"
            value={editedTask.points ?? ''}
            onChange={(e) => {
              const value = e.target.value
              setEditedTask({ ...editedTask, points: value === '' ? null : (parseInt(value) || null) })
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-lg text-gray-500 mt-1">
            Points awarded when this task is completed (default: 10)
          </p>
        </div>

        {/* Subtasks */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
              Subtasks
            </label>
            <button
              onClick={async () => {
                const totalPoints = editedTask.points ?? 10
                const newSubTasks = [...subTasks]
                const newSortOrder = newSubTasks.length > 0 
                  ? Math.max(...newSubTasks.map(st => st.sort_order || 0)) + 1 
                  : 0
                
                // Distribute points including the new one
                const distributedPoints = distributePoints(totalPoints, newSubTasks.length + 1)
                
                // For existing tasks, save to database immediately
                if (task.id) {
                  // Create new subtask in database
                  const { data: newSubTask, error } = await supabase
                    .from('sub_tasks')
                    .insert({
                      task_id: task.id,
                      title: '',
                      due_date: editedTask.due_date || null,
                      completion_date: null,
                      points: distributedPoints[newSubTasks.length],
                      sort_order: newSortOrder
                    })
                    .select()
                    .single()
                  
                  if (error) {
                    console.error('Error creating subtask:', error)
                    alert('Error creating subtask: ' + error.message)
                    return
                  }
                  
                  // Update existing subtasks with new point distribution
                  for (let i = 0; i < newSubTasks.length; i++) {
                    if (newSubTasks[i].id && newSubTasks[i].points !== distributedPoints[i]) {
                      await supabase
                        .from('sub_tasks')
                        .update({ points: distributedPoints[i] })
                        .eq('id', newSubTasks[i].id)
                      newSubTasks[i].points = distributedPoints[i]
                    } else if (!newSubTasks[i].id) {
                      newSubTasks[i].points = distributedPoints[i]
                    }
                  }
                  
                  newSubTasks.push(newSubTask)
                  setSubTasks(newSubTasks)
                } else {
                  // For new tasks, just add to local state
                  const newSubTask = {
                    id: null,
                    task_id: null,
                    title: '',
                    due_date: editedTask.due_date || null,
                    completion_date: null,
                    points: distributedPoints[newSubTasks.length],
                    sort_order: newSortOrder
                  }
                  
                  // Update existing subtasks with new point distribution
                  for (let i = 0; i < newSubTasks.length; i++) {
                    newSubTasks[i].points = distributedPoints[i]
                  }
                  
                  newSubTasks.push(newSubTask)
                  setSubTasks(newSubTasks)
                }
              }}
              className="text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: '#11551a' }}
            >
              + Add Subtask
            </button>
          </div>
            
            {subTasks.length > 0 && (
              <>
                <div className="space-y-3 mb-3">
                  {subTasks.map((subTask, index) => (
                    <div key={subTask.id || `new-${index}`} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                      {/* Title with checkbox */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={subTask.title || ''}
                            onChange={async (e) => {
                              const updated = [...subTasks]
                              updated[index].title = e.target.value
                              setSubTasks(updated)
                              
                              // Save if it's an existing subtask
                              if (subTask.id) {
                                await supabase
                                  .from('sub_tasks')
                                  .update({ title: e.target.value })
                                  .eq('id', subTask.id)
                              }
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={subTask.completion_date !== null}
                              onChange={async (e) => {
                                const today = new Date().toISOString().split('T')[0]
                                const updated = [...subTasks]
                                updated[index].completion_date = e.target.checked ? today : null
                                setSubTasks(updated)
                                
                                if (subTask.id) {
                                  await supabase
                                    .from('sub_tasks')
                                    .update({ completion_date: e.target.checked ? today : null })
                                    .eq('id', subTask.id)
                                }
                              }}
                              className="w-5 h-5 cursor-pointer"
                              style={{ accentColor: '#11551a' }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Complete</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Due Date, Completion Date, Points in three columns */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={subTask.due_date || ''}
                            max={editedTask.due_date || undefined}
                            onChange={async (e) => {
                              const value = e.target.value
                              // Validate: cannot be after main task due date
                              if (editedTask.due_date && value > editedTask.due_date) {
                                alert('Subtask due date cannot be after the main task due date')
                                return
                              }
                              
                              const updated = [...subTasks]
                              updated[index].due_date = value || null
                              setSubTasks(updated)
                              
                              if (subTask.id) {
                                const { error } = await supabase
                                  .from('sub_tasks')
                                  .update({ due_date: value || null })
                                  .eq('id', subTask.id)
                                if (error) {
                                  console.error('Error updating subtask:', error)
                                  alert('Error updating subtask: ' + error.message)
                                }
                              }
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Completion Date
                          </label>
                          <input
                            type="date"
                            value={subTask.completion_date || ''}
                            onChange={async (e) => {
                              const updated = [...subTasks]
                              updated[index].completion_date = e.target.value || null
                              setSubTasks(updated)
                              
                              if (subTask.id) {
                                await supabase
                                  .from('sub_tasks')
                                  .update({ completion_date: e.target.value || null })
                                  .eq('id', subTask.id)
                              }
                            }}
                            disabled={!subTask.completion_date}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={subTask.points ?? 0}
                            onChange={async (e) => {
                              const value = Math.max(0, parseInt(e.target.value) || 0)
                              const updated = [...subTasks]
                              updated[index].points = value
                              setSubTasks(updated)
                              
                              if (subTask.id) {
                                await supabase
                                  .from('sub_tasks')
                                  .update({ points: value })
                                  .eq('id', subTask.id)
                              }
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={async () => {
                            if (subTask.id) {
                              await supabase
                                .from('sub_tasks')
                                .delete()
                                .eq('id', subTask.id)
                            }
                            
                            const updated = subTasks.filter((_, i) => i !== index)
                            
                            // Redistribute points
                            const totalPoints = editedTask.points ?? 10
                            const distributedPoints = distributePoints(totalPoints, updated.length)
                            updated.forEach((st, idx) => {
                              st.points = distributedPoints[idx] || 0
                              if (st.id) {
                                supabase
                                  .from('sub_tasks')
                                  .update({ points: distributedPoints[idx] || 0 })
                                  .eq('id', st.id)
                              }
                            })
                            
                            setSubTasks(updated)
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Point Balance Display */}
                <div className={`p-3 rounded-lg ${getPointBalance() === 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-base">
                      Point Balance:
                    </span>
                    <span className={`font-bold text-lg ${getPointBalance() === 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                      {getPointBalance() > 0 ? `+${getPointBalance()}` : getPointBalance()}
                    </span>
                  </div>
                  {getPointBalance() !== 0 && (
                    <p className="text-sm mt-1">
                      Adjust subtask points so the total equals {editedTask.points ?? 10} points
                    </p>
                  )}
                  {getPointBalance() === 0 && (
                    <p className="text-sm mt-1">
                      All points are distributed correctly
                    </p>
                  )}
                </div>
              </>
            )}
            
            {subTasks.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-base">No subtasks yet. Click "Add Subtask" to create one.</p>
            )}
          </div>

        {/* Due Date */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
            <input
              type="date"
              value={editedTask.due_date || ''}
              onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editedTask.is_hard_deadline || false}
                onChange={(e) => setEditedTask({ ...editedTask, is_hard_deadline: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: '#11551a' }}
              />
              <span className="text-lg">Hard deadline</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editedTask.is_recurring || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Deselect repeating if it's selected
                    if (editedTask.is_repeating) {
                      setEditedTask({ ...editedTask, is_repeating: false, repeating_frequency: null, is_recurring: true })
                    }
                    // If no frequency is set, open modal. Otherwise, just enable recurring
                    if (!editedTask.recurring_frequency) {
                      setShowRecurringModal(true)
                    } else {
                      setEditedTask({ ...editedTask, is_recurring: true })
                    }
                  } else {
                    setEditedTask({ ...editedTask, is_recurring: false, recurring_frequency: null })
                  }
                }}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: '#11551a' }}
              />
              <span className="text-lg">Recurring</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editedTask.is_repeating || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Deselect recurring if it's selected
                    if (editedTask.is_recurring) {
                      setEditedTask({ ...editedTask, is_recurring: false, recurring_frequency: null, is_repeating: true })
                    }
                    // If no frequency is set, open modal. Otherwise, just enable repeating
                    if (!editedTask.repeating_frequency) {
                      setShowRepeatingModal(true)
                    } else {
                      setEditedTask({ ...editedTask, is_repeating: true })
                    }
                  } else {
                    setEditedTask({ ...editedTask, is_repeating: false, repeating_frequency: null })
                  }
                }}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: '#11551a' }}
              />
              <span className="text-lg">Repeating</span>
            </label>
          </div>
          {editedTask.is_recurring && editedTask.recurring_frequency && (
            <div className="mt-2 text-base text-gray-600 dark:text-gray-400">
              <span 
                onClick={() => setShowRecurringModal(true)}
                className="cursor-pointer hover:underline"
              >
                Frequency: {getRecurringFrequencyLabel(editedTask.recurring_frequency)} (click to change)
              </span>
            </div>
          )}
          {editedTask.is_repeating && editedTask.repeating_frequency && (
            <div className="mt-2 text-base text-gray-600 dark:text-gray-400">
              <span 
                onClick={() => setShowRepeatingModal(true)}
                className="cursor-pointer hover:underline"
              >
                Frequency: {getRecurringFrequencyLabel(editedTask.repeating_frequency)} (click to change)
              </span>
            </div>
          )}
        </div>

        {/* Completion Date */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Completion Date
          </label>
          <input
            type="date"
            value={editedTask.completion_date || ''}
            onChange={(e) => setEditedTask({ ...editedTask, completion_date: e.target.value })}
            disabled={!isCompletionDateEditable}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-lg text-gray-500 mt-1">
            Auto-filled when marked as Complete or Dropped, and editable only for those statuses
          </p>
        </div>

      </div>

      {/* Recurring Frequency Modal */}
      {showRecurringModal && (
        <RecurringFrequencyModal
          currentFrequency={editedTask.recurring_frequency}
          onClose={() => setShowRecurringModal(false)}
          onSelect={(frequency) => {
            setEditedTask({ ...editedTask, is_recurring: true, recurring_frequency: frequency })
            setShowRecurringModal(false)
          }}
        />
      )}

      {/* Repeating Frequency Modal */}
      {showRepeatingModal && (
        <RecurringFrequencyModal
          currentFrequency={editedTask.repeating_frequency}
          onClose={() => setShowRepeatingModal(false)}
          onSelect={(frequency) => {
            setEditedTask({ ...editedTask, is_repeating: true, repeating_frequency: frequency })
            setShowRepeatingModal(false)
          }}
        />
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 max-w-md w-full">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold" style={{ color: '#11551a' }}>Confirm task is complete</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            <p className="text-base text-gray-700 mb-5">
              This will mark the task and all incomplete subtasks as complete with today's date.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="text-white px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: '#11551a' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7a28')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RecurringFrequencyModal({ currentFrequency, onClose, onSelect }: { currentFrequency: any, onClose: () => void, onSelect: (frequency: string) => void }) {
  // Parse current frequency to determine initial state
  const getInitialState = () => {
    if (!currentFrequency) return { freq: 'weekly', interval: '1', unit: 'weeks' }
    
    try {
      const parsed = typeof currentFrequency === 'string' ? JSON.parse(currentFrequency) : currentFrequency
      if (parsed.interval && parsed.unit) {
        return { freq: 'custom', interval: parsed.interval.toString(), unit: parsed.unit }
      }
    } catch {
      // Not JSON
    }
    
    // Simple frequency string
    return { freq: currentFrequency, interval: '1', unit: 'weeks' }
  }

  const initialState = getInitialState()
  const [selectedFrequency, setSelectedFrequency] = useState<string>(initialState.freq)
  const [customInterval, setCustomInterval] = useState<string>(initialState.interval)
  const [customUnit, setCustomUnit] = useState<string>(initialState.unit)

  const handleSave = () => {
    if (selectedFrequency === 'custom') {
      onSelect(JSON.stringify({ interval: parseInt(customInterval), unit: customUnit }))
    } else {
      onSelect(selectedFrequency)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 max-w-md w-full">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold" style={{ color: '#11551a' }}>Recurring Frequency</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {['daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
            <label key={freq} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="frequency"
                value={freq}
                checked={selectedFrequency === freq}
                onChange={(e) => setSelectedFrequency(e.target.value)}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: '#11551a' }}
              />
              <span className="text-base capitalize">{freq}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="frequency"
              value="custom"
              checked={selectedFrequency === 'custom'}
              onChange={(e) => setSelectedFrequency(e.target.value)}
              className="w-4 h-4 cursor-pointer"
              style={{ accentColor: '#11551a' }}
            />
            <span className="text-base">Custom</span>
          </label>

          {selectedFrequency === 'custom' && (
            <div className="ml-7 flex gap-2 items-center">
              <span className="text-base">Every</span>
              <input
                type="number"
                min="1"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 transition-all cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="days">day(s)</option>
                <option value="weeks">week(s)</option>
                <option value="months">month(s)</option>
                <option value="years">year(s)</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-white px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: '#11551a' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7a28')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function getRecurringFrequencyLabel(frequency: any): string {
  if (!frequency) return ''
  
  try {
    const parsed = typeof frequency === 'string' ? JSON.parse(frequency) : frequency
    if (parsed.interval && parsed.unit) {
      return `Every ${parsed.interval} ${parsed.unit}`
    }
  } catch {
    // Not JSON, treat as simple string
  }
  
  const simpleFreqs: { [key: string]: string } = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  }
  
  return simpleFreqs[frequency] || frequency
}

function CategoryManager({ categories: initialCategories, onClose }: any) {
  const [categories, setCategories] = useState(initialCategories)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const supabase = createClient()

  // Convert HSL to hex for color input
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  // Get random color in hex format
  const getRandomColorHex = () => {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 60 + Math.floor(Math.random() * 40)
    const lightness = 40 + Math.floor(Math.random() * 30)
    return hslToHex(hue, saturation, lightness)
  }

  const [newCategoryColor, setNewCategoryColor] = useState(getRandomColorHex())

  // Reset color to random when modal opens or after adding
  useEffect(() => {
    setNewCategoryColor(getRandomColorHex())
  }, [categories.length])

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const maxSortOrder = categories.length > 0 
      ? Math.max(...categories.map((c: any) => c.sort_order ?? 0))
      : -1
    
    const { data, error } = await supabase.from('categories').insert({
      name: newCategoryName,
      color: newCategoryColor,
      user_id: user?.id,
      sort_order: maxSortOrder + 1
    }).select().single()
    
    if (error) {
      alert('Error adding category: ' + error.message)
    } else {
      // Add to local state
      setCategories([...categories, data])
      setNewCategoryName('')
      setNewCategoryColor(getRandomColorHex())
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Tasks using it will be uncategorized.')) return
    
    const { error } = await supabase.from('categories').delete().eq('id', id)
    
    if (error) {
      alert('Error deleting category: ' + error.message)
    } else {
      // Remove from local state
      setCategories(categories.filter((cat: any) => cat.id !== id))
    }
  }

  const updateCategory = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      alert('Error updating category: ' + error.message)
    } else {
      // Update local state
      setCategories(categories.map((cat: any) => 
        cat.id === id ? { ...cat, ...updates } : cat
      ))
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCategories = [...categories]
    const draggedItem = newCategories[draggedIndex]
    newCategories.splice(draggedIndex, 1)
    newCategories.splice(index, 0, draggedItem)
    setCategories(newCategories)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    // Update sort_order for all categories
    const updates = categories.map((cat: any, index: number) => ({
      id: cat.id,
      sort_order: index
    }))

    // Update all categories in parallel
    const updatePromises = updates.map(({ id, sort_order }: { id: string, sort_order: number }) =>
      supabase.from('categories').update({ sort_order }).eq('id', id)
    )

    const results = await Promise.all(updatePromises)
    const hasError = results.some(result => result.error)
    
    if (hasError) {
      alert('Error updating category order')
      // Reload categories on error
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      if (data) setCategories(data)
    }

    setDraggedIndex(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold dark:text-white" style={{ color: '#11551a' }}>Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        {/* Add Category */}
        <div className="mb-5">
          <h3 className="font-bold mb-2 text-lg">Add New Category</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              title="Pick category color"
            />
            <button
              onClick={addCategory}
              className="text-white px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: '#f6d413' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c312')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
            >
              Add
            </button>
          </div>
        </div>

        {/* Category List */}
        <div>
          <h3 className="font-bold mb-2 text-lg">Existing Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-lg">No categories yet. Add one above!</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat: any, index: number) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <span className="text-gray-400 text-lg" title="Drag to reorder">☰</span>
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer"
                      title="Change color"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCategory(cat.id)
                    }}
                    className="ml-3 text-lg font-medium transition-colors cursor-pointer"
                    style={{ color: '#f56714' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#e55d13')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#f56714')}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DailyView() {
  const [entries, setEntries] = useState<any[]>([])
  
  // Load saved date from localStorage
  const loadSavedDate = () => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem('journalSelectedDate')
      if (saved) {
        return saved
      }
    } catch (e) {
      console.error('Error loading saved date:', e)
    }
    return null
  }

  const savedDate = loadSavedDate()
  const [selectedDate, setSelectedDate] = useState(savedDate || new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showHabitManager, setShowHabitManager] = useState(false)
  const [showCalibrationManager, setShowCalibrationManager] = useState(false)
  const [habits, setHabits] = useState<any[]>([])
  const [habitGroups, setHabitGroups] = useState<any[]>([])
  const [calibrations, setCalibrations] = useState<any[]>([])
  const [habitCompletions, setHabitCompletions] = useState<Map<string, boolean>>(new Map())
  const [calibrationScores, setCalibrationScores] = useState<Map<string, number>>(new Map())
  const [todayItems, setTodayItems] = useState<Map<string, boolean>>(new Map())
  const [completedTasks, setCompletedTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const supabase = createClient()

  // Save selectedDate to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('journalSelectedDate', selectedDate)
    } catch (e) {
      console.error('Error saving date:', e)
    }
  }, [selectedDate])

  useEffect(() => {
    loadJournalForDate(selectedDate)
    loadHabits()
    loadHabitGroups()
    loadCalibrations()
    loadTodayItems()
    loadCategories()
  }, [])

  const loadTodayItems = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('today_items')
      .select('item_id')
      .eq('user_id', user?.id)
      .eq('date', today)
      .eq('item_type', 'habit')
    
    const itemsMap = new Map<string, boolean>()
    if (data) {
      data.forEach(item => itemsMap.set(item.item_id, true))
    }
    setTodayItems(itemsMap)
  }

  const toggleHabitInToday = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const isInToday = todayItems.get(habitId)
    
    if (isInToday) {
      // Remove from today
      await supabase
        .from('today_items')
        .delete()
        .eq('user_id', user?.id)
        .eq('date', today)
        .eq('item_type', 'habit')
        .eq('item_id', habitId)
    } else {
      // Add to today - get max sort_order and add 1
      const { data: existing } = await supabase
        .from('today_items')
        .select('sort_order')
        .eq('user_id', user?.id)
        .eq('date', today)
        .order('sort_order', { ascending: false })
        .limit(1)
      
      const maxSortOrder = existing && existing.length > 0 ? existing[0].sort_order : -1
      
      await supabase
        .from('today_items')
        .insert({
          user_id: user?.id,
          item_type: 'habit',
          item_id: habitId,
          date: today,
          sort_order: maxSortOrder + 1
        })
    }
    
    loadTodayItems()
  }

  useEffect(() => {
    loadJournalForDate(selectedDate)
    loadHabitCompletions(selectedDate)
    loadCalibrationScores(selectedDate)
    loadCompletedTasks(selectedDate)
  }, [selectedDate])

  const loadJournalForDate = async (date: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('journals')
      .select('*')
      .eq('date', date)
      .single()
    
    if (data) {
      setContent(data.content)
      setIsEditing(false)
    } else {
      setContent('')
      setIsEditing(true) // If no entry exists, start in edit mode
    }
    setLoading(false)
  }

  const saveJournal = async () => {
    if (!content.trim()) {
      alert('Please write something before saving')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('journals')
      .upsert(
        {
          date: selectedDate,
          content,
          user_id: user?.id
        },
        {
          onConflict: 'user_id,date'
        }
      )
    
    if (error) {
      console.error('Error saving journal:', error)
      alert('Error: ' + error.message)
    } else {
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const cancelEdit = () => {
    loadJournalForDate(selectedDate) // Reload original content
    setIsEditing(false)
  }

  const loadHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('sort_order')
    if (data) setHabits(data)
  }

  const loadHabitGroups = async () => {
    const { data } = await supabase
      .from('habit_groups')
      .select('*')
      .order('sort_order')
    if (data) setHabitGroups(data)
  }

  const loadCalibrations = async () => {
    const { data } = await supabase
      .from('calibrations')
      .select('*')
      .order('sort_order')
    if (data) setCalibrations(data)
  }

  const loadHabitCompletions = async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('habit_completions')
      .select('habit_id, completed')
      .eq('date', date)
      .eq('user_id', user?.id)
    
    const completions = new Map<string, boolean>()
    if (data) {
      data.forEach(item => {
        completions.set(item.habit_id, item.completed)
      })
    }
    setHabitCompletions(completions)
  }

  const loadCalibrationScores = async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('calibration_scores')
      .select('calibration_id, score')
      .eq('date', date)
      .eq('user_id', user?.id)
    
    const scores = new Map<string, number>()
    if (data) {
      data.forEach(item => {
        scores.set(item.calibration_id, item.score)
      })
    }
    setCalibrationScores(scores)
  }

  const loadCompletedTasks = async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*, categories(*), sub_tasks(*)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    
    if (!allTasks) {
      setCompletedTasks([])
      return
    }

    // Filter tasks that:
    // 1. Have completion_date matching the selected date, OR
    // 2. Have sub-tasks with completion_date matching the selected date
    const filtered = allTasks.filter(task => {
      // Check if task itself was completed on this date
      if (task.completion_date === date && (task.status === 'Complete' || task.status === 'Dropped')) {
        return true
      }
      
      // Check if any sub-task was completed on this date
      if (task.sub_tasks && task.sub_tasks.length > 0) {
        return task.sub_tasks.some((st: any) => st.completion_date === date)
      }
      
      return false
    })
    
    setCompletedTasks(filtered)
  }

  // Helper functions for displaying task info
  const getCompletedPoints = (task: any): number => {
    if (task.sub_tasks && task.sub_tasks.length > 0) {
      // Sum points from completed subtasks
      return task.sub_tasks
        .filter((st: any) => st.completion_date !== null)
        .reduce((sum: number, st: any) => sum + (st.points ?? 0), 0)
    } else {
      // If no subtasks, task is either fully completed (points) or not (0)
      return (task.status === 'Complete' || task.status === 'Dropped') ? (task.points ?? 10) : 0
    }
  }

  const getTotalPoints = (task: any): number => {
    return task.points ?? 10
  }

  const getCompletedSubtasksCount = (task: any): number => {
    if (!task.sub_tasks || task.sub_tasks.length === 0) return 0
    return task.sub_tasks.filter((st: any) => st.completion_date !== null).length
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (data) setCategories(data)
  }

  const calculateNextDueDate = (currentDueDate: string, frequency: any): string => {
    const date = new Date(currentDueDate + 'T00:00:00')
    
    try {
      const parsed = typeof frequency === 'string' ? JSON.parse(frequency) : frequency
      if (parsed.interval && parsed.unit) {
        const interval = parsed.interval
        switch (parsed.unit) {
          case 'days':
            date.setDate(date.getDate() + interval)
            break
          case 'weeks':
            date.setDate(date.getDate() + (interval * 7))
            break
          case 'months':
            date.setMonth(date.getMonth() + interval)
            break
          case 'years':
            date.setFullYear(date.getFullYear() + interval)
            break
        }
        return date.toISOString().split('T')[0]
      }
    } catch {
      // Not JSON, treat as simple string
    }
    
    // Handle simple frequency strings
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1)
        break
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    
    return date.toISOString().split('T')[0]
  }

  const updateTask = async (id: string | null, updates: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    const skipRecurrence = updates?._skipRecurrence === true
    
    // Filter out non-updatable fields
    const allowedFields = ['title', 'status', 'category_id', 'description', 'due_date', 'is_hard_deadline', 'completion_date', 'is_recurring', 'recurring_frequency', 'is_repeating', 'repeating_frequency', 'points']
    const filteredUpdates: any = {}
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }
    
    // Only adjust completion_date when status is being updated
    if ('status' in filteredUpdates) {
      // Auto-set completion date when status changes to Complete or Dropped
      if ((filteredUpdates.status === 'Complete' || filteredUpdates.status === 'Dropped') && !filteredUpdates.completion_date) {
        filteredUpdates.completion_date = new Date().toISOString().split('T')[0]
      }
      
      // Clear completion date if status is not Complete/Dropped
      if (filteredUpdates.status !== 'Complete' && filteredUpdates.status !== 'Dropped') {
        filteredUpdates.completion_date = null
      }
    }
  
    // If marking task as Complete, check if it's recurring or repeating and create new task
    if (!skipRecurrence && id !== null && 'status' in filteredUpdates && (filteredUpdates.status === 'Complete' || filteredUpdates.status === 'Dropped')) {
      // Fetch the original task to check if it's recurring/repeating
      const { data: originalTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      
      if (originalTask) {
        const isDone = originalTask.status === 'Complete' || originalTask.status === 'Dropped'
        
        // If completing a recurring task, create a duplicate with next due date
        const isRecurring = originalTask.is_recurring === true || originalTask.is_recurring === 'true' || originalTask.is_recurring === 1
        if (!isDone && isRecurring && originalTask.recurring_frequency && originalTask.due_date) {
          const nextDueDate = calculateNextDueDate(originalTask.due_date, originalTask.recurring_frequency)
          
          // Create duplicate task
          const duplicateTask = {
            title: originalTask.title,
            status: 'To do',
            category_id: originalTask.category_id,
            description: originalTask.description,
            due_date: nextDueDate,
            is_hard_deadline: originalTask.is_hard_deadline,
            is_recurring: originalTask.is_recurring,
            recurring_frequency: originalTask.recurring_frequency,
            is_repeating: originalTask.is_repeating || false,
            repeating_frequency: originalTask.repeating_frequency || null,
            points: originalTask.points ?? 10,
            user_id: user?.id
          }
          
          const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
          if (insertError) {
            console.error('Error creating recurring task:', insertError)
          }
        }
        
        // If completing a repeating task, create a duplicate with next due date after completion
        const isRepeating = originalTask.is_repeating === true || originalTask.is_repeating === 'true' || originalTask.is_repeating === 1
        if (!isDone && isRepeating && originalTask.repeating_frequency) {
          // Calculate next due date from today (completion date) instead of original due date
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayStr = today.toISOString().split('T')[0]
          const nextDueDate = calculateNextDueDate(todayStr, originalTask.repeating_frequency)
          
          // Create duplicate task
          const duplicateTask = {
            title: originalTask.title,
            status: 'To do',
            category_id: originalTask.category_id,
            description: originalTask.description,
            due_date: nextDueDate,
            is_hard_deadline: originalTask.is_hard_deadline,
            is_recurring: originalTask.is_recurring || false,
            recurring_frequency: originalTask.recurring_frequency || null,
            is_repeating: originalTask.is_repeating,
            repeating_frequency: originalTask.repeating_frequency,
            points: originalTask.points ?? 10,
            user_id: user?.id
          }
          
          const { error: insertError } = await supabase.from('tasks').insert(duplicateTask)
          if (insertError) {
            console.error('Error creating repeating task:', insertError)
          }
        }
      }
    }
  
    let error
    let result
    
    if (id === null) {
      // Create new task
      const insertData = {
        ...filteredUpdates,
        points: filteredUpdates.points ?? 10,
        user_id: user?.id
      }
      result = await supabase
        .from('tasks')
        .insert(insertData)
        .select('*, categories(*)')
        .single()
      error = result.error
    } else {
      // Update existing task
      result = await supabase
        .from('tasks')
        .update(filteredUpdates)
        .eq('id', id)
        .select('*, categories(*)')
        .single()
      error = result.error
    }
    
    if (error) {
      console.error('Full error:', JSON.stringify(error, null, 2))
      alert('Error: ' + (error.message || 'Failed to save task'))
      return null
    } else {
      // Reload completed tasks after update
      await loadCompletedTasks(selectedDate)
      // Update selectedTask if it's the one being updated
      if (selectedTask && selectedTask.id === id) {
        // Reload the task with sub_tasks
        const { data: updatedTask } = await supabase
          .from('tasks')
          .select('*, categories(*), sub_tasks(*)')
          .eq('id', id)
          .single()
        if (updatedTask) {
          setSelectedTask(updatedTask)
        }
      }
      return result.data
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    await loadCompletedTasks(selectedDate)
    if (selectedTask?.id === id) setSelectedTask(null)
  }

  const toggleHabitCompletion = async (habitId: string, completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    const newCompletions = new Map(habitCompletions)
    newCompletions.set(habitId, completed)
    setHabitCompletions(newCompletions)

    const { error } = await supabase
      .from('habit_completions')
      .upsert({
        habit_id: habitId,
        date: selectedDate,
        user_id: user?.id,
        completed
      }, {
        onConflict: 'habit_id,date,user_id'
      })

    if (error) {
      console.error('Error saving habit completion:', error)
      // Revert on error
      loadHabitCompletions(selectedDate)
    }
  }

  const setCalibrationScore = async (calibrationId: string, score: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    const newScores = new Map(calibrationScores)
    newScores.set(calibrationId, score)
    setCalibrationScores(newScores)

    const { error } = await supabase
      .from('calibration_scores')
      .upsert({
        calibration_id: calibrationId,
        date: selectedDate,
        user_id: user?.id,
        score
      }, {
        onConflict: 'calibration_id,date,user_id'
      })

    if (error) {
      console.error('Error saving calibration score:', error)
      // Revert on error
      loadCalibrationScores(selectedDate)
    }
  }

  // Organize habits by group for display
  const getOrganizedHabits = () => {
    const groupsById = new Map<string, any>(habitGroups.map(g => [g.id, g]))
    const isGroupActive = (groupId: string) => {
      const group = groupsById.get(groupId)
      return !!group && isActiveOnDate(selectedDate, group)
    }

    const activeHabits = habits.filter(h => {
      if (!isActiveOnDate(selectedDate, h)) return false
      if (h.group_id) return isGroupActive(h.group_id)
      return true
    })

    const habitsByGroup = new Map<string, any[]>()
    const ungroupedHabits: any[] = []

    activeHabits.forEach(habit => {
      if (habit.group_id) {
        if (!habitsByGroup.has(habit.group_id)) {
          habitsByGroup.set(habit.group_id, [])
        }
        habitsByGroup.get(habit.group_id)!.push(habit)
      } else {
        ungroupedHabits.push(habit)
      }
    })

    // Get groups in order
    const orderedGroups = habitGroups
      .filter(g => isActiveOnDate(selectedDate, g))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const result: Array<{ type: 'group' | 'habit', data: any }> = []

    orderedGroups.forEach(group => {
      const groupHabits = habitsByGroup.get(group.id) || []
      // Sort habits within group by sort_order
      const sortedGroupHabits = groupHabits.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      if (sortedGroupHabits.length > 0) {
        result.push({ type: 'group', data: { group, habits: sortedGroupHabits } })
      }
    })

    // Add ungrouped habits, sorted by sort_order
    const sortedUngroupedHabits = ungroupedHabits.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    sortedUngroupedHabits.forEach(habit => {
      result.push({ type: 'habit', data: habit })
    })

    return result
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate + 'T00:00:00')
    const newDate = new Date(currentDate)
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1)
    } else {
      newDate.setDate(currentDate.getDate() + 1)
    }
    
    const newDateString = newDate.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]
    
    // Don't allow navigating to future dates
    if (newDateString <= today) {
      setSelectedDate(newDateString)
    }
  }

  const organizedHabits = getOrganizedHabits()
  const calibrationsForDate = calibrations.filter(c => isActiveOnDate(selectedDate, c))
  const isManaging = showHabitManager || showCalibrationManager

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
      {!isManaging && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-2xl font-bold dark:text-white" style={{ color: '#11551a' }}>Daily</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHabitManager(true)}
              className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
            >
              Habits
            </button>
            <button
              onClick={() => setShowCalibrationManager(true)}
              className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
            >
              Calibration
            </button>
          </div>
        </div>
      )}
      
      {isManaging ? (
        <>
          {showHabitManager && (
            <HabitManager
              habits={habits}
              habitGroups={habitGroups}
              onClose={() => {
                setShowHabitManager(false)
                loadHabits()
                loadHabitGroups()
              }}
            />
          )}
          {showCalibrationManager && (
            <CalibrationManager
              calibrations={calibrations}
              onClose={() => {
                setShowCalibrationManager(false)
                loadCalibrations()
              }}
            />
          )}
        </>
      ) : (
        <>
          {/* Date Selector */}
          <div className="mb-5">
            <label className="block text-lg font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="text-white px-3 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: '#11551a', fontSize: '20px' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7a28')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                aria-label="Previous day"
              >
                ◀
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => navigateDate('next')}
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                className="text-white px-3 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: '#11551a', fontSize: '20px' }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#1a7a28'
                  }
                }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                aria-label="Next day"
              >
                ▶
              </button>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-white px-3 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: '#11551a', fontSize: '20px' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7a28')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                aria-label="Go to today"
              >
                Today
              </button>
            </div>
            <p className="text-lg text-gray-600 mt-1.5">{formatDate(selectedDate)}</p>
          </div>

          {/* Journal Subheading */}
          <h3 className="text-xl font-semibold dark:text-white mb-4" style={{ color: '#11551a' }}>Journal</h3>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 text-lg">Loading...</p>
          ) : (
            <>
              {/* Display Mode */}
              {!isEditing && content ? (
                <div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[300px] whitespace-pre-wrap text-lg text-gray-900 dark:text-white">
                    {content}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-white px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      style={{ backgroundColor: '#11551a' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7a28')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                    >
                      Edit Entry
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write about your day..."
                    className="w-full h-72 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={saveJournal}
                        className="text-white px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        style={{ backgroundColor: '#11551a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7a28')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                      >
                        Save Entry
                      </button>
                      {!isEditing && content && (
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {saved && <span className="font-medium text-lg" style={{ color: '#11551a' }}>Saved!</span>}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isEditing && !content && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4 text-lg">No entry for this date</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-white px-5 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: '#11551a' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7a28')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#11551a')}
                  >
                    Write Entry
                  </button>
                </div>
              )}

              {/* Calibration and Habits Sections */}
              <>
                {/* Calibration Section */}
                {calibrationsForDate.length > 0 && (
                    <div className="mt-5 pt-5">
                      <h3 className="text-lg font-bold mb-3" style={{ color: '#11551a' }}>Calibration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {calibrationsForDate.map(calibration => {
                          const currentScore = calibrationScores.get(calibration.id) || 0
                          return (
                            <div key={calibration.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 gap-2">
                              <span className="font-medium text-lg">
                                {calibration.name}
                              </span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(score => (
                                  <button
                                    key={score}
                                    onClick={() => setCalibrationScore(calibration.id, score)}
                                    className={`w-9 h-9 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.05] cursor-pointer ${
                                      currentScore === score
                                        ? 'text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                                    style={currentScore === score ? { backgroundColor: '#11551a' } : {}}
                                    onMouseEnter={(e) => {
                                      if (currentScore !== score) {
                                        e.currentTarget.style.backgroundColor = '#e0e0e0'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (currentScore !== score) {
                                        e.currentTarget.style.backgroundColor = '#e5e7eb'
                                      }
                                    }}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Habits Section */}
                  {organizedHabits.length > 0 && (
                    <div className="mt-5 pt-5">
                      <h3 className="text-lg font-bold mb-3" style={{ color: '#11551a' }}>Habits</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {organizedHabits.map((item, index) => {
                          if (item.type === 'group') {
                            const { group, habits: groupHabits } = item.data
                            const groupCompleted = groupHabits.some((h: any) => habitCompletions.get(h.id))
                            return (
                              <div key={`group-${group.id}`} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="checkbox"
                                    checked={groupCompleted}
                                    onChange={(e) => {
                                      // Toggle first unchecked habit or uncheck all if all checked
                                      if (groupCompleted) {
                                        // Uncheck all
                                        groupHabits.forEach((h: any) => {
                                          if (habitCompletions.get(h.id)) {
                                            toggleHabitCompletion(h.id, false)
                                          }
                                        })
                                      } else {
                                        // Check first unchecked habit
                                        const firstUnchecked = groupHabits.find((h: any) => !habitCompletions.get(h.id))
                                        if (firstUnchecked) {
                                          toggleHabitCompletion(firstUnchecked.id, true)
                                        }
                                      }
                                    }}
                                    className="w-5 h-5 cursor-pointer"
                                    style={{ accentColor: '#11551a' }}
                                  />
                                  <span className="font-medium text-lg">
                                    {group.name}
                                  </span>
                                </div>
                                <div className="ml-7 space-y-1.5">
                                  {groupHabits.map((habit: any) => (
                                    <div key={habit.id} className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="checkbox"
                                          checked={habitCompletions.get(habit.id) || false}
                                          onChange={(e) => toggleHabitCompletion(habit.id, e.target.checked)}
                                          className="w-4 h-4 cursor-pointer"
                                          style={{ accentColor: '#11551a' }}
                                        />
                                        <button
                                          onClick={(e) => toggleHabitInToday(habit.id, e)}
                                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                                            todayItems.get(habit.id)
                                              ? 'bg-green-600 border-green-600'
                                              : 'border-gray-400 hover:border-green-600'
                                          }`}
                                          title={todayItems.get(habit.id) ? 'Remove from today' : 'Add to today'}
                                          style={todayItems.get(habit.id) ? { backgroundColor: '#11551a', borderColor: '#11551a' } : {}}
                                        />
                                      </div>
                                      <span className="text-lg">{habit.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          } else {
                            const habit = item.data
                            return (
                              <div key={habit.id} className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={habitCompletions.get(habit.id) || false}
                                    onChange={(e) => toggleHabitCompletion(habit.id, e.target.checked)}
                                    className="w-5 h-5 cursor-pointer"
                                    style={{ accentColor: '#11551a' }}
                                  />
                                  <button
                                    onClick={(e) => toggleHabitInToday(habit.id, e)}
                                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                                      todayItems.get(habit.id)
                                        ? 'bg-green-600 border-green-600'
                                        : 'border-gray-400 hover:border-green-600'
                                    }`}
                                    title={todayItems.get(habit.id) ? 'Remove from today' : 'Add to today'}
                                    style={todayItems.get(habit.id) ? { backgroundColor: '#11551a', borderColor: '#11551a' } : {}}
                                  />
                                </div>
                                <span className="text-lg">{habit.name}</span>
                              </div>
                            )
                          }
                        })}
                      </div>
                    </div>
                  )}
              </>
            </>
          )}

          {/* Completed Tasks Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 dark:text-white" style={{ color: '#11551a' }}>Completed Tasks</h3>
            {selectedTask ? (
              <TaskDetailView
                task={selectedTask}
                categories={categories}
                onClose={() => setSelectedTask(null)}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onShowCategories={() => {}}
              />
            ) : (
              <>
                {completedTasks.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No tasks completed on this date.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Desktop: Grid layout */}
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {completedTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-4 flex flex-col cursor-pointer active:scale-[0.98]"
                          style={{ minHeight: '140px' }}
                        >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h4 className={`font-semibold text-lg ${
                              (task.status === 'Complete' || task.status === 'Dropped') ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {task.title}
                            </h4>
                            {(task.is_recurring === true || task.is_recurring === 'true') && (
                              <span className="text-base" title="Recurring task">🔁</span>
                            )}
                            {(task.is_repeating === true || task.is_repeating === 'true') && (
                              <span className="text-base" title="Repeating task">⏭️</span>
                            )}
                            {task.sub_tasks && task.sub_tasks.length > 0 && (
                              <span className="text-base" title={`${task.sub_tasks.length} subtask${task.sub_tasks.length > 1 ? 's' : ''}`}>📋</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{task.status}</span>
                            <span className="text-gray-400">•</span>
                            <span>Points: {getCompletedPoints(task)}/{getTotalPoints(task)}</span>
                            {task.sub_tasks && task.sub_tasks.length > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span>Subtasks: {getCompletedSubtasksCount(task)}/{task.sub_tasks.length}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {task.categories && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-md text-sm text-white font-medium flex-shrink-0"
                            style={{ backgroundColor: task.categories.color }}
                          >
                            {task.categories.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto pt-2">
                        {(task.due_date || task.completion_date) && (
                          <p className="text-sm">
                            {task.due_date && (
                              <span className={task.is_hard_deadline ? 'font-bold text-red-600' : 'text-gray-600'}>
                                Due: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                                {task.is_hard_deadline && <span className="ml-1" style={{ fontSize: '16px' }}>❗</span>}
                              </span>
                            )}
                            {task.due_date && task.completion_date && <span className="mx-2 text-gray-400">|</span>}
                            {task.completion_date && (
                              <span style={{ color: '#11551a' }}>
                                ✓ {new Date(task.completion_date + 'T00:00:00').toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                    {/* Mobile: Single column */}
                    <div className="md:hidden space-y-3">
                      {completedTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 cursor-pointer active:scale-[0.98] transition-all duration-200"
                          style={{ minHeight: '120px' }}
                        >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className={`font-semibold text-lg ${
                              (task.status === 'Complete' || task.status === 'Dropped') ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {task.title}
                            </h4>
                            {(task.is_recurring === true || task.is_recurring === 'true') && (
                              <span className="text-lg" title="Recurring task">🔁</span>
                            )}
                            {(task.is_repeating === true || task.is_repeating === 'true') && (
                              <span className="text-lg" title="Repeating task">⏭️</span>
                            )}
                          </div>
                          <div className="mt-1 text-base text-gray-500 flex items-center gap-2">
                            <span>{task.status}</span>
                            <span className="text-gray-400">•</span>
                            <span>Points: {getCompletedPoints(task)}/{getTotalPoints(task)}</span>
                            {task.sub_tasks && task.sub_tasks.length > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span>Subtasks: {getCompletedSubtasksCount(task)}/{task.sub_tasks.length}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {task.categories && (
                          <span
                            className="inline-block px-2.5 py-1 rounded-md text-sm text-white font-medium flex-shrink-0"
                            style={{ backgroundColor: task.categories.color }}
                          >
                            {task.categories.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 pt-2">
                        {(task.due_date || task.completion_date) && (
                          <p className="text-base">
                            {task.due_date && (
                              <span className={task.is_hard_deadline ? 'font-bold text-red-600' : 'text-gray-600'}>
                                Due: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                                {task.is_hard_deadline && <span className="ml-1" style={{ fontSize: '18px' }}>❗</span>}
                              </span>
                            )}
                            {task.due_date && task.completion_date && <span className="mx-2 text-gray-400">|</span>}
                            {task.completion_date && (
                              <span style={{ color: '#11551a' }}>
                                ✓ {new Date(task.completion_date + 'T00:00:00').toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

    </div>
  )
}

function CalibrationManager({ calibrations: initialCalibrations, onClose }: any) {
  const [calibrations, setCalibrations] = useState(initialCalibrations)
  const [newCalibrationName, setNewCalibrationName] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showDeactivated, setShowDeactivated] = useState(false)
  const supabase = createClient()
  const todayStr = new Date().toISOString().split('T')[0]

  const addCalibration = async () => {
    if (!newCalibrationName.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const maxSortOrder = calibrations.length > 0 
      ? Math.max(...calibrations.map((c: any) => c.sort_order ?? 0))
      : -1
    
    const { data, error } = await supabase.from('calibrations').insert({
      name: newCalibrationName,
      color: '#000000', // Default color (not displayed)
      user_id: user?.id,
      sort_order: maxSortOrder + 1,
      active_from: todayStr
    }).select().single()
    
    if (error) {
      alert('Error adding calibration: ' + error.message)
    } else {
      setCalibrations([...calibrations, data])
      setNewCalibrationName('')
    }
  }

  const deleteCalibration = async (id: string) => {
    if (!confirm('Delete this calibration?')) return
    
    const { error } = await supabase.from('calibrations').delete().eq('id', id)
    
    if (error) {
      alert('Error deleting calibration: ' + error.message)
    } else {
      setCalibrations(calibrations.filter((cal: any) => cal.id !== id))
    }
  }

  const updateCalibration = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('calibrations')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      alert('Error updating calibration: ' + error.message)
    } else {
      setCalibrations(calibrations.map((cal: any) => 
        cal.id === id ? { ...cal, ...updates } : cal
      ))
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCalibrations = [...calibrations]
    const draggedItem = newCalibrations[draggedIndex]
    newCalibrations.splice(draggedIndex, 1)
    newCalibrations.splice(index, 0, draggedItem)
    setCalibrations(newCalibrations)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    const updates = calibrations.map((cal: any, index: number) => ({
      id: cal.id,
      sort_order: index
    }))

    const updatePromises = updates.map(({ id, sort_order }: { id: string, sort_order: number }) =>
      supabase.from('calibrations').update({ sort_order }).eq('id', id)
    )

    const results = await Promise.all(updatePromises)
    const hasError = results.some(result => result.error)
    
    if (hasError) {
      alert('Error updating calibration order')
      const { data } = await supabase
        .from('calibrations')
        .select('*')
        .order('sort_order')
      if (data) setCalibrations(data)
    }

    setDraggedIndex(null)
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold dark:text-white" style={{ color: '#11551a' }}>Set Calibration</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowDeactivated(v => !v)}
          className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
        >
          {showDeactivated ? 'Show Active' : 'Show Deactivated'}
        </button>
      </div>

      <div className="mb-5">
        <h3 className="font-bold mb-2 text-lg">Add New Calibration</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Calibration name"
            value={newCalibrationName}
            onChange={(e) => setNewCalibrationName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCalibration()}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={addCalibration}
            className="text-white px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: '#f6d413' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c312')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2 text-lg">Existing Calibrations</h3>
        {calibrations.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-lg">No calibrations yet. Add one above!</p>
        ) : (
          <div className="space-y-2">
            {calibrations
              .map((cal: any, fullIndex: number) => ({ cal, fullIndex }))
              .filter(({ cal }: { cal: any }) => (showDeactivated ? !!cal.active_to : !cal.active_to))
              .map(({ cal, fullIndex }: { cal: any, fullIndex: number }) => (
              <div
                key={cal.id}
                draggable
                onDragStart={() => handleDragStart(fullIndex)}
                onDragOver={(e) => handleDragOver(e, fullIndex)}
                onDragEnd={handleDragEnd}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors gap-2"
              >
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="text-gray-400 text-lg" title="Drag to reorder">☰</span>
                  <input
                    type="text"
                    value={cal.name}
                    onChange={(e) => updateCalibration(cal.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Active from</label>
                      <input
                        type="date"
                        value={cal.active_from || ''}
                        max={cal.active_to || undefined}
                        onChange={(e) => updateCalibration(cal.id, { active_from: e.target.value || todayStr })}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Active to</label>
                      <input
                        type="date"
                        value={cal.active_to || ''}
                        min={cal.active_from || undefined}
                        onChange={(e) => updateCalibration(cal.id, { active_to: toDateOrNull(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
                <div className="sm:hidden flex items-center gap-2">
                  <input
                    type="date"
                    value={cal.active_from || ''}
                    max={cal.active_to || undefined}
                    onChange={(e) => updateCalibration(cal.id, { active_from: e.target.value || todayStr })}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                    title="Active from"
                  />
                  <input
                    type="date"
                    value={cal.active_to || ''}
                    min={cal.active_from || undefined}
                    onChange={(e) => updateCalibration(cal.id, { active_to: toDateOrNull(e.target.value) })}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                    title="Active to"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCalibration(cal.id)
                  }}
                  className="ml-3 text-lg font-medium transition-colors cursor-pointer self-end sm:self-auto"
                  style={{ color: '#f56714' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e55d13')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#f56714')}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HabitManager({ habits: initialHabits, habitGroups: initialHabitGroups, onClose }: any) {
  const [habits, setHabits] = useState(initialHabits)
  const [habitGroups, setHabitGroups] = useState(initialHabitGroups)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitGroupName, setNewHabitGroupName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedType, setDraggedType] = useState<'habit' | 'group' | 'habit-in-group' | null>(null)
  const [draggedHabitInfo, setDraggedHabitInfo] = useState<{ habitId: string, groupId: string } | null>(null)
  const [showDeactivated, setShowDeactivated] = useState(false)
  const supabase = createClient()
  const todayStr = new Date().toISOString().split('T')[0]

  const getOrganizedItems = () => {
    const items: Array<{ type: 'group' | 'habit', data: any, index: number }> = []
    const habitsByGroup = new Map<string, any[]>()
    const ungroupedHabits: any[] = []

    habits.forEach((habit: any) => {
      if (habit.group_id) {
        if (!habitsByGroup.has(habit.group_id)) {
          habitsByGroup.set(habit.group_id, [])
        }
        habitsByGroup.get(habit.group_id)!.push(habit)
      } else {
        ungroupedHabits.push(habit)
      }
    })

    // Create unified list of groups and orphan habits, sorted by sort_order
    const unifiedItems: Array<{ type: 'group' | 'habit', data: any, sortOrder: number }> = []
    
    // Add groups
    habitGroups.forEach((group: any) => {
      unifiedItems.push({ 
        type: 'group', 
        data: { group, habits: habitsByGroup.get(group.id) || [] }, 
        sortOrder: group.sort_order || 0 
      })
    })
    
    // Add orphan habits
    ungroupedHabits.forEach((habit: any) => {
      unifiedItems.push({ 
        type: 'habit', 
        data: habit, 
        sortOrder: habit.sort_order || 0 
      })
    })
    
    // Sort by sort_order
    unifiedItems.sort((a, b) => a.sortOrder - b.sortOrder)
    
    // Convert to final format with index
    unifiedItems.forEach((item, index) => {
      items.push({ type: item.type, data: item.data, index })
    })

    return items
  }

  const addHabit = async () => {
    if (!newHabitName.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const maxSortOrder = habits.length > 0 
      ? Math.max(...habits.map((h: any) => h.sort_order ?? 0))
      : -1
    
    const { data, error } = await supabase.from('habits').insert({
      name: newHabitName,
      color: '#000000', // Default color (not displayed)
      user_id: user?.id,
      group_id: selectedGroup || null,
      sort_order: maxSortOrder + 1,
      active_from: todayStr
    }).select().single()
    
    if (error) {
      alert('Error adding habit: ' + error.message)
    } else {
      setHabits([...habits, data])
      setNewHabitName('')
      setSelectedGroup('')
    }
  }

  const addHabitGroup = async () => {
    if (!newHabitGroupName.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const maxSortOrder = habitGroups.length > 0 
      ? Math.max(...habitGroups.map((g: any) => g.sort_order ?? 0))
      : -1
    
    const { data, error } = await supabase.from('habit_groups').insert({
      name: newHabitGroupName,
      color: '#000000', // Default color (not displayed)
      user_id: user?.id,
      sort_order: maxSortOrder + 1,
      active_from: todayStr
    }).select().single()
    
    if (error) {
      alert('Error adding habit group: ' + error.message)
    } else {
      setHabitGroups([...habitGroups, data])
      setNewHabitGroupName('')
    }
  }

  const deleteHabit = async (id: string) => {
    if (!confirm('Delete this habit?')) return
    
    const { error } = await supabase.from('habits').delete().eq('id', id)
    
    if (error) {
      alert('Error deleting habit: ' + error.message)
    } else {
      setHabits(habits.filter((h: any) => h.id !== id))
    }
  }

  const deleteHabitGroup = async (id: string) => {
    if (!confirm('Delete this habit group? All habits in the group will be ungrouped.')) return
    
    await supabase.from('habits').update({ group_id: null }).eq('group_id', id)
    
    const { error } = await supabase.from('habit_groups').delete().eq('id', id)
    
    if (error) {
      alert('Error deleting habit group: ' + error.message)
    } else {
      setHabitGroups(habitGroups.filter((g: any) => g.id !== id))
      const { data } = await supabase.from('habits').select('*').order('sort_order')
      if (data) setHabits(data)
    }
  }

  const updateHabit = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      alert('Error updating habit: ' + error.message)
    } else {
      setHabits(habits.map((h: any) => 
        h.id === id ? { ...h, ...updates } : h
      ))
    }
  }

  const updateHabitGroup = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('habit_groups')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      alert('Error updating habit group: ' + error.message)
    } else {
      setHabitGroups(habitGroups.map((g: any) => 
        g.id === id ? { ...g, ...updates } : g
      ))
    }
  }

  const setHabitGroupActiveTo = async (groupId: string, activeTo: string | null) => {
    const { error } = await supabase
      .from('habit_groups')
      .update({ active_to: activeTo })
      .eq('id', groupId)

    if (error) {
      alert('Error updating habit group: ' + error.message)
      return
    }

    setHabitGroups((prev: any[]) => prev.map((g: any) => (g.id === groupId ? { ...g, active_to: activeTo } : g)))

    // If a group is deactivated, all habits in the group should be deactivated at the same date.
    if (activeTo) {
      const [resNull, resGt] = await Promise.all([
        supabase.from('habits').update({ active_to: activeTo }).eq('group_id', groupId).is('active_to', null),
        supabase.from('habits').update({ active_to: activeTo }).eq('group_id', groupId).gt('active_to', activeTo)
      ])

      if (resNull.error || resGt.error) {
        alert('Error deactivating habits in group')
      } else {
        setHabits((prev: any[]) => prev.map((h: any) => {
          if (h.group_id !== groupId) return h
          if (!h.active_to || h.active_to > activeTo) return { ...h, active_to: activeTo }
          return h
        }))
      }
    }
  }

  const handleDragStart = (index: number, type: 'habit' | 'group') => {
    setDraggedIndex(index)
    setDraggedType(type)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const items = getOrganizedItems()
    
    if (draggedType === 'habit-in-group' || (typeof draggedIndex === 'number' && draggedIndex < 0)) {
      return;
    }
    
    const newItems = [...items]
    const draggedItem = newItems[draggedIndex]
    
    if (draggedItem === undefined || draggedItem === null) {
      return;
    }
    
    newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, draggedItem)
    
    // Update sort_order for all items based on their new positions
    // This allows groups and orphan habits to be interleaved
    newItems.forEach((item, newIndex) => {
      // Safety check: skip undefined/null items (should not happen with the early return above, but defensive)
      if (!item || !item.type) return
      if (item.type === 'group' && item.data.group) {
        const group = habitGroups.find((g: any) => g.id === item.data.group.id)
        if (group) {
          group.sort_order = newIndex
        }
      } else if (item.type === 'habit' && item.data.id) {
        const habit = habits.find((h: any) => h.id === item.data.id)
        if (habit && !habit.group_id) {
          // Only update sort_order for orphan habits
          habit.sort_order = newIndex
        }
      }
    })
    
    // Update state to reflect new order
    if (draggedType === 'group' && draggedItem.data.group) {
      const newGroups = [...habitGroups]
      setHabitGroups(newGroups)
    } else if (draggedType === 'habit' && draggedItem.data.id) {
      const newHabits = [...habits]
      setHabits(newHabits)
    }
    
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    // Get the final organized items to determine sort_order
    const items = getOrganizedItems()
    
    // Update groups based on their position in the unified list
    const groupUpdates = items
      .map((item, index) => {
        if (item.type === 'group') {
          return {
            id: item.data.group.id,
            sort_order: index
          }
        }
        return null
      })
      .filter((update): update is { id: string, sort_order: number } => update !== null)
    
    const groupUpdatePromises = groupUpdates.map(({ id, sort_order }: { id: string, sort_order: number }) =>
      supabase.from('habit_groups').update({ sort_order }).eq('id', id)
    )
    
    // Update orphan habits (habits without groups) based on their position in the unified list
    const orphanHabitUpdates = items
      .map((item, index) => {
        if (item.type === 'habit') {
          const habit = habits.find((h: any) => h.id === item.data.id)
          // Only update orphan habits (those without group_id)
          if (habit && !habit.group_id) {
            return {
              id: item.data.id,
              sort_order: index
            }
          }
        }
        return null
      })
      .filter((update): update is { id: string, sort_order: number } => update !== null)
    
    const habitUpdatePromises = orphanHabitUpdates.map(({ id, sort_order }: { id: string, sort_order: number }) =>
      supabase.from('habits').update({ sort_order }).eq('id', id)
    )
    
    await Promise.all([...groupUpdatePromises, ...habitUpdatePromises])

    setDraggedIndex(null)
    setDraggedType(null)
  }

  const organizedItems = getOrganizedItems()

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold" style={{ color: '#11551a' }}>Set Habits</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer transition-colors"
        >
          ×
        </button>
      </div>

        <div className="flex justify-end mb-5">
          <button
            onClick={() => setShowDeactivated(v => !v)}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            {showDeactivated ? 'Show Active' : 'Show Deactivated'}
          </button>
        </div>

        <div className="mb-5">
          <h3 className="font-bold mb-2 text-lg">Add New Habit Group</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Group name"
              value={newHabitGroupName}
              onChange={(e) => setNewHabitGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabitGroup()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={addHabitGroup}
              className="text-white px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: '#f6d413' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c312')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
            >
              Add Group
            </button>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="font-bold mb-2 text-lg">Add New Habit</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Habit name"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
            >
              <option value="">No group</option>
              {habitGroups.filter((g: any) => !g.active_to).map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={addHabit}
              className="text-white px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: '#f6d413' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c312')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2 text-lg">Existing Habits & Groups</h3>
          {organizedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-lg">No habits yet. Add one above!</p>
          ) : (
            <div className="space-y-2">
              {organizedItems.map((item) => {
                if (item.type === 'group') {
                  const { group, habits: groupHabitsAll } = item.data
                  const groupMatches = showDeactivated ? !!group.active_to : !group.active_to
                  const groupHabits = (groupHabitsAll || []).filter((h: any) => (showDeactivated ? !!h.active_to : !h.active_to))
                  const shouldShowGroup = groupMatches || groupHabits.length > 0
                  if (!shouldShowGroup) return null

                  return (
                    <div
                      key={`group-${group.id}`}
                      draggable
                      onDragStart={() => handleDragStart(item.index, 'group')}
                      onDragOver={(e) => handleDragOver(e, item.index)}
                      onDragEnd={handleDragEnd}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-move transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
                          <span className="text-gray-400 text-lg">☰</span>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateHabitGroup(group.id, { name: e.target.value })}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="hidden sm:flex items-center gap-2">
                            <div className="flex flex-col">
                              <label className="text-xs text-gray-500 dark:text-gray-400">Active from</label>
                              <input
                                type="date"
                                value={group.active_from || ''}
                                max={group.active_to || undefined}
                                onChange={(e) => updateHabitGroup(group.id, { active_from: e.target.value || todayStr })}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="flex flex-col">
                              <label className="text-xs text-gray-500 dark:text-gray-400">Active to</label>
                              <input
                                type="date"
                                value={group.active_to || ''}
                                min={group.active_from || undefined}
                                onChange={(e) => setHabitGroupActiveTo(group.id, toDateOrNull(e.target.value))}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteHabitGroup(group.id)
                          }}
                          className="ml-3 text-lg font-medium transition-colors cursor-pointer"
                          style={{ color: '#f56714' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#e55d13')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#f56714')}
                        >
                          Delete Group
                        </button>
                      </div>
                      <div className="sm:hidden ml-9 mb-2 flex flex-col gap-2">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Active from</label>
                          <input
                            type="date"
                            value={group.active_from || ''}
                            max={group.active_to || undefined}
                            onChange={(e) => updateHabitGroup(group.id, { active_from: e.target.value || todayStr })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Active to</label>
                          <input
                            type="date"
                            value={group.active_to || ''}
                            min={group.active_from || undefined}
                            onChange={(e) => setHabitGroupActiveTo(group.id, toDateOrNull(e.target.value))}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="ml-9 space-y-1.5">
                        {groupHabits.map((habit: any, habitIndex: number) => (
                          <div 
                            key={habit.id} 
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation()
                              // Store the habit and group info for reordering within group
                              const allItems = getOrganizedItems()
                              const groupItemIndex = allItems.findIndex((item: any) => item.type === 'group' && item.data.group.id === group.id)
                              // Use a negative index to indicate it's a habit within a group
                              // We'll handle this specially in handleDragOver
                              setDraggedIndex(-(groupItemIndex + 1))
                              setDraggedType('habit-in-group')
                              setDraggedHabitInfo({ habitId: habit.id, groupId: group.id })
                              // Store habit info in a ref or state - for now we'll use data attribute
                              e.dataTransfer.setData('habitId', habit.id)
                              e.dataTransfer.setData('groupId', group.id)
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Handle reordering within group
                              const draggedHabitId = e.dataTransfer.getData('habitId') || draggedHabitInfo?.habitId || ''
                              const draggedGroupId = e.dataTransfer.getData('groupId') || draggedHabitInfo?.groupId || ''
                              if (draggedGroupId === group.id && draggedHabitId !== habit.id) {
                                const newHabits = [...habits]
                                const draggedHabitIndex = newHabits.findIndex((h: any) => h.id === draggedHabitId)
                                const targetHabitIndex = newHabits.findIndex((h: any) => h.id === habit.id)
                                if (draggedHabitIndex !== -1 && targetHabitIndex !== -1) {
                                  const [movedHabit] = newHabits.splice(draggedHabitIndex, 1)
                                  newHabits.splice(targetHabitIndex, 0, movedHabit)
                                  // Update sort_order for all habits in the group
                                  const groupHabitsList = newHabits.filter((h: any) => h.group_id === group.id)
                                  groupHabitsList.forEach((h: any, i: number) => {
                                    h.sort_order = i
                                  })
                                  setHabits(newHabits)
                                }
                              }
                            }}
                            onDragEnd={async () => {
                              // Save habit order - use the sort_order values that were set during onDragOver
                              const groupHabitsList = habits.filter((h: any) => h.group_id === group.id)
                              const updates = groupHabitsList.map((h: any) => ({
                                id: h.id,
                                sort_order: h.sort_order ?? 0  // Use the actual sort_order, not array index
                              }))
                              const updatePromises = updates.map(({ id, sort_order }: { id: string, sort_order: number }) =>
                                supabase.from('habits').update({ sort_order }).eq('id', id)
                              )
                              await Promise.all(updatePromises)
                              setDraggedIndex(null)
                              setDraggedType(null)
                              setDraggedHabitInfo(null)
                            }}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-gray-50 rounded-lg cursor-move transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={habit.name}
                                onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="hidden sm:flex items-center gap-2">
                                <input
                                  type="date"
                                  value={habit.active_from || ''}
                                  max={habit.active_to || undefined}
                                  onChange={(e) => updateHabit(habit.id, { active_from: e.target.value || todayStr })}
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Active from"
                                />
                                <input
                                  type="date"
                                  value={habit.active_to || ''}
                                  min={habit.active_from || undefined}
                                  onChange={(e) => updateHabit(habit.id, { active_to: toDateOrNull(e.target.value) })}
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Active to"
                                />
                              </div>
                            </div>
                            <div className="sm:hidden flex items-center gap-2">
                              <input
                                type="date"
                                value={habit.active_from || ''}
                                max={habit.active_to || undefined}
                                onChange={(e) => updateHabit(habit.id, { active_from: e.target.value || todayStr })}
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                                title="Active from"
                              />
                              <input
                                type="date"
                                value={habit.active_to || ''}
                                min={habit.active_from || undefined}
                                onChange={(e) => updateHabit(habit.id, { active_to: toDateOrNull(e.target.value) })}
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                                title="Active to"
                              />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHabit(habit.id)
                              }}
                              className="ml-2 text-lg font-medium transition-colors cursor-pointer self-end sm:self-auto"
                              style={{ color: '#f56714' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#e55d13')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#f56714')}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                } else {
                  const habit = item.data
                  const habitMatches = showDeactivated ? !!habit.active_to : !habit.active_to
                  if (!habitMatches) return null
                  return (
                    <div
                      key={habit.id}
                      draggable
                      onDragStart={() => handleDragStart(item.index, 'habit')}
                      onDragOver={(e) => handleDragOver(e, item.index)}
                      onDragEnd={handleDragEnd}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <span className="text-gray-400 text-lg">☰</span>
                        <input
                          type="text"
                          value={habit.name}
                          onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                            <input
                              type="date"
                              value={habit.active_from || ''}
                              max={habit.active_to || undefined}
                              onChange={(e) => updateHabit(habit.id, { active_from: e.target.value || todayStr })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                            <input
                              type="date"
                              value={habit.active_to || ''}
                              min={habit.active_from || undefined}
                              onChange={(e) => updateHabit(habit.id, { active_to: toDateOrNull(e.target.value) })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="sm:hidden flex items-center gap-2">
                        <input
                          type="date"
                          value={habit.active_from || ''}
                          max={habit.active_to || undefined}
                          onChange={(e) => updateHabit(habit.id, { active_from: e.target.value || todayStr })}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                          title="Active from"
                        />
                        <input
                          type="date"
                          value={habit.active_to || ''}
                          min={habit.active_from || undefined}
                          onChange={(e) => updateHabit(habit.id, { active_to: toDateOrNull(e.target.value) })}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                          title="Active to"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHabit(habit.id)
                        }}
                        className="ml-3 text-lg font-medium transition-colors cursor-pointer self-end sm:self-auto"
                        style={{ color: '#f56714' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e55d13')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#f56714')}
                      >
                        Delete
                      </button>
                    </div>
                  )
                }
              })}
            </div>
          )}
        </div>
      </div>
  )
}