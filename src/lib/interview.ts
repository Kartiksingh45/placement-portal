import { supabase } from './supabase'
import type { InterviewSession, InterviewTurn } from '../types/database'

export interface EvaluatedTurn {
  score: number
  feedback: string
}

export interface StartInterviewResult {
  sessionId: string
  turn: InterviewTurn
}

export interface AnswerResult {
  sessionComplete: boolean
  evaluatedTurn: EvaluatedTurn
  turn?: InterviewTurn
  summary?: { overall_score: number; feedback_summary: string }
}

interface FunctionErrorPayload {
  error?: string
}

export async function startInterview(): Promise<StartInterviewResult> {
  const { data, error } = await supabase.functions.invoke<StartInterviewResult & FunctionErrorPayload>(
    'mock-interview',
    { body: { action: 'start' } },
  )
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data) throw new Error('No data returned from mock-interview')
  return data
}

export async function submitAnswer(
  sessionId: string,
  turnId: string,
  answer: string,
): Promise<AnswerResult> {
  const { data, error } = await supabase.functions.invoke<AnswerResult & FunctionErrorPayload>(
    'mock-interview',
    { body: { action: 'answer', sessionId, turnId, answer } },
  )
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data) throw new Error('No data returned from mock-interview')
  return data
}

export async function fetchMyInterviewSessions(studentId: string): Promise<InterviewSession[]> {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as InterviewSession[]
}
