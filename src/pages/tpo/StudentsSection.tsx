import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import clsx from 'clsx'
import { fetchAllStudents, type StudentDirectoryEntry } from '../../lib/students'

const STATUS_STYLE: Record<string, string> = {
  not_uploaded: 'bg-slate-700 text-slate-300',
  processing: 'bg-amber-500/20 text-amber-300',
  parsed: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
}

const STATUS_LABEL: Record<string, string> = {
  not_uploaded: 'No resume',
  processing: 'Processing',
  parsed: 'Parsed',
  failed: 'Failed',
}

const APPROVAL_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-red-500/20 text-red-300',
}

export default function StudentsSection() {
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchAllStudents()
      .then((data) => {
        if (active) setStudents(data)
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      ({ profile }) =>
        profile.full_name.toLowerCase().includes(q) || profile.email.toLowerCase().includes(q),
    )
  }, [students, query])

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-slate-400 text-sm mt-1">
          {students.length} registered student{students.length === 1 ? '' : 's'}.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700 overflow-hidden">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 p-5">No students match your search.</p>
        )}

        {filtered.map(({ profile, studentProfile }) => {
          const status = studentProfile?.resume_status ?? 'not_uploaded'
          const expanded = expandedId === profile.id
          const parsed = studentProfile?.resume_parsed

          return (
            <div key={profile.id}>
              <button
                onClick={() => setExpandedId(expanded ? null : profile.id)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-700/40 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {studentProfile?.branch || '—'}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block">
                    CGPA {studentProfile?.cgpa ?? '—'}
                  </span>
                  <span
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium',
                      APPROVAL_STYLE[profile.status],
                    )}
                  >
                    {profile.status}
                  </span>
                  <span
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium',
                      STATUS_STYLE[status],
                    )}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {expanded && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">College</p>
                      <p>{studentProfile?.college_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Roll no.</p>
                      <p>{studentProfile?.roll_no || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Year</p>
                      <p>{studentProfile?.year_of_study ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Branch</p>
                      <p>{studentProfile?.branch || '—'}</p>
                    </div>
                  </div>

                  {!studentProfile || status !== 'parsed' ? (
                    <p className="text-sm text-slate-500">
                      {status === 'failed'
                        ? 'Resume parsing failed for this student.'
                        : status === 'processing'
                          ? 'Resume is still being processed.'
                          : 'This student has not uploaded a resume yet.'}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">Branch</p>
                          <p>{studentProfile.branch || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Batch year</p>
                          <p>{studentProfile.batch_year ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">CGPA</p>
                          <p>{studentProfile.cgpa ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Phone</p>
                          <p>{studentProfile.phone || '—'}</p>
                        </div>
                      </div>

                      {parsed?.summary && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Summary</p>
                          <p className="text-sm text-slate-300">{parsed.summary}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-slate-400 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {studentProfile.skills.length ? (
                            studentProfile.skills.map((skill) => (
                              <span
                                key={skill}
                                className="text-xs bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">None found</p>
                          )}
                        </div>
                      </div>

                      {studentProfile.certifications.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Certifications</p>
                          <div className="flex flex-wrap gap-2">
                            {studentProfile.certifications.map((cert) => (
                              <span
                                key={cert}
                                className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsed?.experience && parsed.experience.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Experience</p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            {parsed.experience.map((exp, i) => (
                              <li key={i}>
                                {[exp.title, exp.company, exp.duration].filter(Boolean).join(' — ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
