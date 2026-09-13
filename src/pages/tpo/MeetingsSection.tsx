import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarPlus, Copy, ExternalLink, Search, Video, X } from 'lucide-react'
import clsx from 'clsx'
import { fetchCompanies } from '../../lib/companies'
import { fetchAllStudents, type StudentDirectoryEntry } from '../../lib/students'
import {
  buildGoogleAuthUrl,
  fetchGoogleConnection,
  isGoogleCalendarConfigured,
} from '../../lib/googleCalendar'
import { cancelMeeting, createMeeting, fetchMeetings } from '../../lib/meetings'
import { BRANCH_OPTIONS, YEAR_OPTIONS } from '../../types/database'
import type { Company, Meeting } from '../../types/database'

type Audience = 'all' | 'branch' | 'students'

export default function MeetingsSection() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [connectionChecked, setConnectionChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [companyId, setCompanyId] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(30)
  const [hrName, setHrName] = useState('')
  const [hrEmail, setHrEmail] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
  const [branch, setBranch] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState<'' | (typeof YEAR_OPTIONS)[number]>('')
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchCompanies(), fetchAllStudents(), fetchMeetings()])
      .then(([companyList, studentList, meetingList]) => {
        if (!active) return
        setCompanies(companyList)
        setStudents(studentList)
        setMeetings(meetingList)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load data')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    fetchGoogleConnection()
      .then((connection) => {
        if (active) setConnectedEmail(connection?.connectedEmail ?? null)
      })
      .catch(() => {
        /* treated as not connected */
      })
      .finally(() => {
        if (active) setConnectionChecked(true)
      })

    return () => {
      active = false
    }
  }, [])

  const companyName = useMemo(() => {
    const map = new Map(companies.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? 'Unknown company'
  }, [companies])

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      ({ profile }) =>
        profile.full_name.toLowerCase().includes(q) || profile.email.toLowerCase().includes(q),
    )
  }, [students, studentQuery])

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  function describeAudience(m: Meeting) {
    if (m.audience_type === 'all') return 'All students'
    if (m.audience_type === 'branch') {
      return [m.branch, m.year_of_study ? `Year ${m.year_of_study}` : null].filter(Boolean).join(' · ')
    }
    return `${m.student_ids.length} selected student${m.student_ids.length === 1 ? '' : 's'}`
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!companyId || !title || !date || !time) {
      setFormError('Company, title, date and time are required.')
      return
    }
    if (audience === 'branch' && !branch) {
      setFormError('Pick a branch for this audience.')
      return
    }
    if (audience === 'students' && selectedStudentIds.length === 0) {
      setFormError('Select at least one student.')
      return
    }

    setSubmitting(true)
    try {
      const meeting = await createMeeting({
        companyId,
        title,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        durationMinutes: duration,
        hrName,
        hrEmail,
        audienceType: audience,
        branch: audience === 'branch' ? branch : undefined,
        yearOfStudy: audience === 'branch' && yearOfStudy !== '' ? yearOfStudy : undefined,
        studentIds: audience === 'students' ? selectedStudentIds : undefined,
      })
      setMeetings((prev) => [...prev, meeting].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)))
      setTitle('')
      setDate('')
      setTime('')
      setDuration(30)
      setHrName('')
      setHrEmail('')
      setAudience('all')
      setBranch('')
      setYearOfStudy('')
      setSelectedStudentIds([])
      setStudentQuery('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create the meeting')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelMeeting(id)
      setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'cancelled' } : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel meeting')
    }
  }

  async function copyLink(id: string, link: string) {
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Schedule a video call between a company&apos;s HR and your students, with an
            auto-generated Google Meet link.
          </p>
        </div>
        {connectionChecked && !isGoogleCalendarConfigured() && (
          <p className="text-sm text-amber-400 max-w-sm text-right">
            Google Calendar isn&apos;t set up yet — add{' '}
            <code className="bg-slate-800 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to your{' '}
            <code className="bg-slate-800 px-1 rounded">.env</code> file.
          </p>
        )}
        {connectionChecked && isGoogleCalendarConfigured() && (
          <a
            href={connectedEmail ? undefined : (buildGoogleAuthUrl() ?? undefined)}
            onClick={(e) => {
              if (connectedEmail) e.preventDefault()
            }}
            className={clsx(
              'inline-flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg transition-colors',
              connectedEmail
                ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 cursor-pointer',
            )}
          >
            <Video className="w-4 h-4" />
            {connectedEmail ? `Connected as ${connectedEmail}` : 'Connect Google Calendar'}
          </a>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-200">Schedule a meeting</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Organization</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select a company…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Meeting title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Infosys HR interaction"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Duration (minutes)</label>
            <input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">HR name</label>
            <input
              type="text"
              value={hrName}
              onChange={(e) => setHrName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">HR email</label>
            <input
              type="email"
              value={hrEmail}
              onChange={(e) => setHrEmail(e.target.value)}
              placeholder="Invited to the calendar event"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Who is this for?</label>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {(
              [
                ['all', 'All students'],
                ['branch', 'A branch'],
                ['students', 'Specific students'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAudience(value)}
                className={clsx(
                  'py-2 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                  audience === value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {audience === 'branch' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select a branch…</option>
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Year (optional)</label>
              <select
                value={yearOfStudy}
                onChange={(e) =>
                  setYearOfStudy(
                    e.target.value ? (Number(e.target.value) as (typeof YEAR_OPTIONS)[number]) : '',
                  )
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Any year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {audience === 'students' && (
          <div className="space-y-2 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <p className="text-xs text-slate-400">{selectedStudentIds.length} selected</p>
            <div className="max-h-48 overflow-y-auto border border-slate-700 rounded-lg divide-y divide-slate-700">
              {filteredStudents.map(({ profile }) => (
                <label
                  key={profile.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-700/40"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(profile.id)}
                    onChange={() => toggleStudent(profile.id)}
                  />
                  <span className="truncate">{profile.full_name}</span>
                  <span className="text-xs text-slate-500 truncate">{profile.email}</span>
                </label>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-sm text-slate-500 px-3 py-2">No students match.</p>
              )}
            </div>
          </div>
        )}

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <button
          type="submit"
          disabled={submitting || !connectedEmail}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          {submitting ? 'Creating…' : 'Create meeting & Meet link'}
        </button>
        {!connectedEmail && connectionChecked && (
          <p className="text-xs text-amber-400">Connect Google Calendar above first.</p>
        )}
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Tracker</h2>
        {meetings.length === 0 ? (
          <p className="text-sm text-slate-400">No meetings scheduled yet.</p>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700 overflow-hidden">
            {meetings.map((m) => (
              <div key={m.id} className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{m.title}</p>
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        m.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-emerald-500/20 text-emerald-300',
                      )}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {companyName(m.company_id)} · {new Date(m.scheduled_at).toLocaleString()} ·{' '}
                    {m.duration_minutes} min
                  </p>
                  <p className="text-xs text-slate-400">
                    Audience: {describeAudience(m)}
                    {m.hr_name ? ` · HR: ${m.hr_name}` : ''}
                  </p>
                  {m.meet_link && (
                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href={m.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Meet link
                      </a>
                      <button
                        onClick={() => void copyLink(m.id, m.meet_link as string)}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedId === m.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
                {m.status === 'scheduled' && (
                  <button
                    onClick={() => void handleCancel(m.id)}
                    className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
