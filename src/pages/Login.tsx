import { Link, Navigate, useLocation } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { SignInForm } from '../components/SignInForm'
import { ThemeToggle } from '../components/ThemeToggle'

export default function Login() {
  const { user, profile } = useAuth()
  const location = useLocation()

  if (user) {
    const fallback = profile?.role === 'tpo' ? '/tpo' : '/student'
    return <Navigate to={(location.state as { from?: string } | null)?.from ?? fallback} replace />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <ThemeToggle className="fixed top-4 right-4 z-10" />
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-full">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
          <p className="text-sm text-slate-400">Campus Placement Portal</p>
        </div>

        <SignInForm />

        <p className="text-sm text-slate-400 text-center">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
