import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

export function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const trimmed = draft.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-300">{label}</label>
      <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-600">
        {values.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== tag))}
              className="cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={placeholder}
          className="flex-1 min-w-[8ch] bg-transparent text-sm focus:outline-none"
        />
      </div>
    </div>
  )
}
