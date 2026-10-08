import { useEffect, useState, type FormEvent } from 'react'
import { Image as ImageIcon, Send, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import {
  createJobOpportunity,
  deleteJobOpportunity,
  fetchJobOpportunities,
  uploadJobPhoto,
} from '../../lib/jobOpportunities'
import type { JobOpportunity } from '../../types/database'

export default function JobOpportunitiesSection() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<JobOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [companyName, setCompanyName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    fetchJobOpportunities()
      .then((data) => {
        if (active) setPosts(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load posts')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setError(null)
    try {
      const photoUrl = photo ? await uploadJobPhoto(photo) : null
      const created = await createJobOpportunity({
        companyName,
        roleTitle,
        description,
        photoUrl,
        createdBy: profile.id,
      })
      setPosts((prev) => [created, ...prev])
      setCompanyName('')
      setRoleTitle('')
      setDescription('')
      setPhoto(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job opportunity')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteJobOpportunity(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Job Opportunities</h1>
        <p className="text-slate-400 text-sm mt-1">
          Posts here appear as public news on the landing page, visible even before sign-in.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 max-w-lg"
      >
        <div className="space-y-1">
          <label className="text-sm text-slate-300">Company name</label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-300">Role</label>
          <input
            type="text"
            required
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-300">Description</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-300">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:text-sm cursor-pointer"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Posting…' : 'Post opportunity'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Posted opportunities</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">No opportunities posted yet.</p>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700 overflow-hidden">
            {posts.map((post) => (
              <div key={post.id} className="p-4 flex items-start gap-4">
                {post.photo_url ? (
                  <img
                    src={post.photo_url}
                    alt={post.company_name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {post.role_title} · {post.company_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{post.description}</p>
                </div>
                <button
                  onClick={() => void handleDelete(post.id)}
                  className="text-slate-500 hover:text-red-400 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
