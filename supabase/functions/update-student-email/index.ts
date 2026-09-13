// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> Create function -> name it "update-student-email" -> paste this code).
// No extra secrets needed -- it uses the auto-provided SUPABASE_SERVICE_ROLE_KEY.
//
// Changes a student's login email (as a TPO action) and returns a one-time
// recovery link the student can open to sign in and set a new password --
// no confirmation email round-trip required.
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

    const { studentId, newEmail, redirectTo } = await req.json();
    if (
      typeof studentId !== "string" ||
      typeof newEmail !== "string" ||
      !newEmail.includes("@")
    ) {
      return jsonResponse({ error: "studentId and a valid newEmail are required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(studentId, {
      email: newEmail,
      email_confirm: true,
    });
    if (updateAuthError) {
      return jsonResponse({ error: updateAuthError.message }, 400);
    }

    const { error: updateProfileError } = await admin
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", studentId);
    if (updateProfileError) {
      return jsonResponse({ error: updateProfileError.message }, 400);
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: newEmail,
      options: typeof redirectTo === "string" ? { redirectTo } : undefined,
    });
    if (linkError) {
      return jsonResponse({ error: linkError.message }, 400);
    }

    return jsonResponse({ link: linkData.properties?.action_link ?? null }, 200);
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
