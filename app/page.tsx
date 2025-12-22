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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-3xl font-bold text-center">Welcome</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {authView === 'signin' && (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {authView === 'signup' && (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing up...' : 'Sign Up'}
                </button>
                <button
                  onClick={() => {
                    setAuthView('signin')
                    setError(null)
                    setSuccess(null)
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {authView === 'forgot' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Productivity & Wellness</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView('settings')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setView('tasks')}
            className={`px-6 py-2 rounded ${
              view === 'tasks' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setView('journal')}
            className={`px-6 py-2 rounded ${
              view === 'journal' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => setView('settings')}
            className={`px-6 py-2 rounded ${
              view === 'settings' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            Settings
          </button>
        </div>

        {view === 'tasks' ? <TasksView /> : view === 'journal' ? <JournalView /> : <SettingsView user={user} />}
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
    <div className="space-y-4">
      <p className="text-gray-600 text-center">
        Enter your new password below.
      </p>
      <input
        type="password"
        placeholder="New Password (min. 6 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <p className="text-red-600 text-sm">Passwords do not match</p>
      )}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-6">
        {/* User Info */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Account Information</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-gray-900">{user.email}</p>
          </div>
        </div>

        {/* Change Password */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password (min. 6 characters)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
              )}
            </div>
            
            <button
              onClick={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
    const allowedFields = ['title', 'status', 'category_id', 'description', 'due_date', 'is_hard_deadline', 'completion_date']
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
    await updateTask(task.id, {
      status: isComplete ? 'To do' : 'Complete',
      completion_date: isComplete ? null : new Date().toISOString().split('T')[0]
    })
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
    <div className="space-y-6">
      {/* Header */}
      {!selectedTask && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">My Tasks</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Categories
              </button>
              <button
                onClick={handleAddTask}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Task
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="space-y-4 mt-4 pb-4 border-b">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {['Ongoing', 'Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped'].map(status => {
                  const baseTasks = getBaseTasksForStatusCount(status)
                  const count = getStatusCount(status, baseTasks)
                  const isSelected = statusFilters.has(status)
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-3 py-1 rounded text-sm ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {status} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Today & overdue', 'Next 7 days', 'Completed last 7 days', 'No due date'].map(dateOption => {
                  const baseTasks = getBaseTasksForDateCount(dateOption)
                  const count = getDateCount(dateOption, baseTasks)
                  const isSelected = dateFilter === dateOption
                  return (
                    <button
                      key={dateOption}
                      onClick={() => setDateFilter(dateOption)}
                      className={`px-3 py-1 rounded text-sm ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {dateOption} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleCategoryFilter('All')}
                  className={`px-3 py-1 rounded text-sm ${
                    categoryFilters.has('All')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
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
                      className={`px-3 py-1 rounded text-sm text-white ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : ''
                      }`}
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex gap-4 items-center mt-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due_date' | 'status')}
              className="px-3 py-2 border rounded"
            >
              <option value="due_date">Due Date</option>
              <option value="status">Status</option>
            </select>
            <label className="text-sm font-medium text-gray-700">Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border rounded"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      )}

      {/* Three Column Layout */}
      {!selectedTask ? (
        <div className="grid grid-cols-3 gap-4">
          {columns.map((columnTasks, colIndex) => (
            <div key={colIndex} className="bg-white rounded-lg shadow p-4">
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded p-3 hover:bg-gray-50 h-32 flex flex-col"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      {/* Completion Checkbox */}
                      <input
                        type="checkbox"
                        checked={task.status === 'Complete'}
                        onChange={(e) => toggleComplete(task, e as any)}
                        className="w-5 h-5 mt-0.5 cursor-pointer flex-shrink-0"
                        title={task.status === 'Complete' ? 'Mark as incomplete' : 'Mark as complete'}
                      />
                      
                      {/* Task Info */}
                      <div 
                        className="flex-1 cursor-pointer flex flex-col"
                        onClick={() => setSelectedTask(task)}
                      >
                        <h4 className={`font-medium text-blue-600 hover:text-blue-800 ${
                          task.status === 'Complete' ? 'line-through' : ''
                        }`}>
                          {task.title}
                        </h4>
                        <div className="mt-1 text-xs text-gray-500">
                          {task.status}
                        </div>
                        {task.categories && (
                          <div className="mt-2">
                            <span
                              className="inline-block px-2 py-1 rounded text-xs text-white"
                              style={{ backgroundColor: task.categories.color }}
                            >
                              {task.categories.name}
                            </span>
                          </div>
                        )}
                        <div className="mt-auto">
                          {task.due_date && (
                            <p className="text-xs text-gray-600">
                              Due: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                              {task.is_hard_deadline && ' ⚠️'}
                            </p>
                          )}
                          {task.completion_date && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Completed: {new Date(task.completion_date + 'T00:00:00').toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold">{isNewTask ? 'New Task' : 'Task Details'}</h2>
        <div className="flex gap-2">
          <button
            onClick={onShowCategories}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Categories
          </button>
          {!isNewTask && (
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={editedTask.status}
            onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={editedTask.category_id || ''}
            onChange={(e) => setEditedTask({ ...editedTask, category_id: e.target.value || null })}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="">No category</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description / Notes
          </label>
          <textarea
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            placeholder="Add notes about this task..."
            className="w-full h-32 px-4 py-2 border rounded resize-none"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="date"
              value={editedTask.due_date || ''}
              onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
              className="px-4 py-2 border rounded"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedTask.is_hard_deadline || false}
                onChange={(e) => setEditedTask({ ...editedTask, is_hard_deadline: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Hard deadline</span>
            </label>
          </div>
        </div>

        {/* Completion Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completion Date
          </label>
          <input
            type="date"
            value={editedTask.completion_date || ''}
            onChange={(e) => setEditedTask({ ...editedTask, completion_date: e.target.value })}
            className="px-4 py-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-filled when marked as Complete, but can be manually overridden
          </p>
        </div>

      </div>
    </div>
  )
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Add Category */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">Add New Category</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1 px-4 py-2 border rounded"
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-16 h-10 border rounded cursor-pointer"
              title="Pick category color"
            />
            <button
              onClick={addCategory}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        {/* Category List */}
        <div>
          <h3 className="font-bold mb-3">Existing Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No categories yet. Add one above!</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat: any, index: number) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-move"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400 text-lg" title="Drag to reorder">☰</span>
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Change color"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCategory(cat.id)
                    }}
                    className="ml-4 text-red-500 hover:text-red-700 px-3 py-1"
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Daily Journal</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHabitManager(true)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Habits
          </button>
          <button
            onClick={() => setShowCalibrationManager(true)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Calibration
          </button>
        </div>
      </div>
      
      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]} // Can't select future dates
          className="px-4 py-2 border rounded"
        />
        <p className="text-sm text-gray-600 mt-2">{formatDate(selectedDate)}</p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Display Mode */}
          {!isEditing && content ? (
            <div>
              <div className="bg-gray-50 p-4 rounded border min-h-[384px] whitespace-pre-wrap">
                {content}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
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
                className="w-full h-96 p-4 border rounded resize-none"
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-3">
                  <button
                    onClick={saveJournal}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                  >
                    Save Entry
                  </button>
                  {!isEditing && content && (
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {saved && <span className="text-green-600 font-medium">Saved!</span>}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isEditing && !content && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No journal entry for this date</p>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Write Entry
              </button>
            </div>
          )}
        </>
      )}

      {/* Habits Section */}
      {organizedHabits.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-bold mb-4">Habits</h3>
          <div className="space-y-4">
            {organizedHabits.map((item, index) => {
              if (item.type === 'group') {
                const { group, habits: groupHabits } = item.data
                const groupCompleted = groupHabits.some((h: any) => habitCompletions.get(h.id))
                return (
                  <div key={`group-${group.id}`} className="border rounded p-4">
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
                        className="w-5 h-5"
                      />
                      <span className="font-medium">
                        {group.name}
                      </span>
                    </div>
                    <div className="ml-7 space-y-2">
                      {groupHabits.map((habit: any) => (
                        <div key={habit.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={habitCompletions.get(habit.id) || false}
                            onChange={(e) => toggleHabitCompletion(habit.id, e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span>{habit.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              } else {
                const habit = item.data
                return (
                  <div key={habit.id} className="flex items-center gap-2 border rounded p-3">
                    <input
                      type="checkbox"
                      checked={habitCompletions.get(habit.id) || false}
                      onChange={(e) => toggleHabitCompletion(habit.id, e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>{habit.name}</span>
                  </div>
                )
              }
            })}
          </div>
        </div>
      )}

      {/* Calibration Section */}
      {calibrations.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-bold mb-4">Calibration</h3>
          <div className="space-y-3">
            {calibrations.map(calibration => {
              const currentScore = calibrationScores.get(calibration.id) || 0
              return (
                <div key={calibration.id} className="flex items-center justify-between border rounded p-3">
                  <span className="font-medium">
                    {calibration.name}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => setCalibrationScore(calibration.id, score)}
                        className={`w-10 h-10 rounded ${
                          currentScore === score
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Calibration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-3">Add New Calibration</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Calibration name"
              value={newCalibrationName}
              onChange={(e) => setNewCalibrationName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCalibration()}
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={addCalibration}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">Existing Calibrations</h3>
          {calibrations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No calibrations yet. Add one above!</p>
          ) : (
            <div className="space-y-2">
              {calibrations.map((cal: any, index: number) => (
                <div
                  key={cal.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-move"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400 text-lg" title="Drag to reorder">☰</span>
                    <input
                      type="text"
                      value={cal.name}
                      onChange={(e) => updateCalibration(cal.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCalibration(cal.id)
                    }}
                    className="ml-4 text-red-500 hover:text-red-700 px-3 py-1"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Habits</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-3">Add New Habit Group</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Group name"
              value={newHabitGroupName}
              onChange={(e) => setNewHabitGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabitGroup()}
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={addHabitGroup}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Group
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-3">Add New Habit</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Habit name"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              className="flex-1 px-4 py-2 border rounded"
            />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">No group</option>
              {habitGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={addHabit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">Existing Habits & Groups</h3>
          {organizedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No habits yet. Add one above!</p>
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
                      className="border rounded p-3 hover:bg-gray-50 cursor-move"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-gray-400 text-lg">☰</span>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateHabitGroup(group.id, { name: e.target.value })}
                            className="flex-1 px-2 py-1 border rounded font-medium"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteHabitGroup(group.id)
                          }}
                          className="ml-4 text-red-500 hover:text-red-700 px-3 py-1"
                        >
                          Delete Group
                        </button>
                      </div>
                      <div className="ml-11 space-y-2">
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
                            className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-move"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="text"
                                value={habit.name}
                                onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                                className="flex-1 px-2 py-1 border rounded text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHabit(habit.id)
                              }}
                              className="ml-4 text-red-500 hover:text-red-700 px-2 py-1 text-sm"
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
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-move"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-gray-400 text-lg">☰</span>
                        <input
                          type="text"
                          value={habit.name}
                          onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                          className="flex-1 px-2 py-1 border rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHabit(habit.id)
                        }}
                        className="ml-4 text-red-500 hover:text-red-700 px-3 py-1"
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