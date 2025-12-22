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
  const [newTask, setNewTask] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user?.id)
    
    // Try to insert with explicit user_id
    const { data, error } = await supabase
      .from('tasks')
      .insert({ 
        title: newTask,
        user_id: user?.id 
      })
      .select()
    
    if (error) {
      console.error('Error adding task:', error)
      alert('Error: ' + error.message)
    } else {
      console.log('Task added successfully:', data)
    }
    
    setNewTask('')
    loadTasks()
  }

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from('tasks').update({ completed: !completed }).eq('id', id)
    loadTasks()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    loadTasks()
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 p-3 border rounded">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id, task.completed)}
              className="w-5 h-5"
            />
            <span className={task.completed ? 'line-through flex-1' : 'flex-1'}>
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function JournalView() {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTodayJournal()
  }, [])

  const loadTodayJournal = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('journals')
      .select('*')
      .eq('date', today)
      .single()
    if (data) setContent(data.content)
  }

  const saveJournal = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('journals')
      .upsert(
        {
          date: today,
          content,
          user_id: user?.id
        },
        {
          onConflict: 'user_id,date'
        }
      )
      .select()
    
    if (error) {
      console.error('Error saving journal:', error)
      alert('Error: ' + error.message)
    } else {
      console.log('Journal saved successfully:', data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Today's Journal</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write about your day..."
        className="w-full h-96 p-4 border rounded resize-none"
      />
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={saveJournal}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Save Journal
        </button>
        {saved && <span className="text-green-600">Saved!</span>}
      </div>
    </div>
  )
}