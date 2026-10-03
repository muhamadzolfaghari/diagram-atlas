import { Link } from 'react-router-dom'
import { ArrowUpRight, Database, Shapes, Network, ChartNoAxesCombined, GitBranch, Lock } from 'lucide-react'
import { SectionHeader } from '../components/ui.jsx'
import { DIAGRAM_TEMPLATES } from '../components/templates.js'

const families = [
  { icon: Database, title: 'Entity relationships', query: 'erDiagram', desc: 'Model tables, keys, and relationships in a database schema.' },
  { icon: Shapes, title: 'UML models', query: 'UML', desc: 'Explore all 14 UML diagram categories through native and adapted templates, including class, sequence, state, activity, and deployment.' },
  { icon: Network, title: 'Architecture & systems', query: 'architecture', desc: 'Describe services, cloud infrastructure, C4 contexts, and dependencies.' },
  { icon: ChartNoAxesCombined, title: 'Charts & planning', query: 'chart', desc: 'Visualize data with pie, XY, and Sankey charts; plan with Gantt charts and timelines.' },
  { icon: GitBranch, title: 'Flows & mindmaps', query: 'mindmap', desc: 'Map decisions, organize ideas, and communicate how a process works.' },
  { icon: Lock, title: 'Your work stays local', to: '/saved', desc: 'Keep named diagrams and version snapshots in your browser, without creating an account.' },
]

export default function Compare() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeader eyebrow="Explore DiagramAtlas" title="One workspace for many kinds of thinking" desc="From ER schemas and UML models to charts and architecture: choose the view that makes your idea clear." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {families.map((f) => <Link key={f.title} to={f.to || `/templates?q=${encodeURIComponent(f.query)}`} className="glass card-hover rounded-2xl p-6">
          <div className="flex items-center justify-between"><f.icon className="size-6 text-indigo-300" /><ArrowUpRight className="size-4 text-slate-500" /></div>
          <h2 className="mt-5 font-semibold text-white">{f.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
        </Link>)}
      </div>
      <div className="glass mt-8 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold">From source to a shareable diagram</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">01 · Create</p><p className="mt-2 text-sm text-slate-400">Start from {DIAGRAM_TEMPLATES.length} templates, write Mermaid or Graphviz, or import Mermaid, XMind, and PlantUML files.</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">02 · Refine</p><p className="mt-2 text-sm text-slate-400">See changes on the canvas, adjust the diagram theme, and switch between source, preview, and split view.</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">03 · Export</p><p className="mt-2 text-sm text-slate-400">Save SVG, PNG, PDF, Mermaid source, or an interactive HTML view. Export mindmaps to XMind.</p></div>
        </div>
        <Link to="/studio" className="btn-primary mt-7">Open studio <ArrowUpRight className="size-4" /></Link>
      </div>
    </div>
  )
}
