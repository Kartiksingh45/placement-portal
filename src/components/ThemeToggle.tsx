import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/theme-context'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark or light mode"
      className={`inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-colors cursor-pointer ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
