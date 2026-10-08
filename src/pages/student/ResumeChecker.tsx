import { useEffect, useState } from 'react'
import { CheckCircle2, Lightbulb, ScanSearch } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../contexts/auth-context'
import { fetchStudentProfile } from '../../lib/resume'
import { checkResume } from '../../lib/resumeChecker'
import type { BuilderResume, ParsedResume, ResumeCheckResult } from '../../types/database'

type Source = 'uploaded' | 'builder'

function scoreColor(score: number) {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

export default function ResumeChecker() {
  const { user } = useAuth()
  const [uploaded, setUploaded] = useState<ParsedResume | null>(null)
  const [builder, setBuilder] = useState<BuilderResume | null>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [result, setResult] = useState<ResumeCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchStudentProfile(user.id)
      .then((sp) => {
        if (!active) return
        setUploaded(sp?.resume_parsed ?? null)
        setBuilder(sp?.builder_resume ?? null)
        setResult(sp?.resume_check ?? null)
        setSource(sp?.resume_parsed ? 'uploaded' : sp?.builder_resume ? 'builder' : null)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load resume data')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  async function handleCheck() {
    if (!source) return
    const resumeData = source === 'uploaded' ? uploaded : builder
    if (!resumeData) return

    setChecking(true)
    setError(null)
    try {
      const checked = await checkResume(resumeData)
      setResult(checked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check resume')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  if (!uploaded && !builder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Resume Checker</h1>
          <p className="text-slate-400 text-sm mt-1">
            Get an ATS-style score and improvement suggestions.
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Upload a resume or create one with the Resume Builder first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Resume Checker</h1>
        <p className="text-slate-400 text-sm mt-1">
          Get an ATS-style score and improvement suggestions.
        </p>
      </div>

      {uploaded && builder && (
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          {(['uploaded', 'builder'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={clsx(
                'py-2 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                source === s
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500',
              )}
            >
              {s === 'uploaded' ? 'Uploaded resume' : 'Builder resume'}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={() => void handleCheck()}
        disabled={checking || !source}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
      >
        <ScanSearch className="w-4 h-4" />
        {checking ? 'Checking…' : result ? 'Re-check resume' : 'Check my resume'}
      </button>

      {result && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">ATS compatibility score</p>
            <p className={clsx('text-5xl font-bold', scoreColor(result.score))}>{result.score}</p>
          </div>

          {result.strengths.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Strengths
              </h3>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Suggestions
              </h3>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
