import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { completeGoogleOAuth } from '../../lib/googleCalendar'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    Promise.resolve().then(async () => {
      const code = searchParams.get('code')
      const oauthError = searchParams.get('error')

      if (oauthError) {
        if (active) {
          setStatus('error')
          setMessage(`Google sign-in was cancelled or denied (${oauthError}).`)
        }
        return
      }
      if (!code) {
        if (active) {
          setStatus('error')
          setMessage('No authorization code was returned by Google.')
        }
        return
      }

      try {
        const email = await completeGoogleOAuth(code)
        if (active) {
          setStatus('done')
          setMessage(email ? `Connected as ${email}.` : 'Connected.')
        }
      } catch (err) {
        if (active) {
          setStatus('error')
          setMessage(err instanceof Error ? err.message : 'Failed to connect Google Calendar')
        }
      }
    })

    return () => {
      active = false
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <h1 className="text-xl font-bold tracking-tight">
          {status === 'working' && 'Connecting Google Calendar…'}
          {status === 'done' && 'Google Calendar connected'}
          {status === 'error' && "Couldn't connect Google Calendar"}
        </h1>
        {message && (
          <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
            {message}
          </p>
        )}
        {status !== 'working' && (
          <Link
            to="/tpo"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Back to dashboard
          </Link>
        )}
      </div>
    </div>
  )
}
