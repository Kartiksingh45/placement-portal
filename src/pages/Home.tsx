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
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Table,
  Users,
  Video,
} from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { JobTicker } from '../components/JobTicker'
import { ThemeToggle } from '../components/ThemeToggle'
import { Logo } from '../components/Logo'

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
    <div className="bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-6 space-y-3 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/30 to-emerald-500/20 flex items-center justify-center text-blue-300 shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

function DotGrid({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 opacity-25 ${className}`}
      style={{
        backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }}
    />
  )
}

function HeroIllustration() {
  return (
    <div className="relative h-[320px] sm:h-[380px] flex items-center justify-center">
      <DotGrid className="rounded-3xl" />
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/30 to-emerald-400/20 blur-3xl" />

      <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-slate-800/70 border border-slate-700 backdrop-blur">
        <Users className="w-20 h-20 sm:w-24 sm:h-24 text-blue-300" />

        <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center animate-[float_7s_ease-in-out_infinite]">
          <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
        </div>
        <div className="absolute -bottom-5 -left-5 sm:-bottom-6 sm:-left-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center animate-[float_8s_ease-in-out_infinite_1s]">
          <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
        </div>
      </div>

      <Sparkles className="absolute bottom-2 right-4 sm:right-10 w-7 h-7 sm:w-8 sm:h-8 text-emerald-300/70 animate-[float_6s_ease-in-out_infinite_2s]" />
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0 shrink-0">
            <Logo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            <span className="font-bold tracking-tight text-sm sm:text-base whitespace-nowrap">
              UPATH
            </span>
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
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors px-1.5 sm:px-2 whitespace-nowrap"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
            <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase">
              Streamline the placement cycle. In one place
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Placements, run{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                without the chaos
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Students get AI-assisted resume screening, a resume builder with an ATS
              compatibility checker, and AI-powered mock interviews. Placement officers get
              applicant tracking, eligibility filtering, drive management, and one-click video
              interviews with company HRs — all in one dashboard.
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

          <div className="animate-[fadeInUp_0.6s_ease-out]">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section id="opportunities" className="border-t border-slate-800 py-16">
        <div className="max-w-2xl mx-auto px-6">
          <JobTicker />
        </div>
      </section>

      <section id="students" className="border-t border-slate-800 py-16 bg-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-2">
              Students
            </p>
            <h2 className="text-3xl font-bold">
              Elevate your application game.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Prepare, apply, and track everything.
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureCard
              icon={FileEdit}
              title="Resume builder & checker"
              description="Build a standout resume with real-time editing. Our AI checks ATS compatibility, gives instant feedback, and suggests concrete improvements."
            />
            <FeatureCard
              icon={Mic}
              title="AI mock interviews"
              description="Practice with an AI interviewer across domains. Get real-time feedback on communication, technical knowledge, and areas to improve."
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

      <section id="officers" className="border-t border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide mb-2">
              Placement officers
            </p>
            <h2 className="text-3xl font-bold">
              Run placements like clockwork.{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Verify, manage, and schedule.
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        © 2026 UPATH — University Placement And Transition Hub
      </footer>
    </div>
  )
}
