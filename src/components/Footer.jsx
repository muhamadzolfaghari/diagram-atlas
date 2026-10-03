import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-400">
          <span className="font-bold text-white">DiagramAtlas</span> — Universal diagram & chart studio · MIT · © 2026
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-400">
          <Link className="hover:text-white" to="/studio">Studio</Link>
          <Link className="hover:text-white" to="/templates">Templates</Link>
          <Link className="hover:text-white" to="/saved">My diagrams</Link>
          <Link className="hover:text-white" to="/formats">Formats & features</Link>
          <a className="hover:text-white" href="https://mermaid.js.org/intro/syntax-reference.html" target="_blank" rel="noreferrer">Mermaid docs ↗</a>
          <a className="hover:text-white" href="https://github.com/muhamadzolfaghari/diagram-atlas" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </div>
    </footer>
  )
}
