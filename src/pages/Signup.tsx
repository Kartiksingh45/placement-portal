import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { BRANCH_OPTIONS, YEAR_OPTIONS } from '../types/database'
import { ThemeToggle } from '../components/ThemeToggle'
import { Logo } from '../components/Logo'

export default function Signup() {
  const { user, profile, signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState<(typeof YEAR_OPTIONS)[number]>(1)
  const [branch, setBranch] = useState<(typeof BRANCH_OPTIONS)[number]>(BRANCH_OPTIONS[0])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (user) {
    return <Navigate to={profile?.role === 'tpo' ? '/tpo' : '/student'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signUp(email, password, fullName, {
      collegeName,
      rollNo,
      yearOfStudy,
      branch,
    })
    setSubmitting(false)
    if (error) {
      setError(error)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <ThemeToggle className="fixed top-4 right-4 z-10" />
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl text-center space-y-3">
          <h1 className="text-xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-slate-400">
            We sent a confirmation link to <span className="text-slate-200">{email}</span>. Confirm
            your address, then wait for your placement cell to approve your account before you can
            sign in.
          </p>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm inline-block">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <ThemeToggle className="fixed top-4 right-4 z-10" />
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo className="w-14 h-14" />
          <h1 className="text-xl font-bold tracking-tight">Create student account</h1>
          <p className="text-sm text-slate-400">UPATH</p>
          <p className="text-xs text-slate-500">University Placement And Transition Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm text-slate-300">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
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
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-slate-300">
              Password
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
            <label htmlFor="collegeName" className="text-sm text-slate-300">
              College name
            </label>
            <input
              id="collegeName"
              type="text"
              required
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rollNo" className="text-sm text-slate-300">
              College roll no.
            </label>
            <input
              id="rollNo"
              type="text"
              required
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="year" className="text-sm text-slate-300">
                Year
              </label>
              <select
                id="year"
                required
                value={yearOfStudy}
                onChange={(e) =>
                  setYearOfStudy(Number(e.target.value) as (typeof YEAR_OPTIONS)[number])
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="branch" className="text-sm text-slate-300">
                Branch
              </label>
              <select
                id="branch"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value as (typeof BRANCH_OPTIONS)[number])}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
