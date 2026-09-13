import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  fetchApplicationsForDrive,
  updateApplicationStatus,
  type ApplicationWithStudent,
} from '../../lib/applications'
import type { Application } from '../../types/database'

const STATUS_OPTIONS: Application['status'][] = ['applied', 'shortlisted', 'selected', 'rejected']

const STATUS_STYLE: Record<Application['status'], string> = {
  applied: 'bg-slate-700 text-slate-300',
  shortlisted: 'bg-amber-500/20 text-amber-300',
  rejected: 'bg-red-500/20 text-red-300',
  selected: 'bg-emerald-500/20 text-emerald-300',
}

export default function ApplicantList({ driveId }: { driveId: string }) {
  const [applications, setApplications] = useState<ApplicationWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    fetchApplicationsForDrive(driveId)
      .then(setApplications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load applicants'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveId])

  async function handleStatusChange(id: string, status: Application['status']) {
    try {
      await updateApplicationStatus(id, status)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading applicants…</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (applications.length === 0) {
    return <p className="text-sm text-slate-500">No applicants yet.</p>
  }

  return (
    <div className="space-y-2">
      {applications.map((app) => (
        <div
          key={app.id}
          className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm truncate">{app.profiles?.full_name ?? 'Unknown student'}</p>
            <p className="text-xs text-slate-500 truncate">{app.profiles?.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-600/20 text-blue-300">
              {app.match_score ?? 0}% match
            </span>
            <select
              value={app.status}
              onChange={(e) =>
                handleStatusChange(app.id, e.target.value as Application['status'])
              }
              className={clsx(
                'text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer',
                STATUS_STYLE[app.status],
              )}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-slate-800 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
