import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ArrowUpRight } from 'lucide-react'
import { DIAGRAM_TEMPLATES } from '../components/templates.js'
import { SectionHeader, Badge, EmptyState } from '../components/ui.jsx'

export default function Templates() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const cat = params.get('category') || 'All'
  const setFilter = (key, value, replace = false) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value && value !== 'All') next.set(key, value)
      else next.delete(key)
      return next
    }, { replace })
  }
  const cats = useMemo(() => ['All', ...new Set(DIAGRAM_TEMPLATES.map((t) => t.category))], [])
  const list = useMemo(() => {
    const query = q.toLowerCase().trim()
    return DIAGRAM_TEMPLATES.filter((t) => {
      const okCat = cat === 'All' || t.category === cat
      const okQ = !query || (t.title + t.kind + t.description + t.category + t.code).toLowerCase().includes(query)
      return okCat && okQ
    })
  }, [q, cat])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeader eyebrow={`${DIAGRAM_TEMPLATES.length} starters`} title="Template gallery" desc="Explore ER schemas, UML models, architecture, charts, and mindmaps. Choose a template to start editing." />
      <div className="glass mt-8 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <Search className="size-4 text-slate-500" />
          <input aria-label="Search templates" value={q} onChange={(e) => setFilter('q', e.target.value, true)} placeholder="Search title, kind, description…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} aria-pressed={cat === c} onClick={() => setFilter('category', c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${cat === c ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{c}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-6"><EmptyState icon="◈" title="No templates found" desc="Try a different keyword or category." /></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <Link key={t.id} to={`/studio?template=${t.id}`} className="glass card-hover group rounded-3xl p-5 text-left">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="indigo">{t.kind}</Badge>
                <ArrowUpRight className="size-4 text-slate-600 transition group-hover:text-indigo-300" />
              </div>
              <div className="mt-3 font-bold text-white">{t.title}</div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.category}</div>
              <div className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-slate-400">{t.description}</div>
              <pre className="mt-3 max-h-20 overflow-hidden rounded-xl border border-white/5 bg-black/40 p-2.5 font-mono text-[10.5px] leading-relaxed text-slate-500">{t.code.slice(0, 220)}…</pre>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
