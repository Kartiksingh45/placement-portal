import type { Drive, StudentProfile } from '../types/database'

export interface MatchResult {
  eligible: boolean
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  cgpaOk: boolean
  branchOk: boolean
}

function normalize(values: string[]): string[] {
  return values.map((v) => v.trim().toLowerCase()).filter(Boolean)
}

export function computeMatch(
  student: Pick<StudentProfile, 'cgpa' | 'branch' | 'skills'> | null,
  drive: Pick<Drive, 'min_cgpa' | 'eligible_branches' | 'required_skills'>,
): MatchResult {
  const studentSkills = normalize(student?.skills ?? [])
  const eligibleBranches = normalize(drive.eligible_branches)
  const requiredSkills = normalize(drive.required_skills)

  const cgpaOk = drive.min_cgpa <= 0 || (student?.cgpa != null && student.cgpa >= drive.min_cgpa)

  const branchOk =
    eligibleBranches.length === 0 ||
    eligibleBranches.includes('all') ||
    (student?.branch != null && eligibleBranches.includes(student.branch.trim().toLowerCase()))

  const matchedSkills = requiredSkills.filter((s) => studentSkills.includes(s))
  const missingSkills = requiredSkills.filter((s) => !studentSkills.includes(s))
  const skillRatio = requiredSkills.length === 0 ? 1 : matchedSkills.length / requiredSkills.length

  const score = Math.round(
    (branchOk ? 40 : 0) + (cgpaOk ? 20 : 0) + skillRatio * 40,
  )

  return {
    eligible: cgpaOk && branchOk,
    score,
    matchedSkills,
    missingSkills,
    cgpaOk,
    branchOk,
  }
}
