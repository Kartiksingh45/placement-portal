import { useEffect, useState, type FormEvent } from 'react'
import { Send, ShieldMinus } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { fetchOfficers, inviteTpo, revokeTpo } from '../../lib/officers'
import type { Profile } from '../../types/database'

export default function OfficersSection() {
  const { profile: me } = useAuth()
  const [officers, setOfficers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSent, setInviteSent] = useState<string | null>(null)

  function load() {
    let active = true
    fetchOfficers()
      .then((officerList) => {
        if (active) setOfficers(officerList)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load officers')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }

  useEffect(load, [])

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviteSent(null)
    setInviting(true)
    try {
      await inviteTpo(inviteEmail, inviteName)
      setInviteSent(inviteEmail)
      setInviteName('')
      setInviteEmail('')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleRevoke(userId: string) {
    setBusyId(userId)
    setError(null)
    try {
      await revokeTpo(userId)
      setOfficers((prev) => prev.filter((o) => o.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke placement officer access')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Placement officers</h1>
        <p className="text-slate-400 text-sm mt-1">
          TPO access is invite-only — send an email invite instead of promoting an existing
          student account.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Current officers</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700 overflow-hidden">
          {officers.length === 0 && (
            <p className="text-sm text-slate-400 p-5">No placement officers yet.</p>
          )}
          {officers.map((officer) => (
            <div key={officer.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{officer.full_name || '—'}</p>
                <p className="text-xs text-slate-400 truncate">{officer.email}</p>
              </div>
              {officer.id !== me?.id && (
                <button
                  onClick={() => void handleRevoke(officer.id)}
                  disabled={busyId === officer.id}
                  className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <ShieldMinus className="w-3.5 h-3.5" />
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Invite a placement officer</h2>
        <form
          onSubmit={handleInvite}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 max-w-lg"
        >
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Full name</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
          {inviteSent && (
            <p className="text-sm text-emerald-400">
              Invitation sent to {inviteSent}. They&apos;ll get an email to set a password and
              sign in as a placement officer.
            </p>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {inviting ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      </div>
    </div>
  )
}
