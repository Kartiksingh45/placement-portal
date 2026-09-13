import { supabase } from './supabase'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export function googleCalendarRedirectUri() {
  return `${window.location.origin}/tpo/google-callback`
}

export function isGoogleCalendarConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID
}

export function buildGoogleAuthUrl(): string | null {
  if (!GOOGLE_CLIENT_ID) {
    return null
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: googleCalendarRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function completeGoogleOAuth(code: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ connectedEmail: string | null }>(
    'google-oauth-callback',
    { body: { code, redirectUri: googleCalendarRedirectUri() } },
  )
  if (error) throw error
  return data?.connectedEmail ?? null
}

export async function fetchGoogleConnection(): Promise<{ connectedEmail: string | null } | null> {
  const { data, error } = await supabase
    .from('google_calendar_connections')
    .select('connected_email')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { connectedEmail: data.connected_email as string | null }
}
