import { useEffect, useState } from 'react'
import {
  ArrowDownWideNarrow,
  Building2,
  LayoutGrid,
  ListChecks,
  Megaphone,
  ShieldCheck,
  Table,
  UserCog,
  Users,
  Video,
} from 'lucide-react'
import { PortalShell, type NavItem } from '../../components/PortalShell'
import { useAuth } from '../../contexts/auth-context'
import StudentsSection from './StudentsSection'
import CompaniesSection from './CompaniesSection'
import DrivesSection from './DrivesSection'
import ApprovalsSection from './ApprovalsSection'
import ArrangeStudentsSection from './ArrangeStudentsSection'
import StudentRecordsSection from './StudentRecordsSection'
import MeetingsSection from './MeetingsSection'
import OfficersSection from './OfficersSection'
import JobOpportunitiesSection from './JobOpportunitiesSection'
import AnnouncementComposer from './AnnouncementComposer'
import { countActiveDrives, countAllApplications, countStudents } from '../../lib/stats'
import { fetchAllStudents } from '../../lib/students'

export default function TpoDashboard() {
  const [active, setActive] = useState('overview')
  const { profile } = useAuth()
  const [stats, setStats] = useState<{
    students: number | null
    drives: number | null
    applications: number | null
  }>({ students: null, drives: null, applications: null })
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    Promise.all([countStudents(), countActiveDrives(), countAllApplications()])
      .then(([students, drives, applications]) => setStats({ students, drives, applications }))
      .catch(() => {
        /* stats are non-critical */
      })
  }, [])

  useEffect(() => {
    fetchAllStudents()
      .then((entries) =>
        setPendingCount(entries.filter(({ profile }) => profile.status === 'pending').length),
      )
      .catch(() => {
        /* badge count is non-critical */
      })
  }, [active])

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingCount },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'records', label: 'Student Records', icon: Table },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'drives', label: 'Drives & Applications', icon: ListChecks },
    { id: 'arrange', label: 'Arrange Students', icon: ArrowDownWideNarrow },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'officers', label: 'Placement Officers', icon: UserCog },
    { id: 'jobs', label: 'Job Opportunities', icon: Megaphone },
  ]

  return (
    <PortalShell
      navItems={navItems}
      activeId={active}
      onSelect={setActive}
      roleLabel="Placement Officer"
    >
      {active === 'overview' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome{profile ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Placement cell activity at a glance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Registered students', value: stats.students ?? '—' },
              { label: 'Active drives', value: stats.drives ?? '—' },
              { label: 'Applications received', value: stats.applications ?? '—' },
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

          <AnnouncementComposer />
        </div>
      )}

      {active === 'approvals' && <ApprovalsSection />}
      {active === 'students' && <StudentsSection />}
      {active === 'records' && <StudentRecordsSection />}
      {active === 'companies' && <CompaniesSection />}
      {active === 'drives' && <DrivesSection />}
      {active === 'arrange' && <ArrangeStudentsSection />}
      {active === 'meetings' && <MeetingsSection />}
      {active === 'officers' && <OfficersSection />}
      {active === 'jobs' && <JobOpportunitiesSection />}
    </PortalShell>
  )
}
