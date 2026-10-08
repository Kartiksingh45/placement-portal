import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Send } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { ThemeToggle } from '../components/ThemeToggle'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await requestPasswordReset(email)
    setSubmitting(false)
    if (error) setError(error)
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <ThemeToggle className="fixed top-4 right-4 z-10" />
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-full">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-sm text-slate-400">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <p className="text-sm text-slate-300 text-center">
            If an account exists for <span className="text-slate-100">{email}</span>, a reset link
            has been sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending…' : 'Send reset link'}
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
