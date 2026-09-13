import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Users } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../contexts/auth-context'
import { fetchCompanies } from '../../lib/companies'
import {
  createDrive,
  deleteDrive,
  fetchDrives,
  updateDrive,
  type DriveInput,
  type DriveWithCompany,
} from '../../lib/drives'
import { TagInput } from '../../components/TagInput'
import ApplicantList from './ApplicantList'
import type { Company } from '../../types/database'

const EMPTY_FORM: DriveInput = {
  companyId: '',
  roleTitle: '',
  description: '',
  minCgpa: 0,
  eligibleBranches: [],
  requiredSkills: [],
  requiredCertifications: [],
  deadline: '',
  status: 'open',
}

export default function DrivesSection() {
  const { user } = useAuth()
  const [drives, setDrives] = useState<DriveWithCompany[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DriveInput>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function load() {
    Promise.all([fetchDrives(), fetchCompanies()])
      .then(([d, c]) => {
        setDrives(d)
        setCompanies(c)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load drives'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, companyId: companies[0]?.id ?? '' })
    setShowForm(true)
  }

  function openEditForm(drive: DriveWithCompany) {
    setEditingId(drive.id)
    setForm({
      companyId: drive.company_id,
      roleTitle: drive.role_title,
      description: drive.description ?? '',
      minCgpa: drive.min_cgpa,
      eligibleBranches: drive.eligible_branches,
      requiredSkills: drive.required_skills,
      requiredCertifications: drive.required_certifications,
      deadline: drive.deadline ? drive.deadline.slice(0, 10) : '',
      status: drive.status,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !form.companyId) return
    setSubmitting(true)
    setError(null)
    try {
      if (editingId) {
        await updateDrive(editingId, form)
      } else {
        await createDrive(form, user.id)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save drive')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this drive?')) return
    try {
      await deleteDrive(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete drive')
    }
  }

  async function toggleStatus(drive: DriveWithCompany) {
    try {
      await updateDrive(drive.id, {
        companyId: drive.company_id,
        roleTitle: drive.role_title,
        description: drive.description ?? '',
        minCgpa: drive.min_cgpa,
        eligibleBranches: drive.eligible_branches,
        requiredSkills: drive.required_skills,
        requiredCertifications: drive.required_certifications,
        deadline: drive.deadline ? drive.deadline.slice(0, 10) : '',
        status: drive.status === 'open' ? 'closed' : 'open',
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drives & Applications</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create placement drives with eligibility criteria.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          disabled={companies.length === 0}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add drive
        </button>
      </div>

      {companies.length === 0 && !loading && (
        <p className="text-sm text-amber-300">
          Add a company first (Companies tab) before creating a drive.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 max-w-xl"
        >
          <h2 className="font-semibold">{editingId ? 'Edit drive' : 'New drive'}</h2>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Company</label>
            <select
              required
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Role title</label>
            <input
              required
              value={form.roleTitle}
              onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
              placeholder="e.g. Software Engineer Intern"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Minimum CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={form.minCgpa}
                onChange={(e) => setForm({ ...form, minCgpa: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <TagInput
            label="Eligible branches"
            values={form.eligibleBranches}
            onChange={(v) => setForm({ ...form, eligibleBranches: v })}
            placeholder="Type a branch, press Enter"
          />
          <TagInput
            label="Required skills"
            values={form.requiredSkills}
            onChange={(v) => setForm({ ...form, requiredSkills: v })}
            placeholder="Type a skill, press Enter"
          />
          <TagInput
            label="Required certifications"
            values={form.requiredCertifications}
            onChange={(v) => setForm({ ...form, requiredCertifications: v })}
            placeholder="Type a certification, press Enter"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-medium py-2 px-4 rounded-lg text-slate-300 hover:bg-slate-700/60 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : drives.length === 0 ? (
        <p className="text-sm text-slate-400">No drives yet.</p>
      ) : (
        <div className="space-y-4">
          {drives.map((drive) => (
            <div key={drive.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
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
                  <button
                    onClick={() => toggleStatus(drive)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors',
                      drive.status === 'open'
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
                    )}
                  >
                    {drive.status === 'open' ? 'Open' : 'Closed'}
                  </button>
                  <button
                    onClick={() => openEditForm(drive)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700/60 hover:text-white cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(drive.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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

              {drive.eligible_branches.length > 0 && (
                <TagRow label="Branches" tags={drive.eligible_branches} />
              )}
              {drive.required_skills.length > 0 && (
                <TagRow label="Skills" tags={drive.required_skills} />
              )}
              {drive.required_certifications.length > 0 && (
                <TagRow label="Certifications" tags={drive.required_certifications} />
              )}

              <button
                onClick={() => setExpandedId(expandedId === drive.id ? null : drive.id)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Applicants
                {expandedId === drive.id ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {expandedId === drive.id && <ApplicantList driveId={drive.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
