import { useEffect, useState, type FormEvent } from 'react'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { createCompany, deleteCompany, fetchCompanies, updateCompany } from '../../lib/companies'
import type { Company } from '../../types/database'

interface FormState {
  name: string
  description: string
  website: string
}

const EMPTY_FORM: FormState = { name: '', description: '', website: '' }

export default function CompaniesSection() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    fetchCompanies()
      .then(setCompanies)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load companies'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(company: Company) {
    setEditingId(company.id)
    setForm({
      name: company.name,
      description: company.description ?? '',
      website: company.website ?? '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      if (editingId) {
        await updateCompany(editingId, form)
      } else {
        await createCompany({ ...form, createdBy: user.id })
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this company? Its drives will also be removed.')) return
    try {
      await deleteCompany(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-slate-400 text-sm mt-1">Manage recruiters for this placement cycle.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add company
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 max-w-lg"
        >
          <h2 className="font-semibold">{editingId ? 'Edit company' : 'New company'}</h2>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
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
      ) : companies.length === 0 ? (
        <p className="text-sm text-slate-400">No companies yet. Add one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="font-medium truncate">{company.name}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEditForm(company)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700/60 hover:text-white cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {company.description && (
                <p className="text-sm text-slate-400">{company.description}</p>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 break-all"
                >
                  {company.website}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
