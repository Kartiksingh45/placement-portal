import { useEffect, useState } from 'react'
import { Download, Plus, Save, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { fetchStudentProfile } from '../../lib/resume'
import { saveBuilderResume } from '../../lib/resumeBuilder'
import { TagInput } from '../../components/TagInput'
import type { BuilderResume, BuilderResumeEducation, BuilderResumeExperience } from '../../types/database'

const EMPTY_EDUCATION: BuilderResumeEducation = { institution: '', degree: '', year: '' }
const EMPTY_EXPERIENCE: BuilderResumeExperience = {
  title: '',
  company: '',
  duration: '',
  description: '',
}

function emptyResume(fullName: string, email: string): BuilderResume {
  return {
    full_name: fullName,
    email,
    phone: '',
    summary: '',
    education: [],
    experience: [],
    skills: [],
    certifications: [],
  }
}

export default function ResumeBuilder() {
  const { user, profile } = useAuth()
  const [resume, setResume] = useState<BuilderResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchStudentProfile(user.id)
      .then((sp) => {
        if (!active) return
        setResume(sp?.builder_resume ?? emptyResume(profile?.full_name ?? '', profile?.email ?? ''))
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load resume')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function update<K extends keyof BuilderResume>(key: K, value: BuilderResume[K]) {
    setResume((prev) => (prev ? { ...prev, [key]: value } : prev))
    setSaved(false)
  }

  function updateEducation(index: number, field: keyof BuilderResumeEducation, value: string) {
    if (!resume) return
    const next = resume.education.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    update('education', next)
  }

  function updateExperience(index: number, field: keyof BuilderResumeExperience, value: string) {
    if (!resume) return
    const next = resume.experience.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    update('experience', next)
  }

  async function handleSave() {
    if (!user || !resume) return
    setSaving(true)
    setError(null)
    try {
      await saveBuilderResume(user.id, resume)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !resume) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold">Resume Builder</h1>
        <p className="text-slate-400 text-sm mt-1">
          Fill in your details, preview on the right, then save or download as a PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 print:hidden">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Full name</label>
                <input
                  type="text"
                  value={resume.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={resume.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Phone</label>
              <input
                type="tel"
                value={resume.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Summary</label>
              <textarea
                rows={3}
                value={resume.summary}
                onChange={(e) => update('summary', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Education</h2>
              <button
                onClick={() => update('education', [...resume.education, { ...EMPTY_EDUCATION }])}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            {resume.education.map((edu, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                <input
                  type="text"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Year"
                    value={edu.year}
                    onChange={(e) => updateEducation(i, 'year', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={() =>
                      update(
                        'education',
                        resume.education.filter((_, idx) => idx !== i),
                      )
                    }
                    className="text-slate-500 hover:text-red-400 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Experience</h2>
              <button
                onClick={() =>
                  update('experience', [...resume.experience, { ...EMPTY_EXPERIENCE }])
                }
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            {resume.experience.map((exp, i) => (
              <div key={i} className="space-y-2 border-t border-slate-700 pt-3 first:border-0 first:pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Title"
                    value={exp.title}
                    onChange={(e) => updateExperience(i, 'title', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(i, 'company', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={exp.duration}
                    onChange={(e) => updateExperience(i, 'duration', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={exp.description}
                    onChange={(e) => updateExperience(i, 'description', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={() =>
                      update(
                        'experience',
                        resume.experience.filter((_, idx) => idx !== i),
                      )
                    }
                    className="text-slate-500 hover:text-red-400 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <TagInput
              label="Skills"
              values={resume.skills}
              onChange={(v) => update('skills', v)}
              placeholder="Type a skill, press Enter"
            />
            <TagInput
              label="Certifications"
              values={resume.certifications}
              onChange={(v) => update('certifications', v)}
              placeholder="Type a certification, press Enter"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download as PDF
            </button>
            {saved && <span className="text-sm text-emerald-400">Saved.</span>}
          </div>
        </div>

        <div
          id="resume-preview"
          className="bg-white text-slate-900 rounded-2xl p-8 print:rounded-none print:p-0 print:shadow-none space-y-4 h-fit"
        >
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold">{resume.full_name || 'Your Name'}</h2>
            <p className="text-sm text-slate-600">
              {[resume.email, resume.phone].filter(Boolean).join(' · ')}
            </p>
          </div>

          {resume.summary && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-300 pb-1 mb-1">
                Summary
              </h3>
              <p className="text-sm">{resume.summary}</p>
            </div>
          )}

          {resume.education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-300 pb-1 mb-1">
                Education
              </h3>
              {resume.education.map((edu, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>
                    {edu.degree}
                    {edu.institution ? `, ${edu.institution}` : ''}
                  </span>
                  <span className="text-slate-500">{edu.year}</span>
                </div>
              ))}
            </div>
          )}

          {resume.experience.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-300 pb-1 mb-1">
                Experience
              </h3>
              {resume.experience.map((exp, i) => (
                <div key={i} className="text-sm space-y-0.5">
                  <div className="flex justify-between font-medium">
                    <span>
                      {exp.title}
                      {exp.company ? ` — ${exp.company}` : ''}
                    </span>
                    <span className="text-slate-500 font-normal">{exp.duration}</span>
                  </div>
                  {exp.description && <p className="text-slate-700">{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {resume.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-300 pb-1 mb-1">
                Skills
              </h3>
              <p className="text-sm">{resume.skills.join(', ')}</p>
            </div>
          )}

          {resume.certifications.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-300 pb-1 mb-1">
                Certifications
              </h3>
              <p className="text-sm">{resume.certifications.join(', ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
