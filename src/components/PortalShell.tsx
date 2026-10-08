import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/auth-context'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from './Logo'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: number
}

export function PortalShell({
  navItems,
  activeId,
  onSelect,
  roleLabel,
  children,
}: {
  navItems: NavItem[]
  activeId: string
  onSelect: (id: string) => void
  roleLabel: string
  children: ReactNode
}) {
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  function selectAndClose(id: string) {
    onSelect(id)
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <div className="sm:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-7 h-7" />
          <p className="text-sm font-semibold">UPATH</p>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'w-64 shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200',
          'sm:static sm:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-slate-700">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-9 h-9 shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-tight">UPATH</p>
              <p className="text-[10px] text-slate-500 leading-tight">
                University Placement And Transition Hub
              </p>
              <p className="text-xs text-slate-400 leading-tight mt-0.5">{roleLabel}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="sm:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.id === activeId
            return (
              <button
                key={item.id}
                onClick={() => selectAndClose(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {!!item.badge && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700 space-y-3">
          <div className="px-3">
            <p className="text-sm font-medium truncate">{profile?.full_name || 'Loading…'}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={() => void signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 pt-20 sm:p-8 overflow-y-auto overflow-x-hidden">
        <div className="pb-6 mb-6 border-b border-slate-800">
          <Link to="/" className="inline-flex items-center gap-3">
            <Logo className="w-9 h-9 shrink-0" />
            <span>
              <span className="block text-lg font-bold tracking-tight leading-tight">UPATH</span>
              <span className="block text-xs text-slate-500 leading-tight">
                University Placement And Transition Hub
              </span>
            </span>
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="border border-dashed border-slate-700 rounded-2xl p-10 text-center">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm text-slate-400">This section is coming in a future milestone.</p>
    </div>
  )
}
