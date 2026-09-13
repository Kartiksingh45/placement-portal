import { useEffect, useMemo, useState } from 'react'
import { GripVertical, ListRestart, Save } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { fetchAllStudents, type StudentDirectoryEntry } from '../../lib/students'
import { fetchCompanies } from '../../lib/companies'
import { fetchSequence, saveSequence } from '../../lib/sequences'
import { BRANCH_OPTIONS } from '../../types/database'
import type { Company } from '../../types/database'

function byRollNo(a: StudentDirectoryEntry, b: StudentDirectoryEntry) {
  const rollA = a.studentProfile?.roll_no ?? ''
  const rollB = b.studentProfile?.roll_no ?? ''
  return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' })
}

export default function ArrangeStudentsSection() {
  const { profile } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [allStudents, setAllStudents] = useState<StudentDirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [companyId, setCompanyId] = useState('')
  const [branch, setBranch] = useState('')
  const [order, setOrder] = useState<StudentDirectoryEntry[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([fetchCompanies(), fetchAllStudents()])
      .then(([companyList, students]) => {
        if (!active) return
        setCompanies(companyList)
        setAllStudents(students)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load data')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const branchStudents = useMemo(
    () =>
      allStudents.filter(
        ({ profile, studentProfile }) =>
          profile.status === 'approved' && studentProfile?.branch === branch,
      ),
    [allStudents, branch],
  )

  useEffect(() => {
    if (!companyId || !branch) {
      return
    }

    let active = true
    fetchSequence(companyId, branch)
      .then((sequence) => {
        if (!active) return
        const byId = new Map(branchStudents.map((entry) => [entry.profile.id, entry]))
        const savedEntries = (sequence?.student_order ?? [])
          .map((id) => byId.get(id))
          .filter((entry): entry is StudentDirectoryEntry => !!entry)
        const remaining = branchStudents
          .filter((entry) => !sequence?.student_order.includes(entry.profile.id))
          .sort(byRollNo)
        setOrder([...savedEntries, ...remaining])
        setSaved(false)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load sequence')
      })
    return () => {
      active = false
    }
    // branchStudents intentionally omitted: it's recomputed from allStudents/branch which are
    // already dependencies, and including it would refetch the sequence on every reorder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, branch])

  function resetToRollNo() {
    setOrder([...branchStudents].sort(byRollNo))
    setSaved(false)
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDragIndex(null)
    setSaved(false)
  }

  async function handleSave() {
    if (!companyId || !branch || !profile) return
    setSaving(true)
    setError(null)
    try {
      await saveSequence(
        companyId,
        branch,
        order.map((entry) => entry.profile.id),
        profile.id,
      )
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Arrange students</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pick a company and branch, then drag students into the order you need.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <div className="space-y-1">
          <label className="text-sm text-slate-300">Organization</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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

      {error && <p className="text-sm text-red-400">{error}</p>}

      {companyId && branch && (
        <>
          {order.length === 0 ? (
            <p className="text-sm text-slate-400">No approved students in this branch yet.</p>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700 overflow-hidden max-w-2xl">
              {order.map((entry, index) => (
                <div
                  key={entry.profile.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  className="flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing hover:bg-slate-700/40 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-500 w-7 shrink-0 text-right">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{entry.profile.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{entry.profile.email}</p>
                  </div>
                  <span className="text-xs text-slate-300 shrink-0">
                    Roll no. {entry.studentProfile?.roll_no || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={resetToRollNo}
              className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-sm font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              <ListRestart className="w-4 h-4" />
              Reset to roll no. order
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving || order.length === 0}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save order'}
            </button>
            {saved && <span className="text-sm text-emerald-400">Saved.</span>}
          </div>
        </>
      )}
    </div>
  )
}
