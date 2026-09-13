import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Megaphone } from 'lucide-react'
import { fetchAnnouncements } from '../../lib/announcements'
import type { Announcement } from '../../types/database'

export default function AnnouncementsList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => {
        /* non-critical */
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || announcements.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <Megaphone className="w-4 h-4" />
        Updates
      </h2>
      {announcements.map((a) => (
        <div
          key={a.id}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm space-y-1"
        >
          <p>{a.message}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={clsx(
                'px-2 py-0.5 rounded-full',
                a.target_type === 'all'
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'bg-emerald-500/20 text-emerald-300',
              )}
            >
              {a.target_type === 'all' ? 'Org-wide' : 'Just for you'}
            </span>
            <span>{new Date(a.created_at).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
