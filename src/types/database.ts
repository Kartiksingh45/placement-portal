export type UserRole = 'student' | 'tpo'

export type ProfileStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  status: ProfileStatus
  created_at: string
}

export const BRANCH_OPTIONS = [
  'Computer Science Engineering',
  'Artificial Intelligence Engineering',
  'Robotics and Automation Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics Engineering',
  'Chemical Engineering',
] as const

export type Branch = (typeof BRANCH_OPTIONS)[number]

export const YEAR_OPTIONS = [1, 2, 3, 4] as const

export interface SignupDetails {
  collegeName: string
  rollNo: string
  yearOfStudy: (typeof YEAR_OPTIONS)[number]
  branch: Branch
}

export interface ResumeEducation {
  institution?: string
  degree?: string
  year?: string
}

export interface ResumeExperience {
  title?: string
  company?: string
  duration?: string
}

export interface ParsedResume {
  full_name?: string
  phone?: string
  branch?: string
  batch_year?: number
  cgpa?: number
  skills: string[]
  certifications: string[]
  education?: ResumeEducation[]
  experience?: ResumeExperience[]
  summary?: string
}

export interface StudentProfile {
  user_id: string
  branch: string | null
  college_name: string | null
  roll_no: string | null
  year_of_study: number | null
  batch_year: number | null
  cgpa: number | null
  phone: string | null
  skills: string[]
  certifications: string[]
  resume_url: string | null
  resume_parsed: ParsedResume | null
  resume_status: 'not_uploaded' | 'processing' | 'parsed' | 'failed'
  updated_at: string
}

export interface Meeting {
  id: string
  company_id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  hr_name: string | null
  hr_email: string | null
  audience_type: 'all' | 'branch' | 'students'
  branch: string | null
  year_of_study: number | null
  student_ids: string[]
  meet_link: string | null
  status: 'scheduled' | 'cancelled'
  created_by: string | null
  created_at: string
}

export interface StudentSequence {
  id: string
  company_id: string
  branch: string
  student_order: string[]
  updated_at: string
  updated_by: string | null
}

export interface Company {
  id: string
  name: string
  description: string | null
  website: string | null
  created_by: string | null
  created_at: string
}

export interface Drive {
  id: string
  company_id: string
  role_title: string
  description: string | null
  min_cgpa: number
  eligible_branches: string[]
  required_skills: string[]
  required_certifications: string[]
  deadline: string | null
  status: 'open' | 'closed'
  created_by: string | null
  created_at: string
}

export interface Application {
  id: string
  drive_id: string
  student_id: string
  status: 'applied' | 'shortlisted' | 'rejected' | 'selected'
  match_score: number | null
  applied_at: string
}

export interface InterviewSession {
  id: string
  student_id: string
  drive_id: string | null
  status: 'in_progress' | 'completed'
  overall_score: number | null
  feedback_summary: string | null
  started_at: string
  ended_at: string | null
}

export interface InterviewTurn {
  id: string
  session_id: string
  order_index: number
  question: string
  answer: string | null
  score: number | null
  feedback: string | null
  created_at: string
}

export interface Announcement {
  id: string
  message: string
  target_type: 'all' | 'student'
  target_student_id: string | null
  created_by: string | null
  created_at: string
}
