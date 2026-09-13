import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, MicOff, Play, Volume2 } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import {
  fetchMyInterviewSessions,
  startInterview,
  submitAnswer,
  type EvaluatedTurn,
} from '../../lib/interview'
import type { InterviewSession, InterviewTurn } from '../../types/database'

interface HistoryEntry {
  question: string
  answer: string
  score: number
  feedback: string
}

interface SpeechRecognitionResultEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}

export default function InterviewSection() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<'idle' | 'active' | 'complete'>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentTurn, setCurrentTurn] = useState<InterviewTurn | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [answer, setAnswer] = useState('')
  const [summary, setSummary] = useState<{ overall_score: number; feedback_summary: string } | null>(
    null,
  )
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([])
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const speechCtor = getSpeechRecognitionCtor()

  useEffect(() => {
    if (!user) return
    fetchMyInterviewSessions(user.id)
      .then(setPastSessions)
      .catch(() => {
        /* non-critical */
      })
  }, [user])

  async function handleStart() {
    setStarting(true)
    setError(null)
    try {
      const result = await startInterview()
      setSessionId(result.sessionId)
      setCurrentTurn(result.turn)
      setHistory([])
      setSummary(null)
      setPhase('active')
      speak(result.turn.question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview')
    } finally {
      setStarting(false)
    }
  }

  async function handleSubmit() {
    if (!sessionId || !currentTurn || !answer.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitAnswer(sessionId, currentTurn.id, answer.trim())
      const evaluated: EvaluatedTurn = result.evaluatedTurn
      setHistory((prev) => [
        ...prev,
        {
          question: currentTurn.question,
          answer: answer.trim(),
          score: evaluated.score,
          feedback: evaluated.feedback,
        },
      ])
      setAnswer('')

      if (result.sessionComplete && result.summary) {
        setSummary(result.summary)
        setPhase('complete')
        if (user) fetchMyInterviewSessions(user.id).then(setPastSessions).catch(() => {})
      } else if (result.turn) {
        setCurrentTurn(result.turn)
        speak(result.turn.question)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleRecording() {
    if (!speechCtor) return
    if (recording) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new speechCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }
    }
    recognition.onend = () => setRecording(false)
    recognition.onerror = () => setRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mock Interviews</h1>
        <p className="text-slate-400 text-sm mt-1">
          AI-driven technical mock viva, tailored to your parsed resume.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {phase === 'idle' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
          <p className="text-sm text-slate-300">
            5 questions, scored individually with an overall report at the end.
          </p>
          <button
            onClick={handleStart}
            disabled={starting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {starting ? 'Starting…' : 'Start Mock Interview'}
          </button>
        </div>
      )}

      {phase === 'active' && currentTurn && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-slate-400">
                Question {currentTurn.order_index + 1} of 5
              </p>
              <button
                onClick={() => speak(currentTurn.question)}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Read question aloud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-medium">{currentTurn.question}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="Type your answer, or use the mic below…"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="flex items-center gap-2">
              {speechCtor && (
                <button
                  onClick={toggleRecording}
                  className={`inline-flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                    recording
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {recording ? 'Stop' : 'Record'}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || !answer.trim()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors ml-auto"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Evaluating…' : 'Submit answer'}
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Previous answers this session</p>
              {history.map((h, i) => (
                <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm">
                  <p className="text-slate-300">{h.question}</p>
                  <p className="text-slate-500 mt-1">{h.answer}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full">
                      {h.score}/100
                    </span>
                    <span className="text-xs text-slate-400">{h.feedback}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'complete' && summary && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
          <p className="text-xs text-slate-400">Overall score</p>
          <p className="text-3xl font-bold">{summary.overall_score}/100</p>
          <p className="text-sm text-slate-300">{summary.feedback_summary}</p>
          <button
            onClick={handleStart}
            disabled={starting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start another
          </button>
        </div>
      )}

      {pastSessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-slate-300">Past sessions</h2>
          {pastSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm"
            >
              <span className="text-slate-400">
                {new Date(s.started_at).toLocaleString()}
              </span>
              <span>
                {s.status === 'completed' ? (
                  <span className="text-blue-300">{s.overall_score}/100</span>
                ) : (
                  <span className="text-slate-500">In progress</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
