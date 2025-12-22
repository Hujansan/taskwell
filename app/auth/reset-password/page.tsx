'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isValidToken, setIsValidToken] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid password recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true)
      } else {
        // Check URL hash for recovery token
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')
        
        if (accessToken && type === 'recovery') {
          setIsValidToken(true)
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.')
        }
      }
    })

    // Listen for auth state changes (including password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsValidToken(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleResetPassword = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated successfully! Redirecting to sign in...')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
    setLoading(false)
  }

  if (!isValidToken && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-center">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Reset Password</h2>
        
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

        {isValidToken && !success && (
          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              Enter your new password below.
            </p>
            <input
              type="password"
              placeholder="New Password (min. 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-600 text-sm">Passwords do not match</p>
            )}
            <button
              onClick={handleResetPassword}
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

