import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Briefcase, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/auth-context'

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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <aside className="w-64 shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-700">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Placement Portal</p>
            <p className="text-xs text-slate-400 leading-tight">{roleLabel}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.id === activeId
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
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

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
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
