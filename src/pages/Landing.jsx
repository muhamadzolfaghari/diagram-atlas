import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Play, Sparkles, Star } from 'lucide-react'
import { DIAGRAM_TEMPLATES, getTemplateById } from '../components/templates.js'
import { renderMermaid, initMermaid } from '../utils/mermaid-renderer.js'
import { FEATURES, FAQS } from '../data/content.js'
import { SectionHeader, Badge } from '../components/ui.jsx'

const DEMOS = [
  { label: 'Cloud Architecture', id: 'service-architecture' },
  { label: 'OAuth2 Sequence', id: 'sequence-auth' },
  { label: 'Database ER', id: 'er-diagram' },
  { label: 'Roadmap Gantt', id: 'delivery-gantt' },
]

export default function Landing() {
  const nav = useNavigate()
  const [tab, setTab] = useState(0)
  const [code, setCode] = useState('')
  const [faqOpen, setFaqOpen] = useState(0)

  useEffect(() => { initMermaid('dark') }, [])
  useEffect(() => {
    const tpl = getTemplateById(DEMOS[tab].id)
    setCode(tpl.code)
    const stage = document.getElementById('hero-demo-stage')
    const pre = document.getElementById('hero-demo-code')
    if (pre) pre.textContent = tpl.code.slice(0, 900)
    if (stage) {
      stage.innerHTML = '<div class="text-sm text-slate-500 p-8">Rendering…</div>'
      renderMermaid(stage, tpl.code).then(() => {
        const svg = stage.querySelector('svg')
        if (svg) { svg.style.maxWidth = '100%'; svg.style.height = 'auto' }
      })
    }
  }, [tab])

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
          <div className="anim-in mx-auto max-w-4xl text-center">
            <button onClick={() => nav('/studio')} className="chip mx-auto !border-indigo-400/30 !bg-indigo-500/10 !text-indigo-200">
              <Sparkles className="size-3.5" /> DIAGRAMATLAS · FREE & OPEN SOURCE
            </button>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
              One studio. Every perspective.
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">Diagrams, models & charts.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-400 sm:text-lg">
              Model databases with ER diagrams, describe systems with UML, and explore ideas with charts and mindmaps. Bring your work from <b className="text-slate-200">XMind</b>, <b className="text-slate-200">Draw.io</b>, <b className="text-slate-200">PlantUML</b>, <b className="text-slate-200">D2</b>, <b className="text-slate-200">SQL DDL</b> and <b className="text-slate-200">Mermaid</b>.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => nav('/studio')} className="btn-primary !px-6 !py-3 !text-[15px]">Start diagramming <ArrowRight className="size-4" /></button>
              <a href="#demo" onClick={(e) => { e.preventDefault(); const demo = document.getElementById('demo'); demo?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); demo?.focus({ preventScroll: true }) }} className="btn-ghost !px-6 !py-3"><Play className="size-4" /> Interactive playground</a>
              <a href="https://github.com/muhamadzolfaghari/diagram-atlas" target="_blank" rel="noreferrer" className="btn-ghost !px-6 !py-3"><Star className="size-4" /> Source</a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-slate-400">
              {['Zero telemetry & private', 'No account required', 'Vector PDF · SVG · 4K PNG', 'Works offline'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><Check className="size-4 text-emerald-400" /> {t}</span>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-9 flex max-w-4xl flex-wrap justify-center gap-2" aria-label="Explore diagram types">
            {[['ER diagrams', 'erDiagram'], ['UML models', 'UML'], ['Architecture', 'architecture'], ['Charts & timelines', 'chart'], ['Mindmaps', 'mindmap']].map(([label, query]) => (
              <Link key={label} to={`/templates?q=${encodeURIComponent(query)}`} className="rounded-lg border border-white/10 bg-white/[0.025] px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-indigo-400/40 hover:bg-indigo-400/10">{label} ↗</Link>
            ))}
          </div>
          {/* playground */}
          <div id="demo" tabIndex={-1} className="glass anim-in mx-auto mt-12 max-w-6xl overflow-hidden rounded-3xl" style={{ animationDelay: '.15s' }}>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-rose-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /></div>
              <div className="flex flex-wrap gap-1.5">
                {DEMOS.map((d, i) => (
                  <button key={d.id} onClick={() => setTab(i)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${i === tab ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{d.label}</button>
                ))}
              </div>
              <button onClick={() => nav(`/studio?template=${DEMOS[tab].id}`)} className="btn-primary ml-auto !py-1.5 !text-xs">Open in Studio ↗</button>
            </div>
            <div className="grid md:grid-cols-2">
              <pre id="hero-demo-code" className="max-h-[380px] overflow-auto border-b border-white/10 p-5 font-mono text-[11.5px] leading-relaxed text-slate-300 md:border-b-0 md:border-r" />
              <div className="dot-grid min-h-[280px] max-h-[380px] overflow-auto bg-black/20 p-6">
                <div id="hero-demo-stage" className="mermaid-stage mx-auto w-fit" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES bento */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeader eyebrow="Engineered for developers & architects" title="A clearer way to work with complexity" desc="Write diagram code, see it take shape, and keep your work in your browser." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass card-hover rounded-3xl p-6">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-sky-500/20 text-indigo-200"><f.icon className="size-5" /></div>
              <h3 className="mt-4 font-bold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEMPLATES */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeader eyebrow="Starter templates" title="From database schemas to the big picture" desc="Production-ready templates. Click any card to open it directly in the studio." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIAGRAM_TEMPLATES.slice(0, 8).map((t) => (
              <button key={t.id} onClick={() => nav(`/studio?template=${t.id}`)} className="glass card-hover rounded-2xl p-5 text-left">
                <Badge tone="indigo">{t.kind}</Badge>
                <div className="mt-3 font-bold text-white">{t.title}</div>
                <div className="mt-1 line-clamp-2 text-[13px] text-slate-400">{t.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/templates" className="btn-ghost">Browse all {DIAGRAM_TEMPLATES.length} templates <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionHeader eyebrow="FAQ" title="Everything you need to know" />
        <div className="mt-8 grid gap-3">
          {FAQS.map((f, i) => (
            <div key={i} className={`glass overflow-hidden rounded-2xl ${faqOpen === i ? 'border-indigo-400/40' : ''}`}>
              <button aria-expanded={faqOpen === i} aria-controls={`faq-${i}`} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-white">
                {f.q}<ChevronDown className={`size-4 shrink-0 transition ${faqOpen === i ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen === i && <div id={`faq-${i}`} className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-slate-400">{f.a}</div>}
            </div>
          ))}
        </div>

        <div className="glass mt-10 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-sky-500/10 p-8 text-center sm:p-12">
          <h3 className="text-2xl font-extrabold text-white sm:text-3xl">Ready to build your next diagram?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">No accounts, no paywalls. Draft architecture and workflows in seconds.</p>
          <button onClick={() => nav('/studio')} className="btn-primary mx-auto mt-6 !px-8 !py-3.5 !text-base">Open DiagramAtlas</button>
        </div>
      </section>
    </div>
  )
}
