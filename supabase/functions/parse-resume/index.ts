// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> parse-resume -> Code) and setting the GROQ_API_KEY
// secret (Edge Functions -> Secrets). Get a free key at console.groq.com
// (no credit card required).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_MODEL = "openai/gpt-oss-120b";

const RESUME_SHAPE = `{
  "full_name": <string>,
  "phone": <string>,
  "branch": <string, degree/branch of study e.g. Computer Science>,
  "batch_year": <integer, expected or actual graduation year>,
  "cgpa": <number>,
  "skills": [<string>, ...],
  "certifications": [<string>, ...],
  "education": [{"institution": <string>, "degree": <string>, "year": <string>}, ...],
  "experience": [{"title": <string>, "company": <string>, "duration": <string>}, ...],
  "summary": <string>
}`;

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

    if (!GROQ_API_KEY) {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Server is missing GROQ_API_KEY" }, 500);
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(path);

    if (downloadError || !fileBlob) {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Failed to download resume" }, 500);
    }

    let resumeText: string;
    try {
      const pdf = await getDocumentProxy(new Uint8Array(await fileBlob.arrayBuffer()));
      const { text } = await extractText(pdf, { mergePages: true });
      resumeText = text;
    } catch {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Could not read text from this PDF" }, 422);
    }

    if (!resumeText || !resumeText.trim()) {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "No extractable text found in this PDF" }, 422);
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
              "Extract this student's resume into a single valid JSON object, no markdown, " +
              "no commentary. Omit fields you cannot find rather than guessing. Match exactly " +
              `this shape: ${RESUME_SHAPE}`,
          },
          {
            role: "user",
            content: `Resume text:\n\n${resumeText.slice(0, 15000)}`,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      await markFailed(supabase, userId);
      const errText = await groqRes.text();
      return jsonResponse({ error: `Groq API error: ${errText}` }, 502);
    }

    const groqJson = await groqRes.json();
    const text: string | undefined = groqJson.choices?.[0]?.message?.content;

    if (!text) {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Groq did not return content" }, 502);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      await markFailed(supabase, userId);
      return jsonResponse({ error: "Groq returned invalid JSON" }, 502);
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
