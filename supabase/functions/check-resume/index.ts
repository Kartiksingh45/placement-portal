// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> Create function -> name it "check-resume" -> paste this code).
// Requires a GROQ_API_KEY secret (Edge Functions -> Secrets). Get a free key at
// console.groq.com — no credit card required.
//
// Scores a student's resume data (either the parsed-from-upload version or the
// Resume Builder's structured version) and returns an ATS-style score plus
// concrete improvement suggestions. Also saves the result on student_profiles.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_MODEL = "llama-3.3-70b-versatile";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }
    const userId = userData.user.id;

    const { resume } = await req.json();
    if (!resume || typeof resume !== "object") {
      return jsonResponse({ error: "resume data is required" }, 400);
    }

    if (!GROQ_API_KEY) {
      return jsonResponse({ error: "Server is missing GROQ_API_KEY" }, 500);
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an ATS (applicant tracking system) resume reviewer for a campus " +
              "placement portal. Respond with ONLY a single valid JSON object, no markdown, " +
              'no commentary, matching exactly this shape: {"score": <integer 0-100>, ' +
              '"strengths": [<string>, ...], "suggestions": [<string>, ...]}. "score" is the ' +
              "ATS compatibility score. \"strengths\" are genuine strengths found. " +
              '"suggestions" are specific, actionable improvements.',
          },
          {
            role: "user",
            content: "Resume data as JSON:\n\n" + JSON.stringify(resume),
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return jsonResponse({ error: `Groq API error: ${errText}` }, 502);
    }

    const groqJson = await groqRes.json();
    const text: string | undefined = groqJson.choices?.[0]?.message?.content;
    if (!text) {
      return jsonResponse({ error: "Groq did not return content" }, 502);
    }

    let result: { score: number; strengths: string[]; suggestions: string[] };
    try {
      result = JSON.parse(text);
    } catch {
      return jsonResponse({ error: "Groq returned invalid JSON" }, 502);
    }

    await supabase
      .from("student_profiles")
      .update({ resume_check: result, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    return jsonResponse({ data: result }, 200);
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
