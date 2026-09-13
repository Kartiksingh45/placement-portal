import { Link, Navigate } from 'react-router-dom'
import { Briefcase, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to={profile?.role === 'tpo' ? '/tpo' : '/student'} replace />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-full">
            <Briefcase className="w-10 h-10" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Campus Placement Portal</h1>
        <p className="text-sm text-slate-400">
          Resume screening, eligibility filtering, and AI mock interviews for students and
          placement officers.
        </p>
        <Link
          to="/login"
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Get Started
        </Link>
      </div>
    </div>
  )
}
