import { useEffect, useState } from 'react'
import { ExternalLink, Video } from 'lucide-react'
import clsx from 'clsx'
import { fetchMeetings } from '../../lib/meetings'
import { fetchCompanies } from '../../lib/companies'
import type { Company, Meeting } from '../../types/database'

export default function MeetingsSection() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) setNowMs(Date.now())
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([fetchMeetings(), fetchCompanies()])
      .then(([meetingList, companyList]) => {
        if (!active) return
        setMeetings(meetingList.filter((m) => m.status === 'scheduled'))
        setCompanies(companyList)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load meetings')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? 'Company'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meetings</h1>
        <p className="text-slate-400 text-sm mt-1">Scheduled HR calls you&apos;re invited to.</p>
      </div>

      {meetings.length === 0 ? (
        <p className="text-sm text-slate-400">No meetings scheduled yet.</p>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700 overflow-hidden">
          {meetings.map((m) => {
            const upcoming = nowMs !== null && new Date(m.scheduled_at).getTime() > nowMs
            return (
              <div key={m.id} className="p-5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{m.title}</p>
                  <span
                    className={clsx(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      upcoming ? 'bg-blue-600/20 text-blue-300' : 'bg-slate-700 text-slate-300',
                    )}
                  >
                    {upcoming ? 'Upcoming' : 'Past'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {companyName(m.company_id)} · {new Date(m.scheduled_at).toLocaleString()} ·{' '}
                  {m.duration_minutes} min
                </p>
                {m.hr_name && <p className="text-xs text-slate-400">HR: {m.hr_name}</p>}
                {m.meet_link && (
                  <a
                    href={m.meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Google Meet
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
