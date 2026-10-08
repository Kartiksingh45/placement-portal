// Deno Edge Function. Deploy by pasting this file into the Supabase Dashboard
// (Edge Functions -> Create function -> name it "mock-interview"). Reuses the
// GEMINI_API_KEY secret already set up for parse-resume.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.8-flash";
const MAX_QUESTIONS = 5;

const PERSONA =
  "You are a friendly but rigorous technical interviewer conducting a short mock placement " +
  "interview for a college student. Keep questions concise (1-3 sentences) and appropriate " +
  "to the student's stated skills and experience level.";

interface StudentProfileRow {
  branch: string | null;
  skills: string[] | null;
  resume_parsed: { summary?: string } | null;
}

interface InterviewTurnRow {
  id: string;
  order_index: number;
  question: string;
  answer: string | null;
}

async function callGemini(
  systemInstruction: string,
  prompt: string,
  schema: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${await res.text()}`);
  }

  const json = await res.json();
  const text: string | undefined = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini did not return structured data");
  return JSON.parse(text);
}

function resumeContext(sp: StudentProfileRow | null): string {
  if (!sp) return "No resume on file — ask a general-purpose technical/CS fundamentals question.";
  const skills = sp.skills?.length ? sp.skills.join(", ") : "unknown";
  const branch = sp.branch || "unknown";
  const summary = sp.resume_parsed?.summary || "";
  return `Branch: ${branch}\nSkills: ${skills}${summary ? `\nSummary: ${summary}` : ""}`;
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }
    const userId = userData.user.id;

    if (!GEMINI_API_KEY) {
      return jsonResponse({ error: "Server is missing GEMINI_API_KEY" }, 500);
    }

    const body = await req.json();
    const action = body.action;

    if (action === "start") {
      const { data: sp } = await supabase
        .from("student_profiles")
        .select("branch, skills, resume_parsed")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: session, error: sessionError } = await supabase
        .from("interview_sessions")
        .insert({ student_id: userId, status: "in_progress" })
        .select()
        .single();
      if (sessionError) return jsonResponse({ error: sessionError.message }, 500);

      const result = await callGemini(
        PERSONA,
        `Candidate resume summary:\n${resumeContext(sp as StudentProfileRow)}\n\nAsk the first interview question.`,
        {
          type: "OBJECT",
          properties: { question: { type: "STRING" } },
          required: ["question"],
        },
      );

      const { data: turn, error: turnError } = await supabase
        .from("interview_turns")
        .insert({ session_id: session.id, order_index: 0, question: result.question })
        .select()
        .single();
      if (turnError) return jsonResponse({ error: turnError.message }, 500);

      return jsonResponse({ sessionId: session.id, turn }, 200);
    }

    if (action === "answer") {
      const { sessionId, turnId, answer } = body;
      if (!sessionId || !turnId || typeof answer !== "string") {
        return jsonResponse({ error: "Missing sessionId/turnId/answer" }, 400);
      }

      const { data: session, error: sessionFetchError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("student_id", userId)
        .single();
      if (sessionFetchError || !session) return jsonResponse({ error: "Session not found" }, 404);

      const { data: currentTurn, error: turnFetchError } = await supabase
        .from("interview_turns")
        .select("*")
        .eq("id", turnId)
        .single();
      if (turnFetchError || !currentTurn) return jsonResponse({ error: "Turn not found" }, 404);

      const { data: priorTurns } = await supabase
        .from("interview_turns")
        .select("order_index, question, answer")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      const { data: sp } = await supabase
        .from("student_profiles")
        .select("branch, skills, resume_parsed")
        .eq("user_id", userId)
        .maybeSingle();

      const historyText = ((priorTurns ?? []) as InterviewTurnRow[])
        .filter((t) => t.order_index < currentTurn.order_index)
        .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer ?? ""}`)
        .join("\n\n");

      const isLastTurn = currentTurn.order_index >= MAX_QUESTIONS - 1;

      const prompt = `Candidate resume summary:\n${resumeContext(sp as StudentProfileRow)}\n\n${
        historyText ? `Earlier in this interview:\n${historyText}\n\n` : ""
      }Latest question: ${currentTurn.question}\nCandidate's answer: ${answer}\n\nScore the latest answer on a scale of 0 to 100 (0 = no answer/completely wrong, 100 = expert-level, fully correct answer) based on technical correctness, clarity, and depth. Give brief constructive feedback (1-2 sentences).${
        isLastTurn
          ? " This was the final question of the interview."
          : " Then ask the next interview question (different topic or a deeper follow-up)."
      }`;

      const schema = isLastTurn
        ? {
            type: "OBJECT",
            properties: {
              score: { type: "INTEGER", description: "Score from 0 to 100" },
              feedback: { type: "STRING" },
              overall_summary: { type: "STRING" },
            },
            required: ["score", "feedback", "overall_summary"],
          }
        : {
            type: "OBJECT",
            properties: {
              score: { type: "INTEGER", description: "Score from 0 to 100" },
              feedback: { type: "STRING" },
              next_question: { type: "STRING" },
            },
            required: ["score", "feedback", "next_question"],
          };

      const result = await callGemini(PERSONA, prompt, schema);
      const score = result.score as number;
      const feedback = result.feedback as string;

      await supabase
        .from("interview_turns")
        .update({ answer, score, feedback })
        .eq("id", turnId);

      if (isLastTurn) {
        const { data: allTurns } = await supabase
          .from("interview_turns")
          .select("score")
          .eq("session_id", sessionId);
        const scores = (allTurns ?? [])
          .map((t: { score: number | null }) => t.score)
          .filter((s): s is number => typeof s === "number");
        const overallScore =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : score;
        const overallSummary = result.overall_summary as string;

        await supabase
          .from("interview_sessions")
          .update({
            status: "completed",
            overall_score: overallScore,
            feedback_summary: overallSummary,
            ended_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        return jsonResponse(
          {
            sessionComplete: true,
            evaluatedTurn: { score, feedback },
            summary: { overall_score: overallScore, feedback_summary: overallSummary },
          },
          200,
        );
      }

      const nextQuestion = result.next_question as string;
      const { data: nextTurn, error: nextTurnError } = await supabase
        .from("interview_turns")
        .insert({
          session_id: sessionId,
          order_index: currentTurn.order_index + 1,
          question: nextQuestion,
        })
        .select()
        .single();
      if (nextTurnError) return jsonResponse({ error: nextTurnError.message }, 500);

      return jsonResponse(
        { sessionComplete: false, evaluatedTurn: { score, feedback }, turn: nextTurn },
        200,
      );
    }

    return jsonResponse({ error: "Unknown action" }, 400);
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
