import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { ThemeToggle } from '../components/ThemeToggle'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) {
      setError(error)
    } else {
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <ThemeToggle className="fixed top-4 right-4 z-10" />
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-full">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Set a new password</h1>
          <p className="text-sm text-slate-400">
            Follow the link in your email to get here, then choose a new password.
          </p>
        </div>

        {done ? (
          <p className="text-sm text-slate-300 text-center">
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm text-slate-300">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm text-slate-300">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-400 text-center">
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
