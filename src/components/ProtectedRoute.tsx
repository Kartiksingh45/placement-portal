import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import type { UserRole } from '../types/database'
import PendingApproval from '../pages/PendingApproval'

export function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: ReactNode
  allowedRole: UserRole
}) {
  const { user, profile, profileError, loading, signOut } = useAuth()

  if (loading || (user && !profile && !profileError)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile && profileError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <h1 className="text-xl font-bold tracking-tight">Couldn&apos;t load your account</h1>
          <p className="text-sm text-slate-400">{profileError}</p>
          <button
            onClick={() => void signOut()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (profile && profile.role !== allowedRole) {
    return <Navigate to={profile.role === 'tpo' ? '/tpo' : '/student'} replace />
  }

  if (profile && profile.status !== 'approved') {
    return <PendingApproval status={profile.status} />
  }

  return <>{children}</>
}
