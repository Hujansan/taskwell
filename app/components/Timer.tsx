'use client'

import { useState, useEffect, useRef } from 'react'

interface Timer {
  id: string
  title: string
  duration: number // in seconds
  remaining: number // in seconds
  isRunning: boolean
  isCountDown: boolean
  elapsed: number // for count up timers
}

export default function Timer() {
  const [isOpen, setIsOpen] = useState(false)
  const [timers, setTimers] = useState<Timer[]>([])
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const popupRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const anyRunning = timers.some(t => t.isRunning)

  // Timer tick effect
  useEffect(() => {
    if (timers.some(t => t.isRunning)) {
      intervalRef.current = setInterval(() => {
        setTimers(prevTimers => {
          const updatedTimers = prevTimers.map(timer => {
            if (!timer.isRunning) return timer

            if (timer.isCountDown) {
              const newRemaining = timer.remaining - 1
              if (newRemaining <= 0) {
                // Timer reached zero - show alert
                if (timer.remaining > 0) { // Only alert once
                  alert(`Timer "${timer.title}" has reached zero!`)
                }
                return { ...timer, remaining: 0, isRunning: false }
              }
              return { ...timer, remaining: newRemaining }
            } else {
              // Count up timer
              return { ...timer, elapsed: timer.elapsed + 1 }
            }
          })
          return updatedTimers
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timers])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const addTimer = () => {
    const newTimer: Timer = {
      id: Date.now().toString(),
      title: `Timer ${timers.length + 1}`,
      duration: 0,
      remaining: 0,
      isRunning: false,
      isCountDown: true,
      elapsed: 0
    }
    setTimers([...timers, newTimer])
  }

  const deleteTimer = (id: string) => {
    setTimers(timers.filter(t => t.id !== id))
  }

  const toggleTimer = (id: string) => {
    setTimers(timers.map(t => {
      if (t.id === id) {
        return { ...t, isRunning: !t.isRunning }
      }
      return t
    }))
  }

  const resetTimer = (id: string) => {
    setTimers(timers.map(t => {
      if (t.id === id) {
        if (t.isCountDown) {
          return { ...t, remaining: t.duration, isRunning: false, elapsed: 0 }
        } else {
          return { ...t, elapsed: 0, isRunning: false }
        }
      }
      return t
    }))
  }

  const updateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(timers.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates }
        // If duration changed and it's a countdown timer, update remaining
        if (updates.duration !== undefined && updated.isCountDown) {
          updated.remaining = updates.duration
        }
        return updated
      }
      return t
    }))
  }

  const parseTimeInput = (input: string): number => {
    // Parse formats like "1:30", "90", "1:30:00"
    const parts = input.split(':').map(Number)
    if (parts.length === 1) {
      return parts[0] || 0
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  return (
    <>
      <style jsx>{`
        @keyframes timerSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Timer Button - Always visible in bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-4 shadow-lg transition-transform hover:scale-110 text-white"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 2147483647,
          backgroundColor: '#f56714',
          pointerEvents: 'auto',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e55d13')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f56714')}
        title="Timer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          {/* Clock outline */}
          <circle cx="12" cy="12" r="9" strokeWidth={2} />

          {/* Hands (animate when any timer is running) */}
          <g
            style={{
              transformOrigin: '12px 12px',
              animation: anyRunning ? 'timerSpin 2s linear infinite' : 'none',
            }}
          >
            {/* minute hand */}
            <line x1="12" y1="12" x2="12" y2="6.5" strokeWidth={2} strokeLinecap="round" />
            {/* hour hand */}
            <line x1="12" y1="12" x2="15.5" y2="12" strokeWidth={2} strokeLinecap="round" opacity="0.9" />
          </g>

          {/* center cap */}
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {/* Timer Pop-up */}
      {isOpen && (
        <div
          ref={popupRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[400px] max-w-[500px]"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 2147483646,
            cursor: isDragging ? 'grabbing' : 'default',
            pointerEvents: 'auto',
          }}
        >
          {/* Draggable Header */}
          <div
            className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Timers</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Timer List */}
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {timers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No timers yet. Click &quot;Add Timer&quot; to create one.
              </p>
            ) : (
              <div className="space-y-4">
                {timers.map((timer) => (
                  <div
                    key={timer.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                  >
                    {/* Timer Title */}
                    <input
                      type="text"
                      value={timer.title}
                      onChange={(e) => updateTimer(timer.id, { title: e.target.value })}
                      className="w-full mb-3 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Timer title"
                    />

                    {/* Timer Type Toggle */}
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Type:</label>
                      <button
                        onClick={() => updateTimer(timer.id, { isCountDown: true, remaining: timer.duration, elapsed: 0 })}
                        className={`px-3 py-1 rounded text-sm ${
                          timer.isCountDown
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Count Down
                      </button>
                      <button
                        onClick={() => updateTimer(timer.id, { isCountDown: false, elapsed: 0 })}
                        className={`px-3 py-1 rounded text-sm ${
                          !timer.isCountDown
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Count Up
                      </button>
                    </div>

                    {/* Timer Duration Input (for countdown) */}
                    {timer.isCountDown && (
                      <div className="mb-3">
                        <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                          Duration (mm:ss or hh:mm:ss):
                        </label>
                        <input
                          type="text"
                          value={formatTime(timer.duration)}
                          onChange={(e) => {
                            const seconds = parseTimeInput(e.target.value)
                            updateTimer(timer.id, { duration: seconds, remaining: seconds })
                          }}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="00:00"
                          disabled={timer.isRunning}
                        />
                      </div>
                    )}

                    {/* Timer Display */}
                    <div className="text-center mb-3">
                      <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                        {timer.isCountDown
                          ? formatTime(timer.remaining)
                          : formatTime(timer.elapsed)}
                      </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => toggleTimer(timer.id)}
                        className={`px-4 py-2 rounded font-medium ${
                          timer.isRunning
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {timer.isRunning ? 'Pause' : 'Start'}
                      </button>
                      <button
                        onClick={() => resetTimer(timer.id)}
                        className="px-4 py-2 rounded font-medium bg-gray-500 hover:bg-gray-600 text-white"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => deleteTimer(timer.id)}
                        className="px-4 py-2 rounded font-medium bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Timer Button */}
            <button
              onClick={addTimer}
              className="w-full mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              + Add Timer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
