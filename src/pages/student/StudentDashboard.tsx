import { useEffect, useState } from 'react'
import { FileText, LayoutGrid, ListChecks, Mic, User, Video } from 'lucide-react'
import { PortalShell, type NavItem } from '../../components/PortalShell'
import { useAuth } from '../../contexts/auth-context'
import ResumeSection from './ResumeSection'
import DrivesSection from './DrivesSection'
import InterviewSection from './InterviewSection'
import MeetingsSection from './MeetingsSection'
import AnnouncementsList from './AnnouncementsList'
import { fetchStudentProfile } from '../../lib/resume'
import { countMyApplications } from '../../lib/stats'
import { fetchOpenDrives } from '../../lib/drives'
import type { StudentProfile } from '../../types/database'

const RESUME_STATUS_LABEL: Record<StudentProfile['resume_status'], string> = {
  not_uploaded: 'Not uploaded',
  processing: 'Processing…',
  parsed: 'Parsed',
  failed: 'Failed to parse',
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'drives', label: 'Drives', icon: ListChecks },
  { id: 'interviews', label: 'Mock Interviews', icon: Mic },
  { id: 'meetings', label: 'Meetings', icon: Video },
]

export default function StudentDashboard() {
  const [active, setActive] = useState('overview')
  const { profile, user } = useAuth()
  const [stats, setStats] = useState<{
    resumeStatus: StudentProfile['resume_status'] | null
    openDrives: number | null
    applications: number | null
  }>({ resumeStatus: null, openDrives: null, applications: null })

  useEffect(() => {
    if (!user) return
    Promise.all([fetchStudentProfile(user.id), fetchOpenDrives(), countMyApplications(user.id)])
      .then(([sp, drives, applications]) =>
        setStats({
          resumeStatus: sp?.resume_status ?? 'not_uploaded',
          openDrives: drives.length,
          applications,
        }),
      )
      .catch(() => {
        /* stats are non-critical */
      })
  }, [user])

  return (
    <PortalShell navItems={NAV_ITEMS} activeId={active} onSelect={setActive} roleLabel="Student">
      {active === 'overview' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome{profile ? `, ${profile.full_name}` : ''}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Here&apos;s a snapshot of your placement activity.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Resume status',
                value: stats.resumeStatus ? RESUME_STATUS_LABEL[stats.resumeStatus] : '—',
              },
              { label: 'Open drives', value: stats.openDrives ?? '—' },
              { label: 'Applications', value: stats.applications ?? '—' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-5"
              >
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <AnnouncementsList />
        </div>
      )}

      {active === 'profile' && (
        <div className="max-w-lg space-y-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-xs text-slate-400">Full name</p>
              <p className="text-sm">{profile?.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm">{profile?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Role</p>
              <p className="text-sm capitalize">{profile?.role || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {active === 'resume' && <ResumeSection />}
      {active === 'drives' && <DrivesSection />}
      {active === 'interviews' && <InterviewSection />}
      {active === 'meetings' && <MeetingsSection />}
    </PortalShell>
  )
}
