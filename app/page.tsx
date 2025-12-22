'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'tasks' | 'journal'>('tasks')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Check your email for the confirmation link!')
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-3xl font-bold text-center">Welcome</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            />
            <div className="flex gap-4">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Productivity & Wellness</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
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
        </div>

        {view === 'tasks' ? <TasksView /> : <JournalView />}
      </div>
    </div>
  )
}

function TasksView() {
  const [tasks, setTasks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
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

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('tasks')
      .insert({ 
        title: newTaskTitle,
        user_id: user?.id,
        status: 'To do'
      })
    
    if (error) {
      console.error('Error adding task:', error)
      alert('Error: ' + error.message)
    } else {
      setNewTaskTitle('')
      loadTasks()
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    loadTasks()
    if (selectedTask?.id === id) setSelectedTask(null)
  }

  const updateTask = async (id: string, updates: any) => {
    // Auto-set completion date when status changes to Complete
    if (updates.status === 'Complete' && !updates.completion_date) {
      updates.completion_date = new Date().toISOString().split('T')[0]
    }
    
    // Clear completion date if status is not Complete
    if (updates.status !== 'Complete') {
      updates.completion_date = null
    }
  
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      console.error('Full error:', JSON.stringify(error, null, 2))
      alert('Error: ' + (error.message || 'Failed to update task'))
    } else {
      loadTasks() // This reloads all tasks with categories
      
      // If detail view is open, reload that specific task
      if (selectedTask?.id === id) {
        const { data: updatedTask } = await supabase
          .from('tasks')
          .select('*, categories(*)')
          .eq('id', id)
          .single()
        if (updatedTask) setSelectedTask(updatedTask)
      }
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

  const getTasksByStatus = () => {
    const statuses = ['Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped']
    return statuses.map(status => ({
      status,
      tasks: tasks.filter(t => t.status === status)
    }))
  }

  const groupedTasks = getTasksByStatus()

  return (
    <div className="space-y-6">
      {/* Header with Add Task */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">My Tasks</h2>
          <button
            onClick={() => setShowCategoryManager(true)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Manage Categories
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={addTask}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Three Column Layout */}
      {!selectedTask ? (
        <div className="grid grid-cols-3 gap-4">
          {groupedTasks.map(({ status, tasks: statusTasks }) => (
            <div key={status} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-lg mb-3 pb-2 border-b">
                {status} ({statusTasks.length})
              </h3>
              <div className="space-y-2">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-2">
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
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <h4 className={`font-medium text-blue-600 hover:text-blue-800 ${
                          task.status === 'Complete' ? 'line-through' : ''
                        }`}>
                          {task.title}
                        </h4>
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
                        {task.due_date && (
                          <p className="text-xs text-gray-600 mt-2">
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
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => {
            setShowCategoryManager(false)
            loadCategories()
          }}
        />
      )}
    </div>
  )
}

function TaskDetailView({ task, categories, onClose, onUpdate, onDelete }: any) {
  const [editedTask, setEditedTask] = useState(task)

  const handleSave = () => {
    onUpdate(task.id, editedTask)
  }

  const statuses = ['Concept', 'To do', 'In progress', 'Waiting', 'On hold', 'Complete', 'Dropped']

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold">Task Details</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
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

        {/* Delete Button */}
        <div className="pt-4 border-t">
          <button
            onClick={() => onDelete(task.id)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoryManager({ categories, onClose }: any) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const supabase = createClient()

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('categories').insert({
      name: newCategoryName,
      color: newCategoryColor,
      user_id: user?.id,
      sort_order: categories.length
    })
    
    if (error) {
      alert('Error adding category: ' + error.message)
    } else {
      setNewCategoryName('')
      window.location.reload()
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Tasks using it will be uncategorized.')) return
    
    const { error } = await supabase.from('categories').delete().eq('id', id)
    
    if (error) {
      alert('Error deleting category: ' + error.message)
    } else {
      window.location.reload()
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
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Categories</h2>
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
              {categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Change color"
                    />
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded"
                    />
                  </div>
                  <button
                    onClick={() => deleteCategory(cat.id)}
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
  const supabase = createClient()

  useEffect(() => {
    loadJournalForDate(selectedDate)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Daily Journal</h2>
      
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
    </div>
  )
}