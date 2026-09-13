// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> parse-resume -> Code) and setting the GEMINI_API_KEY
// secret (Edge Functions -> Secrets). Get a free key at aistudio.google.com/apikey
// (no credit card required, generous free-tier quota).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.6-flash";

// Gemini's structured-output schema uses uppercase type names (OpenAPI-subset), unlike JSON Schema.
const RESUME_SCHEMA = {
  type: "OBJECT",
  properties: {
    full_name: { type: "STRING" },
    phone: { type: "STRING" },
    branch: { type: "STRING", description: "Degree/branch of study, e.g. Computer Science" },
    batch_year: { type: "INTEGER", description: "Expected or actual graduation year" },
    cgpa: { type: "NUMBER" },
    skills: { type: "ARRAY", items: { type: "STRING" } },
    certifications: { type: "ARRAY", items: { type: "STRING" } },
    education: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          institution: { type: "STRING" },
          degree: { type: "STRING" },
          year: { type: "STRING" },
        },
      },
    },
    experience: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          company: { type: "STRING" },
          duration: { type: "STRING" },
        },
      },
    },
    summary: { type: "STRING" },
  },
  required: ["skills", "certifications"],
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

    const { path } = await req.json();
    if (typeof path !== "string" || !path.startsWith(`${userId}/`)) {
      return jsonResponse({ error: "Invalid resume path" }, 400);
    }

    await supabase.from("student_profiles").upsert({
      user_id: userId,
      resume_url: path,
      resume_status: "processing",
    });

    if (!GEMINI_API_KEY) {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Server is missing GEMINI_API_KEY" }, 500);
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(path);

    if (downloadError || !fileBlob) {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Failed to download resume" }, 500);
    }

    const base64 = encodeBase64(await fileBlob.arrayBuffer());

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
                { inlineData: { mimeType: "application/pdf", data: base64 } },
                {
                  text:
                    "Extract this student's resume into the given JSON schema. Omit fields you cannot find rather than guessing.",
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESUME_SCHEMA,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      await markFailed(supabase, userId);
      const errText = await geminiRes.text();
      return jsonResponse({ error: `Gemini API error: ${errText}` }, 502);
    }

    const geminiJson = await geminiRes.json();
    const text: string | undefined = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Gemini did not return structured data" }, 502);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Gemini returned invalid JSON" }, 502);
    }

    const { data: updated, error: updateError } = await supabase
      .from("student_profiles")
      .update({
        resume_parsed: parsed,
        resume_status: "parsed",
        branch: parsed.branch ?? null,
        batch_year: parsed.batch_year ?? null,
        cgpa: parsed.cgpa ?? null,
        phone: parsed.phone ?? null,
        skills: parsed.skills ?? [],
        certifications: parsed.certifications ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({ data: updated }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

async function markFailed(supabase: SupabaseClient, userId: string) {
  await supabase.from("student_profiles").update({ resume_status: "failed" }).eq(
    "user_id",
    userId,
  );
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function encodeBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
