import { cn } from '../lib/format.js'

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'border-white/10 bg-white/5 text-slate-300',
    indigo: 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300',
    green: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
    amber: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
    rose: 'border-rose-400/30 bg-rose-500/15 text-rose-300',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', tones[tone])}>
      {children}
    </span>
  )
}

export function SectionHeader({ eyebrow, title, desc, align = 'center' }) {
  const centered = align === 'center'
  return (
    <div className={cn('max-w-3xl', centered ? 'mx-auto text-center' : 'text-left')}>
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-300">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{desc}</p>}
    </div>
  )
}

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 font-semibold text-white">{title}</div>
      {desc && <div className="mt-1 max-w-sm text-sm text-slate-400">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-xl font-extrabold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}
