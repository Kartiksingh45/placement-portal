import { useEffect, useMemo, useState } from 'react'
import { Copy, Check, UserSearch } from 'lucide-react'
import {
  fetchAllStudents,
  updateStudentDetails,
  updateStudentEmail,
  type StudentDirectoryEntry,
} from '../../lib/students'
import { BRANCH_OPTIONS, YEAR_OPTIONS } from '../../types/database'

interface Draft {
  email: string
  phone: string
  collegeName: string
  rollNo: string
  branch: string
  yearOfStudy: '' | (typeof YEAR_OPTIONS)[number]
}

function byRollNo(a: StudentDirectoryEntry, b: StudentDirectoryEntry) {
  const rollA = a.studentProfile?.roll_no ?? ''
  const rollB = b.studentProfile?.roll_no ?? ''
  return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' })
}

function defaultDraft(entry: StudentDirectoryEntry): Draft {
  return {
    email: entry.profile.email,
    phone: entry.studentProfile?.phone ?? '',
    collegeName: entry.studentProfile?.college_name ?? '',
    rollNo: entry.studentProfile?.roll_no ?? '',
    branch: entry.studentProfile?.branch ?? '',
    yearOfStudy: (entry.studentProfile?.year_of_study as (typeof YEAR_OPTIONS)[number]) ?? '',
  }
}

function draftChanged(draft: Draft, entry: StudentDirectoryEntry) {
  const base = defaultDraft(entry)
  return (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== base[key])
}

