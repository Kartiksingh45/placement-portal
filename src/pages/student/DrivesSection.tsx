import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '../../contexts/auth-context'
import { fetchOpenDrives, type DriveWithCompany } from '../../lib/drives'
import { applyToDrive, fetchMyApplications } from '../../lib/applications'
import { fetchStudentProfile } from '../../lib/resume'
import { computeMatch } from '../../lib/matching'
import type { Application, StudentProfile } from '../../types/database'

const APPLICATION_STATUS_LABEL: Record<Application['status'], string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  rejected: 'Not selected',
  selected: 'Selected',
}

const APPLICATION_STATUS_STYLE: Record<Application['status'], string> = {
  applied: 'bg-slate-700 text-slate-300',
  shortlisted: 'bg-amber-500/20 text-amber-300',
  rejected: 'bg-red-500/20 text-red-300',
  selected: 'bg-emerald-500/20 text-emerald-300',
}

export default function DrivesSection() {
  const { user } = useAuth()
  const [drives, setDrives] = useState<DriveWithCompany[]>([])
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  function load() {
    if (!user) return
    Promise.all([fetchOpenDrives(), fetchStudentProfile(user.id), fetchMyApplications(user.id)])
      .then(([d, sp, apps]) => {
        setDrives(d)
        setStudentProfile(sp)
        setApplications(apps)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load drives'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleApply(drive: DriveWithCompany) {
    if (!user) return
    const match = computeMatch(studentProfile, drive)
    setApplyingId(drive.id)
    setError(null)
    try {
      await applyToDrive(drive.id, user.id, match.score)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setApplyingId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Drives</h1>
        <p className="text-slate-400 text-sm mt-1">
          Open placement drives, matched against your parsed resume.
        </p>
      </div>

      {!studentProfile || studentProfile.resume_status !== 'parsed' ? (
        <p className="text-sm text-amber-300">
          Upload your resume on the Resume tab first for accurate eligibility matching.
        </p>
      ) : null}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {drives.length === 0 ? (
        <p className="text-sm text-slate-400">No open drives right now.</p>
      ) : (
        <div className="space-y-4">
          {drives.map((drive) => {
            const match = computeMatch(studentProfile, drive)
            const existingApplication = applications.find((a) => a.drive_id === drive.id)

            return (
              <div
                key={drive.id}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{drive.role_title}</p>
                    <p className="text-sm text-slate-400">
                      {drive.companies?.website ? (
                        <a
                          href={drive.companies.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {drive.companies.name}
                        </a>
                      ) : (
                        (drive.companies?.name ?? 'Unknown company')
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full font-medium',
                        match.eligible
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300',
                      )}
                    >
                      {match.eligible ? 'Eligible' : 'Not eligible'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-600/20 text-blue-300">
                      {match.score}% match
                    </span>
                  </div>
                </div>

                {drive.description && <p className="text-sm text-slate-400">{drive.description}</p>}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Min CGPA</p>
                    <p>{drive.min_cgpa}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Deadline</p>
                    <p>{drive.deadline ? drive.deadline.slice(0, 10) : '—'}</p>
                  </div>
                </div>

                {drive.required_skills.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Required skills</p>
                    <div className="flex flex-wrap gap-2">
                      {drive.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className={clsx(
                            'text-xs px-2.5 py-1 rounded-full',
                            match.matchedSkills.includes(skill.toLowerCase())
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-700 text-slate-400',
                          )}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  {existingApplication ? (
                    <span
                      className={clsx(
                        'inline-block text-xs px-3 py-1.5 rounded-lg font-medium',
                        APPLICATION_STATUS_STYLE[existingApplication.status],
                      )}
                    >
                      {APPLICATION_STATUS_LABEL[existingApplication.status]}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(drive)}
                      disabled={applyingId === drive.id}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
                    >
                      {applyingId === drive.id ? 'Applying…' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
