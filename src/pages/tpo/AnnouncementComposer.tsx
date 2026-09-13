import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Megaphone, Search } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../contexts/auth-context'
import { createAnnouncement, fetchAnnouncements } from '../../lib/announcements'
import { fetchAllStudents, type StudentDirectoryEntry } from '../../lib/students'
import type { Announcement, Profile } from '../../types/database'

export default function AnnouncementComposer() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'student'>('all')
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([])
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load updates'))
  }

  useEffect(() => {
    load()
    fetchAllStudents()
      .then(setStudents)
      .catch(() => {
        /* non-critical for composing */
      })
  }, [])

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      ({ profile }) =>
        profile.full_name.toLowerCase().includes(q) || profile.email.toLowerCase().includes(q),
    )
  }, [students, studentQuery])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !message.trim()) return
    if (targetType === 'student' && !selectedStudent) {
      setError('Pick a student to send this update to.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createAnnouncement({
        message: message.trim(),
        targetType,
        targetStudentId: targetType === 'student' ? selectedStudent!.id : null,
        createdBy: user.id,
      })
      setMessage('')
      setSelectedStudent(null)
      setStudentQuery('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post update')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <Megaphone className="w-4 h-4" />
        Post an update
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4"
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Share an update with students…"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <div className="grid grid-cols-2 gap-2 max-w-sm">
          {(['all', 'student'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTargetType(t)}
              className={clsx(
                'py-2 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                targetType === t
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500',
              )}
            >
              {t === 'all' ? 'All students' : 'Specific student'}
            </button>
          ))}
        </div>

        {targetType === 'student' && (
          <div className="space-y-2">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={selectedStudent ? selectedStudent.full_name : studentQuery}
                onChange={(e) => {
                  setSelectedStudent(null)
                  setStudentQuery(e.target.value)
                }}
                placeholder="Search by name or email"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            {!selectedStudent && studentQuery.trim() && (
              <div className="max-w-sm bg-slate-900 border border-slate-700 rounded-lg divide-y divide-slate-800 max-h-48 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-500 p-3">No students match.</p>
                ) : (
                  filteredStudents.map(({ profile }) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(profile)
                        setStudentQuery('')
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <p>{profile.full_name}</p>
                      <p className="text-xs text-slate-500">{profile.email}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
        >
          {submitting ? 'Posting…' : 'Post update'}
        </button>
      </form>

      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((a) => {
            const targetStudent = students.find((s) => s.profile.id === a.target_student_id)
            return (
              <div
                key={a.id}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm space-y-1"
              >
                <p>{a.message}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded-full',
                      a.target_type === 'all'
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'bg-slate-700 text-slate-300',
                    )}
                  >
                    {a.target_type === 'all' ? 'All students' : targetStudent?.profile.full_name ?? 'One student'}
                  </span>
                  <span>{new Date(a.created_at).toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
