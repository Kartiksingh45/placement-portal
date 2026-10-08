// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> Create function -> name it "check-resume" -> paste this code).
// Requires the same GEMINI_API_KEY secret used by parse-resume (Edge Functions -> Secrets).
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
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.8-flash";

const CHECK_SCHEMA = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER", description: "ATS compatibility score from 0 to 100" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    suggestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Specific, actionable improvements",
    },
  },
  required: ["score", "strengths", "suggestions"],
};

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

    if (!GEMINI_API_KEY) {
      return jsonResponse({ error: "Server is missing GEMINI_API_KEY" }, 500);
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "Act as an ATS (applicant tracking system) resume reviewer for a campus " +
                    "placement portal. Given this resume data as JSON, return a compatibility " +
                    "score (0-100), a list of genuine strengths, and specific, actionable " +
                    "suggestions to improve it. Resume data:\n\n" + JSON.stringify(resume),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: CHECK_SCHEMA,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return jsonResponse({ error: `Gemini API error: ${errText}` }, 502);
    }

    const geminiJson = await geminiRes.json();
    const text: string | undefined = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return jsonResponse({ error: "Gemini did not return structured data" }, 502);
    }

    let result: { score: number; strengths: string[]; suggestions: string[] };
    try {
      result = JSON.parse(text);
    } catch {
      return jsonResponse({ error: "Gemini returned invalid JSON" }, 502);
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
