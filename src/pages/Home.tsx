import { Link, Navigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  FileEdit,
  ListChecks,
  Megaphone,
  Mic,
  ShieldCheck,
  Table,
  Video,
} from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { JobTicker } from '../components/JobTicker'
import { ThemeToggle } from '../components/ThemeToggle'

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center text-blue-400 shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to={profile?.role === 'tpo' ? '/tpo' : '/student'} replace />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight">Campus Placement Portal</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#students" className="hover:text-white transition-colors">
              Students
            </a>
            <a href="#officers" className="hover:text-white transition-colors">
              Placement Officers
            </a>
            <a href="#opportunities" className="hover:text-white transition-colors">
              Opportunities
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-2"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
          <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase">
            The whole placement cycle, in one place
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Placements, run{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              without the chaos
            </span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Students get AI-assisted resume screening, a resume builder with an ATS compatibility
            checker, and AI-powered mock interviews. Placement officers get applicant tracking,
            eligibility filtering, drive management, and one-click video interviews with company
            HRs — all in one dashboard.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>

        <div id="opportunities" className="animate-[fadeInUp_0.6s_ease-out]">
          <JobTicker />
        </div>
      </section>

      <section id="students" className="border-t border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          <div>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-2">
              Students
            </p>
            <h2 className="text-2xl font-bold">Prepare, apply, and track it all</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <FeatureCard
              icon={FileEdit}
              title="Resume builder & checker"
              description="Build a resume with a live preview, download it as a PDF, and get an AI-scored ATS compatibility check with concrete suggestions."
            />
            <FeatureCard
              icon={Mic}
              title="AI mock interviews"
              description="Practice with an AI interviewer and get feedback before the real thing."
            />
            <FeatureCard
              icon={ListChecks}
              title="Eligibility-matched drives"
              description="See only the drives you're eligible for, apply in one click, and track your status."
            />
            <FeatureCard
              icon={Video}
              title="Direct HR video calls"
              description="Join scheduled Google Meet interviews with company HRs, straight from your dashboard."
            />
          </div>
        </div>
      </section>

      <section id="officers" className="border-t border-slate-800 py-16 bg-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          <div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide mb-2">
              Placement officers
            </p>
            <h2 className="text-2xl font-bold">Run the whole drive from one dashboard</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <FeatureCard
              icon={ShieldCheck}
              title="Verified sign-ups"
              description="Every student account is approved by you before they can sign in — no unverified accounts."
            />
            <FeatureCard
              icon={Table}
              title="Student records at scale"
              description="Browse, edit, and fix student data by year and branch, or bulk-handle unidentified records."
            />
            <FeatureCard
              icon={CalendarClock}
              title="One-click HR meetings"
              description="Schedule a call and get an auto-generated Google Meet link, sent straight to the right students."
            />
            <FeatureCard
              icon={Megaphone}
              title="Public job postings"
              description="Post opportunities with a photo and description — they show up live on this very homepage."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-slate-400 mb-6">Create an account in under a minute.</p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Sign up now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        © 2026 Campus Placement Portal
      </footer>
    </div>
  )
}
