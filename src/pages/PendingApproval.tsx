import { Clock, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import type { ProfileStatus } from '../types/database'

export default function PendingApproval({ status }: { status: ProfileStatus }) {
  const { signOut } = useAuth()
  const rejected = status === 'rejected'

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div
          className={`mx-auto w-fit p-3 rounded-full ${
            rejected ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'
          }`}
        >
          {rejected ? <XCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          {rejected ? 'Account not approved' : 'Awaiting approval'}
        </h1>
        <p className="text-sm text-slate-400">
          {rejected
            ? 'Your placement cell did not approve this account. Contact your TPO if you believe this is a mistake.'
            : 'Your account details are being verified by your placement cell. You will be able to sign in once a TPO approves your account.'}
        </p>
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
