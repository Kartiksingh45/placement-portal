// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> Create function -> name it "create-meeting" -> paste this code).
// Requires the same GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET secrets as
// google-oauth-callback (Edge Functions -> Secrets).
//
// Uses the calling TPO's stored Google refresh token to create a Calendar
// event with an auto-generated Google Meet link, then records the meeting.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

interface CreateMeetingBody {
  companyId: string;
  title: string;
  scheduledAt: string;
  durationMinutes?: number;
  hrName?: string;
  hrEmail?: string;
  audienceType: "all" | "branch" | "students";
  branch?: string;
  yearOfStudy?: number;
  studentIds?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    const { data: callerProfile, error: profileError } = await callerClient
      .from("profiles")
      .select("role, status")
      .eq("id", callerData.user.id)
      .single();

    if (profileError || callerProfile?.role !== "tpo" || callerProfile?.status !== "approved") {
      return jsonResponse({ error: "Only an approved placement officer can do this" }, 403);
    }

    const body = (await req.json()) as CreateMeetingBody;
    if (!body.companyId || !body.title || !body.scheduledAt || !body.audienceType) {
      return jsonResponse(
        { error: "companyId, title, scheduledAt and audienceType are required" },
        400,
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: tokenRow, error: tokenError } = await admin
      .from("google_calendar_tokens")
      .select("refresh_token")
      .eq("tpo_id", callerData.user.id)
      .maybeSingle();

    if (tokenError) {
      return jsonResponse({ error: tokenError.message }, 500);
    }
    if (!tokenRow) {
      return jsonResponse({ error: "Connect your Google account first." }, 400);
    }

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokenRow.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const refreshJson = await refreshRes.json();
    if (!refreshRes.ok) {
      return jsonResponse({
        error: refreshJson.error_description ||
          "Failed to refresh your Google token. Reconnect your Google account.",
      }, 400);
    }
    const accessToken = refreshJson.access_token as string;

    const durationMinutes = body.durationMinutes ?? 30;
    const startIso = new Date(body.scheduledAt).toISOString();
    const endIso = new Date(new Date(body.scheduledAt).getTime() + durationMinutes * 60_000)
      .toISOString();

    const attendees = body.hrEmail ? [{ email: body.hrEmail }] : [];

    const calendarRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          summary: body.title,
          description: body.hrName ? `HR contact: ${body.hrName}` : undefined,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
          attendees,
          conferenceData: {
            createRequest: { requestId: crypto.randomUUID() },
          },
        }),
      },
    );
    const calendarJson = await calendarRes.json();
    if (!calendarRes.ok) {
      return jsonResponse(
        { error: calendarJson.error?.message || "Failed to create the calendar event" },
        400,
      );
    }

    const meetLink: string | null = calendarJson.hangoutLink ?? null;

    const { data: meeting, error: insertError } = await admin
      .from("meetings")
      .insert({
        company_id: body.companyId,
        title: body.title,
        scheduled_at: startIso,
        duration_minutes: durationMinutes,
        hr_name: body.hrName || null,
        hr_email: body.hrEmail || null,
        audience_type: body.audienceType,
        branch: body.audienceType === "branch" ? body.branch ?? null : null,
        year_of_study: body.audienceType === "branch" ? body.yearOfStudy ?? null : null,
        student_ids: body.audienceType === "students" ? body.studentIds ?? [] : [],
        meet_link: meetLink,
        created_by: callerData.user.id,
      })
      .select()
      .single();

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }

    return jsonResponse({ meeting }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
