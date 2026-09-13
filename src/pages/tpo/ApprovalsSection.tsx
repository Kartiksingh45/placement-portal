import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { fetchAllStudents, setStudentStatus, type StudentDirectoryEntry } from '../../lib/students'

export default function ApprovalsSection() {
  const [entries, setEntries] = useState<StudentDirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchAllStudents()
      .then((data) => {
        if (active) setEntries(data.filter(({ profile }) => profile.status === 'pending'))
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load students')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function decide(studentId: string, status: 'approved' | 'rejected') {
    setBusyId(studentId)
    try {
      await setStudentStatus(studentId, status)
      setEntries((prev) => prev.filter(({ profile }) => profile.id !== studentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending approvals</h1>
        <p className="text-slate-400 text-sm mt-1">
          {entries.length} student{entries.length === 1 ? '' : 's'} awaiting verification.
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700 overflow-hidden">
        {entries.length === 0 && (
          <p className="text-sm text-slate-400 p-5">No pending sign-ups.</p>
        )}

        {entries.map(({ profile, studentProfile }) => (
          <div key={profile.id} className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                {[
                  studentProfile?.college_name,
                  studentProfile?.roll_no && `Roll no. ${studentProfile.roll_no}`,
                  studentProfile?.year_of_study && `Year ${studentProfile.year_of_study}`,
                  studentProfile?.branch,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => void decide(profile.id, 'approved')}
                disabled={busyId === profile.id}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => void decide(profile.id, 'rejected')}
                disabled={busyId === profile.id}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
