// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> Create function -> name it "google-oauth-callback" -> paste this code).
// Requires two secrets set under Edge Functions -> Secrets:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  (from a Google Cloud OAuth 2.0 Client ID)
//
// Exchanges the one-time authorization code from Google's OAuth consent screen
// for a refresh token, and stores it against the calling TPO's account so
// create-meeting can mint Google Meet links on their behalf later.
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

    const { code, redirectUri } = await req.json();
    if (typeof code !== "string" || typeof redirectUri !== "string") {
      return jsonResponse({ error: "code and redirectUri are required" }, 400);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      return jsonResponse(
        { error: tokenJson.error_description || tokenJson.error || "Token exchange failed" },
        400,
      );
    }

    if (!tokenJson.refresh_token) {
      return jsonResponse({
        error:
          "Google didn't return a refresh token (it only issues one on first consent). " +
          "Remove this app's access at https://myaccount.google.com/permissions and try connecting again.",
      }, 400);
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error: upsertError } = await admin.from("google_calendar_tokens").upsert({
      tpo_id: callerData.user.id,
      refresh_token: tokenJson.refresh_token,
      connected_email: userInfo.email ?? null,
      updated_at: new Date().toISOString(),
    });
    if (upsertError) {
      return jsonResponse({ error: upsertError.message }, 500);
    }

    return jsonResponse({ connectedEmail: userInfo.email ?? null }, 200);
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
