import { useEffect, useState } from 'react'
import { FileText, Loader2, UploadCloud } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { fetchStudentProfile, parseResume, uploadResume } from '../../lib/resume'
import type { StudentProfile } from '../../types/database'

const MAX_FILE_BYTES = 5 * 1024 * 1024

const STATUS_LABEL: Record<StudentProfile['resume_status'], string> = {
  not_uploaded: 'Not uploaded',
  processing: 'Processing…',
  parsed: 'Parsed',
  failed: 'Failed to parse',
}

export default function ResumeSection() {
  const { user } = useAuth()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchStudentProfile(user.id)
      .then((data) => {
        if (active) setStudentProfile(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load resume status')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return

    setError(null)

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File is too large (max 5MB).')
      return
    }

    setBusy(true)
    try {
      const path = await uploadResume(user.id, file)
      setStudentProfile((prev) =>
        prev
          ? { ...prev, resume_status: 'processing', resume_url: path }
          : {
              user_id: user.id,
              branch: null,
              college_name: null,
              roll_no: null,
              year_of_study: null,
              batch_year: null,
              cgpa: null,
              phone: null,
              skills: [],
              certifications: [],
              resume_url: path,
              resume_parsed: null,
              resume_status: 'processing',
              updated_at: new Date().toISOString(),
            },
      )
      const updated = await parseResume(path)
      setStudentProfile(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload/parse resume')
      setStudentProfile((prev) => (prev ? { ...prev, resume_status: 'failed' } : prev))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  const status = studentProfile?.resume_status ?? 'not_uploaded'
  const parsed = studentProfile?.resume_parsed

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload a PDF resume — it's parsed automatically to fill in your skills, CGPA, and
          certifications.
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Status</p>
            <p className="text-sm font-medium">{STATUS_LABEL[status]}</p>
          </div>
          <label
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
            aria-disabled={busy}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {busy ? 'Uploading…' : 'Upload & Parse'}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={busy}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {status === 'parsed' && parsed && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <FileText className="w-4 h-4" />
            <p className="text-sm font-medium">Extracted details</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Branch</p>
              <p>{parsed.branch || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Batch year</p>
              <p>{parsed.batch_year ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">CGPA</p>
              <p>{parsed.cgpa ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Phone</p>
              <p>{parsed.phone || '—'}</p>
            </div>
          </div>

          {parsed.summary && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Summary</p>
              <p className="text-sm text-slate-300">{parsed.summary}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {parsed.skills?.length ? (
                parsed.skills.map((skill) => (
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

          <div>
            <p className="text-xs text-slate-400 mb-2">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {parsed.certifications?.length ? (
                parsed.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full"
                  >
                    {cert}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">None found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
