// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> Create function -> name it "invite-tpo" -> paste this code).
// Requires the SUPABASE_SERVICE_ROLE_KEY (auto-provided) -- no extra secrets needed.
//
// Lets an existing approved TPO invite a new placement officer by email.
// Creates the auth user via Supabase's invite flow (which emails them a link
// to set a password) and tags them with role: 'tpo' via user metadata, so the
// handle_new_user trigger creates their profile pre-approved as TPO.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const { email, fullName, redirectTo } = await req.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return jsonResponse({ error: "A valid email is required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName || "", role: "tpo" },
        redirectTo: typeof redirectTo === "string" ? redirectTo : undefined,
      },
    );

    if (inviteError) {
      return jsonResponse({ error: inviteError.message }, 400);
    }

    return jsonResponse({ invited: true, userId: invited.user?.id ?? null }, 200);
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