export default function StudentRecordsSection() {
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showUnidentified, setShowUnidentified] = useState(false)
  const [year, setYear] = useState<(typeof YEAR_OPTIONS)[number] | ''>('')
  const [branch, setBranch] = useState('')

  const [drafts, setDrafts] = useState<Record<string, Partial<Draft>>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const [savedId, setSavedId] = useState<string | null>(null)

  function load() {
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
  }

  useEffect(load, [])

  const unidentified = useMemo(
    () =>
      students
        .filter(
          ({ profile, studentProfile }) =>
            profile.status === 'approved' &&
            (!studentProfile?.branch || !studentProfile?.year_of_study),
        )
        .sort(byRollNo),
    [students],
  )

  const classifiedRows = useMemo(
    () =>
      students
        .filter(
          ({ profile, studentProfile }) =>
            profile.status === 'approved' &&
            studentProfile?.branch === branch &&
            studentProfile?.year_of_study === year,
        )
        .sort(byRollNo),
    [students, year, branch],
  )

  const rows = showUnidentified ? unidentified : classifiedRows

  function getDraft(entry: StudentDirectoryEntry): Draft {
    return { ...defaultDraft(entry), ...drafts[entry.profile.id] }
  }

  function setField(id: string, field: keyof Draft, value: string) {
    const parsed: Draft[typeof field] =
      field === 'yearOfStudy'
        ? value === ''
          ? ''
          : (Number(value) as (typeof YEAR_OPTIONS)[number])
        : value
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: parsed } }))
  }

  async function submitRow(entry: StudentDirectoryEntry) {
    const id = entry.profile.id
    const draft = getDraft(entry)
    const base = defaultDraft(entry)
    if (!draftChanged(draft, entry)) return

    setBusyId(id)
    setRowError((prev) => ({ ...prev, [id]: '' }))
    try {
      if (
        draft.collegeName !== base.collegeName ||
        draft.rollNo !== base.rollNo ||
        draft.branch !== base.branch ||
        draft.yearOfStudy !== base.yearOfStudy ||
        draft.phone !== base.phone
      ) {
        await updateStudentDetails(id, {
          collegeName: draft.collegeName,
          rollNo: draft.rollNo,
          branch: draft.branch,
          yearOfStudy: draft.yearOfStudy === '' ? null : draft.yearOfStudy,
          phone: draft.phone,
        })
      }

      let newLink: string | null = null
      if (draft.email !== base.email) {
        newLink = await updateStudentEmail(id, draft.email)
      }

      setStudents((prev) =>
        prev.map((s) => {
          if (s.profile.id !== id) return s
          return {
            profile: { ...s.profile, email: draft.email },
            studentProfile: s.studentProfile
              ? {
                  ...s.studentProfile,
                  college_name: draft.collegeName || null,
                  roll_no: draft.rollNo || null,
                  branch: draft.branch || null,
                  year_of_study: draft.yearOfStudy === '' ? null : draft.yearOfStudy,
                  phone: draft.phone || null,
                }
              : s.studentProfile,
          }
        }),
      )
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      if (newLink) setLinks((prev) => ({ ...prev, [id]: newLink as string }))
      setSavedId(id)
      setTimeout(() => setSavedId((current) => (current === id ? null : current)), 2000)
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Failed to save changes',
      }))
    } finally {
      setBusyId(null)
    }
  }

  async function copyLink(studentId: string) {
    const link = links[studentId]
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopiedId(studentId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Student records</h1>
          <p className="text-slate-400 text-sm mt-1">
            {showUnidentified
              ? 'Students missing a branch or year — fill in their details and submit.'
              : 'Open a year, then a branch, to view and fix contact details.'}
          </p>
        </div>
        <button
          onClick={() => setShowUnidentified((v) => !v)}
          className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 hover:border-slate-500 text-sm font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
        >
          <UserSearch className="w-4 h-4" />
          {showUnidentified ? 'Back to year/branch view' : `Unidentified students (${unidentified.length})`}
        </button>
      </div>

      {!showUnidentified && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Year</label>
            <select
              value={year}
              onChange={(e) =>
                setYear(
                  e.target.value ? (Number(e.target.value) as (typeof YEAR_OPTIONS)[number]) : '',
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select a year…</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select a branch…</option>
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {(showUnidentified || (year && branch)) && (
        <>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">
              {showUnidentified
                ? 'Every approved student has a branch and year on file.'
                : 'No approved students match this year/branch.'}
            </p>
          ) : (
            <div className="border border-slate-700 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="text-left font-medium px-4 py-3 border-b border-slate-700">
                      College
                    </th>
                    <th className="text-left font-medium px-4 py-3 border-b border-slate-700">
                      Roll no.
                    </th>
                    {showUnidentified && (
                      <>
                        <th className="text-left font-medium px-4 py-3 border-b border-slate-700">
                          Year
                        </th>
                        <th className="text-left font-medium px-4 py-3 border-b border-slate-700">
                          Branch
                        </th>
                      </>
                    )}
                    <th className="text-left font-medium px-4 py-3 border-b border-slate-700">
                      Student
                    </th>
                    <th className="text-left font-medium px-4 py-3 border-b border-slate-700">
                      Email
                    </th>
                    <th className="text-left font-medium px-4 py-3 border-b border-slate-700">
                      Phone
                    </th>
                    <th className="text-left font-medium px-4 py-3 border-b border-slate-700" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => {
                    const id = entry.profile.id
                    const draft = getDraft(entry)
                    const changed = draftChanged(draft, entry)
                    return (
                      <tr key={id} className="border-b border-slate-800 last:border-0 align-top">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={draft.collegeName}
                            placeholder="Not on file"
                            onChange={(e) => setField(id, 'collegeName', e.target.value)}
                            className="w-full min-w-[9rem] bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-600 focus:outline-none rounded px-2 py-1 placeholder:text-slate-500"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={draft.rollNo}
                            placeholder="Not on file"
                            onChange={(e) => setField(id, 'rollNo', e.target.value)}
                            className="w-full min-w-[7rem] bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-600 focus:outline-none rounded px-2 py-1 placeholder:text-slate-500"
                          />
                        </td>
                        {showUnidentified && (
                          <>
                            <td className="px-4 py-2">
                              <select
                                value={draft.yearOfStudy}
                                onChange={(e) =>
                                  setField(id, 'yearOfStudy', e.target.value)
                                }
                                className="bg-transparent border border-slate-700 rounded px-2 py-1 focus:border-blue-600 focus:outline-none"
                              >
                                <option value="">—</option>
                                {YEAR_OPTIONS.map((y) => (
                                  <option key={y} value={y}>
                                    Year {y}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={draft.branch}
                                onChange={(e) => setField(id, 'branch', e.target.value)}
                                className="bg-transparent border border-slate-700 rounded px-2 py-1 focus:border-blue-600 focus:outline-none min-w-[12rem]"
                              >
                                <option value="">—</option>
                                {BRANCH_OPTIONS.map((b) => (
                                  <option key={b} value={b}>
                                    {b}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2 text-slate-100 whitespace-nowrap">
                          {entry.profile.full_name}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="email"
                            value={draft.email}
                            onChange={(e) => setField(id, 'email', e.target.value)}
                            className="w-full min-w-[13rem] bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-600 focus:outline-none rounded px-2 py-1"
                          />
                          {links[id] && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-xs text-emerald-400">
                                Set-password link ready.
                              </span>
                              <button
                                onClick={() => void copyLink(id)}
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                              >
                                {copiedId === id ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                {copiedId === id ? 'Copied' : 'Copy link'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="tel"
                            value={draft.phone}
                            placeholder="Not on file"
                            onChange={(e) => setField(id, 'phone', e.target.value)}
                            className="w-full min-w-[9rem] bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-600 focus:outline-none rounded px-2 py-1 placeholder:text-slate-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => void submitRow(entry)}
                            disabled={!changed || busyId === id}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {busyId === id ? 'Saving…' : 'Submit'}
                          </button>
                          {savedId === id && (
                            <p className="mt-1 text-xs text-emerald-400">Saved</p>
                          )}
                          {rowError[id] && (
                            <p className="mt-1 text-xs text-red-400">{rowError[id]}</p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
