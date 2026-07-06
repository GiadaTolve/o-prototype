'use client'

import type { ReactNode } from 'react'

export type MercatoTabId = 'banco' | 'piazza' | 'smantellamento' | 'immobiliare'

const TABS: { id: MercatoTabId; label: string }[] = [
  { id: 'banco', label: 'Il Banco' },
  { id: 'piazza', label: 'La Piazza' },
  { id: 'smantellamento', label: 'Officina' },
  { id: 'immobiliare', label: 'Immobiliare' },
]

type TabBarProps = {
  tab: MercatoTabId
  onTab: (id: MercatoTabId) => void
  rem?: number
}

export function MercatoTabBar({ tab, onTab, rem }: TabBarProps) {
  return (
    <div className="shrink-0 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-color)] pb-0">
      <div className="flex gap-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={`px-3 py-2.5 text-[10px] uppercase tracking-wider font-display border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'text-[var(--accent-gold)] border-[var(--accent-gold)]'
                : 'text-gray-500 border-transparent hover:text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {rem != null && (
        <p className="pb-2 text-[10px] uppercase tracking-widest text-gray-500 font-display tabular-nums">
          <span className="text-[var(--accent-gold)] text-sm normal-case tracking-normal">{rem}</span> Rem
        </p>
      )}
    </div>
  )
}

type SectionProps = {
  title: string
  hint?: string
  children: ReactNode
  className?: string
}

export function MercatoSection({ title, hint, children, className = '' }: SectionProps) {
  return (
    <section
      className={`rounded-lg border border-[var(--border-color)] bg-black/25 overflow-hidden ${className}`}
    >
      <header className="px-3 py-2 border-b border-[var(--border-color)]/70 bg-black/30">
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">{title}</h4>
        {hint && <p className="text-[10px] text-[var(--accent-violet-light)]/70 mt-0.5 leading-relaxed">{hint}</p>}
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

type RowProps = {
  title: string
  subtitle?: string
  trailing?: ReactNode
  actions: ReactNode
}

export function MercatoRow({ title, subtitle, trailing, actions }: RowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-between py-2 px-2.5 rounded border border-[var(--border-color)]/50 bg-black/20">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{title}</p>
        {subtitle && <p className="text-[10px] text-[var(--accent-violet-light)]/80 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {trailing}
        {actions}
      </div>
    </div>
  )
}

export function MercatoEmpty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500 py-1">{children}</p>
}

type BtnProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'gold' | 'violet' | 'danger'
}

export function MercatoActionButton({ label, onClick, disabled, variant = 'gold' }: BtnProps) {
  const styles =
    variant === 'danger'
      ? 'border-red-900/50 text-red-400 hover:bg-red-950/30'
      : variant === 'violet'
        ? 'border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10'
        : 'border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded border font-display disabled:opacity-50 ${styles}`}
    >
      {label}
    </button>
  )
}

export function MercatoNumInput({
  value,
  onChange,
  placeholder,
  className = 'w-14',
}: {
  value: number | string
  onChange: (n: number) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      type="number"
      min={1}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className={`${className} px-1.5 py-1 text-center text-xs rounded border border-[var(--border-color)] bg-black/50 text-white`}
    />
  )
}
