'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin')
  const [view, setView] = useState<'tasks' | 'journal' | 'settings'>('tasks')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [mobileStatusFilter, setMobileStatusFilter] = useState<string>('To do')

  const supabase = createClient()

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
    setView('tasks')
    setShowChangePassword(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7F8' }}>
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#11551a' }}>Welcome</h2>
          
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg mb-4 text-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ backgroundColor: '#e8f5e9' }} className="text-green-800 px-3 py-2 rounded-lg mb-4 text-lg">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
              />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
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
              <p className="text-gray-600 text-center text-lg">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
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
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F8' }}>
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#11551a' }}>
              P
            </div>
            <h1 className="text-3xl font-bold" style={{ color: '#11551a' }}>Productivity & Wellness</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setView('tasks')}
              className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                view === 'tasks' ? 'text-white shadow-md' : 'bg-gray-200 text-gray-700'
              }`}
              style={view === 'tasks' ? { backgroundColor: '#11551a' } : {}}
              onMouseEnter={(e) => {
                if (view !== 'tasks') {
                  e.currentTarget.style.backgroundColor = '#e0e0e0'
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'tasks') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }
              }}
            >
              Tasks
            </button>
            <button
              onClick={() => setView('journal')}
              className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                view === 'journal' ? 'text-white shadow-md' : 'bg-gray-200 text-gray-700'
              }`}
              style={view === 'journal' ? { backgroundColor: '#11551a' } : {}}
              onMouseEnter={(e) => {
                if (view !== 'journal') {
                  e.currentTarget.style.backgroundColor = '#e0e0e0'
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'journal') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }
              }}
            >
              Journal
            </button>
            <button
              onClick={() => setView('settings')}
              className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                view === 'settings' ? 'text-white shadow-md' : 'bg-gray-200 text-gray-700'
              }`}
              style={view === 'settings' ? { backgroundColor: '#11551a' } : {}}
              onMouseEnter={(e) => {
                if (view !== 'settings') {
                  e.currentTarget.style.backgroundColor = '#e0e0e0'
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'settings') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }
              }}
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
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'tasks' ? <TasksView mobileStatusFilter={mobileStatusFilter} setMobileStatusFilter={setMobileStatusFilter} /> : view === 'journal' ? <JournalView /> : <SettingsView user={user} />}
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
      <p className="text-gray-600 text-center text-lg">
        Enter your new password below.
      </p>
      <input
        type="password"
        placeholder="New Password (min. 6 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
      />
      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <p className="text-red-600 text-lg">Passwords do not match</p>
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

function SettingsView({ user }: { user: User }) {
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
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h2 className="text-2xl font-bold mb-5" style={{ color: '#11551a' }}>Settings</h2>
      
      <div className="space-y-5">
        {/* User Info */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Account Information</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-lg text-gray-600 mb-1">Email</p>
            <p className="text-gray-900">{user.email}</p>
          </div>
        </div>

        {/* Change Password */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Change Password</h3>
          
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg mb-3 text-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ backgroundColor: '#e8f5e9' }} className="text-green-800 px-3 py-2 rounded-lg mb-3 text-lg">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                placeholder="Enter new password (min. 6 characters)"
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                placeholder="Confirm new password"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-600 text-lg mt-1">Passwords do not match</p>
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

function TasksView({ mobileStatusFilter, setMobileStatusFilter }: { mobileStatusFilter: string, setMobileStatusFilter: (filter: string) => void }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [sortBy, setSortBy] = useState<'due_date' | 'status'>('due_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [dateFilter, setDateFilter] = useState<string>('All')
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(new Set(['All']))
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
    loadCategories()
  }, [])

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, categories(*)')
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
    
    // Filter out non-updatable fields (id, user_id, created_at, categories from join)
    const allowedFields = ['title', 'status', 'category_id', 'description', 'due_date', 'is_hard_deadline', 'completion_date', 'is_recurring', 'recurring_frequency']
    const filteredUpdates: any = {}
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }
    
    // Auto-set completion date when status changes to Complete
    if (filteredUpdates.status === 'Complete' && !filteredUpdates.completion_date) {
      filteredUpdates.completion_date = new Date().toISOString().split('T')[0]
    }
    
    // Clear completion date if status is not Complete
    if (filteredUpdates.status !== 'Complete') {
      filteredUpdates.completion_date = null
    }
  
    let error
    let result
    
    if (id === null) {
      // Create new task
      result = await supabase
        .from('tasks')
        .insert({
          ...filteredUpdates,
          user_id: user?.id
        })
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
      return false
    } else {
      loadTasks() // This reloads all tasks with categories
      return true
    }
  }

  const toggleComplete = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening detail view
    
    const isComplete = task.status === 'Complete'
    
    // If completing a recurring task, create a duplicate with next due date
    if (!isComplete && (task.is_recurring === true || task.is_recurring === 'true') && task.recurring_frequency && task.due_date) {
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
        user_id: user?.id
      }
      
      await supabase.from('tasks').insert(duplicateTask)
    }
    
    await updateTask(task.id, {
      status: isComplete ? 'To do' : 'Complete',
      completion_date: isComplete ? null : new Date().toISOString().split('T')[0]
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
    if (statusFilters.size > 0) {
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

    // Apply date filter
    if (dateFilter !== 'All') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      filtered = filtered.filter(task => {
        if (dateFilter === 'Today & overdue') {
          return task.due_date && task.due_date <= todayStr
        } else if (dateFilter === 'Next 7 days') {
          return task.due_date && task.due_date >= todayStr && task.due_date <= sevenDaysStr
        } else if (dateFilter === 'Completed last 7 days') {
          return task.completion_date && task.completion_date >= sevenDaysAgoStr && task.completion_date <= todayStr
        } else if (dateFilter === 'No due date') {
          return !task.due_date
        }
        return true
      })
    }

    // Apply category filter
    if (categoryFilters.size > 0 && !categoryFilters.has('All')) {
      filtered = filtered.filter(task => {
        if (!task.category_id) return false
        return categoryFilters.has(task.category_id)
      })
    }

    return filtered
  }

  // Get task count for a specific status filter option
  const getStatusCount = (statusOption: string, baseTasks: any[]) => {
    let count = 0
    if (statusOption === 'Ongoing') {
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
    sevenDaysAgo.setDate(today.getDate() - 7)
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
    }
    return baseTasks.filter(t => t.category_id === categoryId).length
  }

  // Get base tasks for counting (apply other filters but not the one being counted)
  const getBaseTasksForStatusCount = (statusOption: string) => {
    let base = [...tasks]

    // Apply date filter
    if (dateFilter !== 'All') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      base = base.filter(task => {
        if (dateFilter === 'Today & overdue') {
          return task.due_date && task.due_date <= todayStr
        } else if (dateFilter === 'Next 7 days') {
          return task.due_date && task.due_date >= todayStr && task.due_date <= sevenDaysStr
        } else if (dateFilter === 'Completed last 7 days') {
          return task.completion_date && task.completion_date >= sevenDaysAgoStr && task.completion_date <= todayStr
        } else if (dateFilter === 'No due date') {
          return !task.due_date
        }
        return true
      })
    }

    // Apply category filter
    if (categoryFilters.size > 0 && !categoryFilters.has('All')) {
      base = base.filter(task => {
        if (!task.category_id) return false
        return categoryFilters.has(task.category_id)
      })
    }

    return base
  }

  const getBaseTasksForDateCount = (dateOption: string) => {
    let base = [...tasks]

    // Apply status filter
    if (statusFilters.size > 0) {
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

    // Apply category filter
    if (categoryFilters.size > 0 && !categoryFilters.has('All')) {
      base = base.filter(task => {
        if (!task.category_id) return false
        return categoryFilters.has(task.category_id)
      })
    }

    return base
  }

  const getBaseTasksForCategoryCount = (categoryId: string) => {
    let base = [...tasks]

    // Apply status filter
    if (statusFilters.size > 0) {
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

    // Apply date filter
    if (dateFilter !== 'All') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      base = base.filter(task => {
        if (dateFilter === 'Today & overdue') {
          return task.due_date && task.due_date <= todayStr
        } else if (dateFilter === 'Next 7 days') {
          return task.due_date && task.due_date >= todayStr && task.due_date <= sevenDaysStr
        } else if (dateFilter === 'Completed last 7 days') {
          return task.completion_date && task.completion_date >= sevenDaysAgoStr && task.completion_date <= todayStr
        } else if (dateFilter === 'No due date') {
          return !task.due_date
        }
        return true
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
      } else {
        // Sort by status
        const indexA = getStatusIndex(a.status)
        const indexB = getStatusIndex(b.status)
        return sortOrder === 'asc' ? indexA - indexB : indexB - indexA
      }
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
    if (newFilters.has(status)) {
      newFilters.delete(status)
    } else {
      newFilters.add(status)
    }
    setStatusFilters(newFilters)
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

  return (
    <div className="space-y-4">
      {/* Header */}
      {!selectedTask && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold" style={{ color: '#11551a' }}>My Tasks</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
              >
                Categories
              </button>
              <button
                onClick={handleAddTask}
                className="text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: '#f6d413' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c312')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
              >
                Add Task
              </button>
            </div>
          </div>
          
          {/* Mobile Status Tabs - Only visible on mobile */}
          <div className="md:hidden mb-3 pb-3 border-b overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {['Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped'].map(status => (
                <button
                  key={status}
                  onClick={() => setMobileStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-lg font-medium whitespace-nowrap transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                    mobileStatusFilter === status ? 'text-white shadow-md' : 'bg-gray-200 text-gray-700'
                  }`}
                  style={mobileStatusFilter === status ? { backgroundColor: '#11551a' } : {}}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Filters - Hidden on mobile */}
          <div className="hidden md:block space-y-3 mt-3">
            {/* Status Filter */}
            <div>
              <div className="flex flex-wrap gap-1.5">
                {['Ongoing', 'Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped'].map(status => {
                  const baseTasks = getBaseTasksForStatusCount(status)
                  const count = getStatusCount(status, baseTasks)
                  const isSelected = statusFilters.has(status)
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-gray-200 text-gray-700'
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
                  const isSelected = dateFilter === dateOption
                  return (
                    <button
                      key={dateOption}
                      onClick={() => setDateFilter(dateOption)}
                      className={`px-2.5 py-1 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-gray-200 text-gray-700'
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
                      ? 'text-white shadow-md'
                      : 'bg-gray-200 text-gray-700'
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
                          ? 'ring-2 ring-offset-2'
                          : ''
                      }`}
                      style={{ 
                        backgroundColor: category.color
                      }}
                    >
                      {category.name} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="hidden md:flex gap-3 items-center mt-3">
            <label className="text-lg font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due_date' | 'status')}
              className="px-2 py-1 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 cursor-pointer"
            >
              <option value="due_date">Due Date</option>
              <option value="status">Status</option>
            </select>
            <label className="text-lg font-medium text-gray-700">Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-2 py-1 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 cursor-pointer"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
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
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] p-3 cursor-pointer group"
                    style={{ minHeight: '120px', maxHeight: '120px' }}
                  >
                    <div className="flex items-start gap-2 h-full">
                      {/* Completion Checkbox */}
                      <input
                        type="checkbox"
                        checked={task.status === 'Complete'}
                        onChange={(e) => toggleComplete(task, e as any)}
                        className="w-5 h-5 mt-0.5 cursor-pointer flex-shrink-0 accent-green-600"
                        title={task.status === 'Complete' ? 'Mark as incomplete' : 'Mark as complete'}
                        style={{ accentColor: '#11551a' }}
                      />
                      
                      {/* Task Info */}
                      <div 
                        className="flex-1 flex flex-col overflow-hidden"
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className={`font-semibold text-base transition-colors ${
                                task.status === 'Complete' ? 'line-through text-gray-400' : 'text-gray-800 group-hover:text-green-700'
                              }`}>
                                {task.title}
                              </h4>
                              {(task.is_recurring === true || task.is_recurring === 'true') && (
                                <span className="text-base" title="Recurring task">🔁</span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {task.status}
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

          {/* Mobile: Single column with status filter */}
          <div className="md:hidden space-y-3">
            {sortedTasks.filter(task => task.status === mobileStatusFilter).map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-md active:shadow-xl transition-all duration-200 active:scale-[0.98] p-3 group"
                style={{ minHeight: '120px' }}
              >
                <div className="flex items-start gap-2 h-full">
                  {/* Completion Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.status === 'Complete'}
                    onChange={(e) => toggleComplete(task, e as any)}
                    className="w-6 h-6 mt-0.5 cursor-pointer flex-shrink-0"
                    title={task.status === 'Complete' ? 'Mark as incomplete' : 'Mark as complete'}
                    style={{ accentColor: '#11551a' }}
                  />
                  
                  {/* Task Info */}
                  <div 
                    className="flex-1 flex flex-col overflow-hidden"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`font-semibold text-lg ${
                            task.status === 'Complete' ? 'line-through text-gray-400' : 'text-gray-800'
                          }`}>
                            {task.title}
                          </h4>
                          {(task.is_recurring === true || task.is_recurring === 'true') && (
                            <span className="text-lg" title="Recurring task">🔁</span>
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

  // Update editedTask when task prop changes
  useEffect(() => {
    setEditedTask(task)
  }, [task])

  const handleSave = async () => {
    const success = await onUpdate(task.id, editedTask)
    if (success) {
      onClose() // Close the detail view after successful save
    }
  }

  const handleDelete = () => {
    if (task.id) {
      onDelete(task.id)
      onClose()
    }
  }

  const statuses = ['Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped']

  const isNewTask = task.id === null

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <h2 className="text-2xl font-bold" style={{ color: '#11551a' }}>{isNewTask ? 'New Task' : 'Task Details'}</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onShowCategories}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Categories
          </button>
          {!isNewTask && (
            <button
              onClick={handleDelete}
              className="text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: '#f56714' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e55d13')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f56714')}
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-600 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-white px-3 py-1.5 rounded-lg text-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: '#f6d413' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c312')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6d413')}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
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
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all"
          />
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
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
          </div>
          {editedTask.is_recurring && editedTask.recurring_frequency && (
            <div className="mt-2 text-base text-gray-600">
              <span 
                onClick={() => setShowRecurringModal(true)}
                className="cursor-pointer hover:underline"
              >
                Frequency: {getRecurringFrequencyLabel(editedTask.recurring_frequency)} (click to change)
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
          />
          <p className="text-lg text-gray-500 mt-1">
            Auto-filled when marked as Complete, but can be manually overridden
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
      <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full">
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
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 transition-all"
              />
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 transition-all cursor-pointer"
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
      <div className="bg-white rounded-xl shadow-2xl p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold" style={{ color: '#11551a' }}>Categories</h2>
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
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
                      className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
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

function JournalView() {
  const [entries, setEntries] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
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
  const supabase = createClient()

  useEffect(() => {
    loadJournalForDate(selectedDate)
    loadHabits()
    loadHabitGroups()
    loadCalibrations()
  }, [])

  useEffect(() => {
    loadJournalForDate(selectedDate)
    loadHabitCompletions(selectedDate)
    loadCalibrationScores(selectedDate)
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
    const habitsByGroup = new Map<string, any[]>()
    const ungroupedHabits: any[] = []

    habits.forEach(habit => {
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
    const orderedGroups = habitGroups.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
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

  const organizedHabits = getOrganizedHabits()

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold" style={{ color: '#11551a' }}>Daily Journal</h2>
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
      
      {/* Date Selector */}
      <div className="mb-5">
        <label className="block text-lg font-medium text-gray-700 mb-1">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]} // Can't select future dates
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
        />
        <p className="text-lg text-gray-600 mt-1.5">{formatDate(selectedDate)}</p>
      </div>

      {loading ? (
        <p className="text-gray-500 text-lg">Loading...</p>
      ) : (
        <>
          {/* Display Mode */}
          {!isEditing && content ? (
            <div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[300px] whitespace-pre-wrap text-lg">
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
                className="w-full h-72 p-3 border border-gray-300 rounded-lg resize-none text-lg focus:outline-none focus:ring-2 transition-all"
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
              <p className="text-gray-500 mb-4 text-lg">No journal entry for this date</p>
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
        </>
      )}

      {/* Habits and Calibration Section */}
      {(organizedHabits.length > 0 || calibrations.length > 0) && (
        <div className="mt-5 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Habits Section */}
            {organizedHabits.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#11551a' }}>Habits</h3>
                <div className="space-y-2.5">
                  {organizedHabits.map((item, index) => {
                    if (item.type === 'group') {
                      const { group, habits: groupHabits } = item.data
                      const groupCompleted = groupHabits.some((h: any) => habitCompletions.get(h.id))
                      return (
                        <div key={`group-${group.id}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
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
                                <input
                                  type="checkbox"
                                  checked={habitCompletions.get(habit.id) || false}
                                  onChange={(e) => toggleHabitCompletion(habit.id, e.target.checked)}
                                  className="w-4 h-4 cursor-pointer"
                                  style={{ accentColor: '#11551a' }}
                                />
                                <span className="text-lg">{habit.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    } else {
                      const habit = item.data
                      return (
                        <div key={habit.id} className="flex items-center gap-2 border border-gray-200 rounded-lg p-2.5 bg-white">
                          <input
                            type="checkbox"
                            checked={habitCompletions.get(habit.id) || false}
                            onChange={(e) => toggleHabitCompletion(habit.id, e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                            style={{ accentColor: '#11551a' }}
                          />
                          <span className="text-lg">{habit.name}</span>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            )}

            {/* Calibration Section */}
            {calibrations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#11551a' }}>Calibration</h3>
                <div className="space-y-2.5">
                  {calibrations.map(calibration => {
                    const currentScore = calibrationScores.get(calibration.id) || 0
                    return (
                      <div key={calibration.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-200 rounded-lg p-2.5 bg-white gap-2">
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
          </div>
        </div>
      )}

      {/* Habit Manager Modal */}
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

      {/* Calibration Manager Modal */}
      {showCalibrationManager && (
        <CalibrationManager
          calibrations={calibrations}
          onClose={() => {
            setShowCalibrationManager(false)
            loadCalibrations()
          }}
        />
      )}
    </div>
  )
}

function CalibrationManager({ calibrations: initialCalibrations, onClose }: any) {
  const [calibrations, setCalibrations] = useState(initialCalibrations)
  const [newCalibrationName, setNewCalibrationName] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const supabase = createClient()

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
      sort_order: maxSortOrder + 1
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold" style={{ color: '#11551a' }}>Calibration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer transition-colors"
          >
            ×
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
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
              {calibrations.map((cal: any, index: number) => (
                <div
                  key={cal.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <span className="text-gray-400 text-lg" title="Drag to reorder">☰</span>
                    <input
                      type="text"
                      value={cal.name}
                      onChange={(e) => updateCalibration(cal.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCalibration(cal.id)
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

function HabitManager({ habits: initialHabits, habitGroups: initialHabitGroups, onClose }: any) {
  const [habits, setHabits] = useState(initialHabits)
  const [habitGroups, setHabitGroups] = useState(initialHabitGroups)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitGroupName, setNewHabitGroupName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedType, setDraggedType] = useState<'habit' | 'group' | 'habit-in-group' | null>(null)
  const [draggedHabitInfo, setDraggedHabitInfo] = useState<{ habitId: string, groupId: string } | null>(null)
  const supabase = createClient()

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
      sort_order: maxSortOrder + 1
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
      sort_order: maxSortOrder + 1
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold" style={{ color: '#11551a' }}>Habits</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer transition-colors"
          >
            ×
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
            />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
            >
              <option value="">No group</option>
              {habitGroups.map((g: any) => (
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
              {organizedItems.map((item, index) => {
                if (item.type === 'group') {
                  const { group, habits: groupHabits } = item.data
                  return (
                    <div
                      key={`group-${group.id}`}
                      draggable
                      onDragStart={() => handleDragStart(index, 'group')}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 cursor-move transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5 flex-1">
                          <span className="text-gray-400 text-lg">☰</span>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateHabitGroup(group.id, { name: e.target.value })}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          />
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
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-move transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={habit.name}
                                onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHabit(habit.id)
                              }}
                              className="ml-2 text-lg font-medium transition-colors cursor-pointer"
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
                  return (
                    <div
                      key={habit.id}
                      draggable
                      onDragStart={() => handleDragStart(index, 'habit')}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <span className="text-gray-400 text-lg">☰</span>
                        <input
                          type="text"
                          value={habit.name}
                          onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHabit(habit.id)
                        }}
                        className="ml-3 text-lg font-medium transition-colors cursor-pointer"
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
    </div>
  )
}