import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { PanelLeft, Download, Save, FolderOpen, Sparkles, Upload, Wand2, Check, X, FilePlus, Keyboard } from 'lucide-react'
import { DIAGRAM_TEMPLATES, getTemplateById } from '../components/templates.js'
import { StorageManager } from '../components/storage.js'
import { Exporter } from '../components/exporter.js'
import { parseXmindToMermaid, exportMermaidToXmindBlob } from '../utils/importers/xmind.js'
import { parsePlantUmlToMermaid } from '../utils/importers/plantuml.js'
import { useMermaid } from '../hooks/useMermaid.js'
import CanvasStage, { GridToggle } from '../components/CanvasStage.jsx'
import CodeEditor from '../components/CodeEditor.jsx'
import { Badge } from '../components/ui.jsx'
import { cn } from '../lib/format.js'

const STARTERS = [['dependency-overview', 'Flowchart'], ['class-diagram', 'UML class'], ['sequence-auth', 'Sequence'], ['er-diagram', 'ER schema'], ['mindmap-diagram', 'Mindmap'], ['delivery-gantt', 'Gantt']]
const BLANK = 'flowchart TD\n    Start([Start]) --> Process[Process task]\n    Process --> Done{{Complete}}'

export default function Studio() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const location = useLocation()
  const canvasApi = useRef(null)
  const fileRef = useRef(null)
  const exportRef = useRef(null)

  const [code, setCode] = useState(BLANK)
  const [title, setTitle] = useState('Untitled diagram')
  const [theme, setTheme] = useState(() => StorageManager.getTheme?.() || 'dark')
  const [grid, setGrid] = useState(() => StorageManager.getGridStyle?.() || 'dots')
  const [view, setView] = useState('split') // split | canvas | code
  const [rail, setRail] = useState(null) // templates | saved | ai | null
  const [tplQuery, setTplQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [snapLabel, setSnapLabel] = useState('')
  const [snapshots, setSnapshots] = useState(() => StorageManager.getSnapshots?.() || [])
  const [aiPrompt, setAiPrompt] = useState('')

  const { containerRef, status, error } = useMermaid(code, theme, view)

  // Open router state first, then URL templates or the saved local draft.
  useEffect(() => {
    const openedDiagram = location.state?.diagram
    if (typeof openedDiagram?.code === 'string') {
      setCode(openedDiagram.code)
      setTitle(openedDiagram.title || 'Untitled diagram')
      return
    }
    try {
      const pendingCode = sessionStorage.getItem('nodeflow_open_code')
      const pendingTitle = sessionStorage.getItem('nodeflow_open_title')
      if (pendingCode) {
        setCode(pendingCode)
        if (pendingTitle) setTitle(pendingTitle)
        sessionStorage.removeItem('nodeflow_open_code')
        sessionStorage.removeItem('nodeflow_open_title')
        setTimeout(() => canvasApi.current?.fit(), 200)
        return
      }
    } catch {}
    const tplId = params.get('template')
    const fresh = params.get('fresh')
    if (tplId && getTemplateById(tplId)) {
      const t = getTemplateById(tplId)
      setCode(t.code); setTitle(t.title)
      StorageManager.saveDraft?.(t.code, t.id)
    } else if (fresh) {
      setCode(BLANK); setTitle('New diagram')
    } else {
      const draft = StorageManager.getDraft?.()
      const tpl = StorageManager.getActiveTemplateId?.()
      if (draft) {
        setCode(draft)
        if (tpl && getTemplateById(tpl)) setTitle(getTemplateById(tpl).title)
      } else {
        const t = getTemplateById('dependency-overview')
        setCode(t.code); setTitle(t.title)
      }
      setSnapshots(StorageManager.getSnapshots?.() || [])
    }
    // eslint-disable-next-line
  }, [params, location.state])

  // autosave draft
  useEffect(() => {
    const t = setTimeout(() => StorageManager.saveDraft?.(code, ''), 600)
    return () => clearTimeout(t)
  }, [code])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const say = (m) => setToast(m)
  const saveDiagram = () => {
    try { StorageManager.saveDiagram(title || 'Untitled diagram', code); say('Diagram saved to My diagrams') }
    catch { say('Could not save. Check available browser storage.') }
  }
  useEffect(() => {
    if (!exportOpen) return
    const outside = (e) => { if (!exportRef.current?.contains(e.target)) setExportOpen(false) }
    const escape = (e) => { if (e.key === 'Escape') { setExportOpen(false); exportRef.current?.querySelector('button')?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [exportOpen])
  useEffect(() => {
    const shortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveDiagram() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); fileRef.current?.click() }
    }
    window.addEventListener('keydown', shortcuts)
    return () => window.removeEventListener('keydown', shortcuts)
  }, [code, title])
  const filteredTemplates = useMemo(() => {
    const q = tplQuery.toLowerCase().trim()
    if (!q) return DIAGRAM_TEMPLATES
    return DIAGRAM_TEMPLATES.filter((t) => (t.title + t.kind + t.category + t.description + t.code).toLowerCase().includes(q))
  }, [tplQuery])
  const savedList = useMemo(() => StorageManager.getSavedDiagrams?.() || [], [rail, toast])

  const loadTemplate = (id) => {
    const t = getTemplateById(id)
    setCode(t.code); setTitle(t.title)
    StorageManager.saveDraft?.(t.code, t.id)
    setRail(null)
    setTimeout(() => canvasApi.current?.fit(), 150)
  }

  const doExport = async (kind) => {
    setExportOpen(false)
    const el = containerRef.current
    try {
      if (kind === 'svg') Exporter.downloadSvg(el, title)
      else if (kind === 'png') { await Exporter.downloadPng(el, title, { scale: 2 }); say('PNG exported') }
      else if (kind === 'png4k') { await Exporter.downloadPng(el, title, { scale: 4 }); say('4K PNG exported') }
      else if (kind === 'pdf') { await Exporter.downloadPdf(el, title, { pageSize: 'fit', background: '#ffffff', padding: 32 }); say('PDF exported') }
      else if (kind === 'html') { Exporter.downloadStandaloneHtml(el, code, title); say('HTML exported') }
      else if (kind === 'mmd') { Exporter.downloadSource(code, title); say('Source downloaded') }
      else if (kind === 'copy-png') { await Exporter.copyImageToClipboard(el); say('Image copied to clipboard') }
      else if (kind === 'copy-md') { await Exporter.copyMarkdown(code); say('Markdown copied') }
      else if (kind === 'xmind') {
        if (!code.trim().startsWith('mindmap')) { say('XMind export needs a mindmap diagram'); return }
        const blob = await exportMermaidToXmindBlob(code, title)
        Exporter.downloadBlob(blob, `${Exporter.sanitizeFilename(title)}.xmind`)
        say('XMind exported')
      }
    } catch (e) { say(e.message || 'Export failed') }
  }

  const handleFile = async (file) => {
    if (!file) return
    try {
      if (file.name.endsWith('.xmind')) {
        const buf = await file.arrayBuffer()
        const { mermaidCode, title: t } = await parseXmindToMermaid(buf)
        setCode(mermaidCode); setTitle(t || file.name.replace(/\.[^.]+$/, ''))
        say('XMind imported')
      } else if (/\.puml$|\.plantuml$/.test(file.name)) {
        const text = await file.text()
        setCode(parsePlantUmlToMermaid(text)); setTitle(file.name.replace(/\.[^.]+$/, ''))
        say('PlantUML converted')
      } else {
        const text = await file.text()
        setCode(text); setTitle(file.name.replace(/\.[^.]+$/, ''))
      }
      setTimeout(() => canvasApi.current?.fit(), 150)
    } catch (e) { say('Import failed: ' + e.message) }
  }

  const saveSnapshot = () => {
    try {
      StorageManager.saveSnapshot?.(snapLabel || `v0.${snapshots.length + 1}`, title, code)
      setSnapLabel('')
      setSnapshots(StorageManager.getSnapshots?.() || [])
      say('Snapshot saved')
    } catch (e) { say('Snapshot failed') }
  }

  const quickAi = () => {
    // heuristic stub: wrap prompt into a flowchart so AI drawer feels alive without network
    const p = aiPrompt.trim()
    if (!p) { say('Describe a diagram first'); return }
    const words = p.split(/\s+/).slice(0, 6)
    const gen = `flowchart TD\n    Start([${words[0] || 'Start'}]) --> Step1[${p.slice(0, 32)}]\n    Step1 --> Step2[Review]\n    Step2 --> Done{{Ship}}`
    setCode(gen); setTitle(words.slice(0, 3).join(' ') || 'AI diagram')
    setRail(null); setAiPrompt('')
    setTimeout(() => canvasApi.current?.fit(), 150)
    say('AI draft generated locally')
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-3 py-4 sm:px-5">
      {/* top bar */}
      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5">
        <input aria-label="Diagram title" value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-[160px] flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm font-bold text-white outline-none hover:bg-white/5 focus:bg-white/5" />
        <Badge tone={error ? 'rose' : 'green'}>{error ? 'Check syntax' : 'Local draft'}</Badge>
        <div className="seg" aria-label="Workspace view">
          {[['split', 'Split'], ['canvas', 'Canvas'], ['code', 'Code']].map(([v, l]) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)} className={view === v ? 'active' : ''}>{l}</button>
          ))}
        </div>
        <select aria-label="Diagram theme" value={theme} onChange={(e) => { setTheme(e.target.value); StorageManager.setTheme?.(e.target.value) }} className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-slate-200 outline-none">
          {['dark', 'default', 'forest', 'neutral', 'base'].map((t) => <option key={t} value={t}>Theme: {t}</option>)}
        </select>
        <GridToggle grid={grid} onChange={(g) => { setGrid(g); StorageManager.setGridStyle?.(g) }} />
        <button onClick={saveDiagram} className="btn-ghost !py-2 !text-xs"><Save className="size-4" /> Save</button>
        <div ref={exportRef} className="relative">
          <button aria-expanded={exportOpen} aria-controls="export-options" onClick={() => setExportOpen(!exportOpen)} className="btn-primary !py-2 text-[13px]"><Download className="size-4" /> Export</button>
          {exportOpen && (
            <div id="export-options" aria-label="Export options" className="glass absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl p-1.5 shadow-2xl">
              {[['png', 'PNG image · 2×'], ['png4k', 'PNG image · 4×'], ['svg', 'SVG vector'], ['pdf', 'PDF document'], ['html', 'Interactive HTML'], ['xmind', 'XMind mindmap'], ['mmd', 'Mermaid source (.mmd)'], ['copy-png', 'Copy image'], ['copy-md', 'Copy Markdown']].map(([k, l]) => (
                <button key={k} onClick={() => doExport(k)} className="w-full rounded-xl px-3 py-2 text-left text-[13px] text-slate-200 hover:bg-white/10">{l}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="studio-layout flex min-h-[70vh] flex-col gap-3 md:flex-row">
        {/* icon rail */}
        <div className="glass flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl p-1.5 md:w-[76px] md:flex-col md:gap-1.5 md:rounded-2xl md:p-2">
          <RailBtn icon={<FilePlus className="size-4" />} label="New" onClick={() => { setCode(BLANK); setTitle('New diagram') }} />
          <RailBtn icon={<PanelLeft className="size-4" />} label="Templates" active={rail === 'templates'} onClick={() => setRail(rail === 'templates' ? null : 'templates')} />
          <RailBtn icon={<FolderOpen className="size-4" />} label="Library" active={rail === 'saved'} onClick={() => setRail(rail === 'saved' ? null : 'saved')} />
          <RailBtn icon={<Upload className="size-4" />} label="Import" onClick={() => fileRef.current?.click()} />
          <RailBtn icon={<Sparkles className="size-4" />} label="Draft" active={rail === 'ai'} onClick={() => setRail(rail === 'ai' ? null : 'ai')} />
          <RailBtn icon={<Keyboard className="size-4" />} label="Help" onClick={() => say('⌘/Ctrl+S save · ⌘/Ctrl+O import · F fit · +/- zoom · 0 reset')} />
          <input ref={fileRef} type="file" accept=".mmd,.txt,.mermaid,.xmind,.puml,.plantuml" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>

        {/* drawer */}
        {rail && (
          <div className="glass flex w-full shrink-0 flex-col rounded-2xl p-3 md:w-[250px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-white capitalize">{rail}</span>
              <button aria-label="Close tools panel" onClick={() => setRail(null)} className="rounded-lg p-1 hover:bg-white/10"><X className="size-4" /></button>
            </div>
            {rail === 'templates' && (
              <>
                <input aria-label="Search studio templates" value={tplQuery} onChange={(e) => setTplQuery(e.target.value)} placeholder="Search templates…" className="mb-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[13px] outline-none placeholder:text-slate-500" />
                <div className="grid max-h-[60vh] gap-1.5 overflow-auto">
                  {filteredTemplates.map((t) => (
                    <button key={t.id} onClick={() => loadTemplate(t.id)} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-left hover:border-indigo-400/40">
                      <div className="text-[13px] font-semibold text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-500">{t.kind} · {t.category}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
            {rail === 'saved' && (
              <div className="grid max-h-[60vh] gap-1.5 overflow-auto">
                <button onClick={saveDiagram} className="btn-primary justify-center !py-2 text-[13px]"><Save className="size-4" /> Save current</button>
                {savedList.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">No saved diagrams yet.</div>}
                {savedList.map((d) => (
                  <div key={d.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                    <button onClick={() => { setCode(d.code); setTitle(d.title); setRail(null); setTimeout(() => canvasApi.current?.fit(), 120) }} className="w-full text-left text-[13px] font-semibold text-white">{d.title}</button>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                      <button onClick={() => { StorageManager.deleteDiagram?.(d.id); say('Deleted') }} className="hover:text-rose-300">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rail === 'ai' && (
              <div className="grid gap-2">
                <p className="text-xs leading-relaxed text-slate-400">Describe a flow — a local heuristic drafts Mermaid instantly. No keys, no network.</p>
                <textarea aria-label="Describe a flowchart" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={4} placeholder="e.g. signup flow with email verification…" className="rounded-xl border border-white/10 bg-black/30 p-2.5 text-[13px] outline-none placeholder:text-slate-600" />
                <button onClick={quickAi} className="btn-primary justify-center !py-2 text-[13px]"><Wand2 className="size-4" /> Generate draft</button>
                <button onClick={() => say('Full WebLLM assistant lives in the legacy studio build')} className="btn-ghost justify-center !py-2 text-xs">About local LLM</button>
              </div>
            )}
          </div>
        )}

        {/* editor + canvas */}
        <div className="studio-workspace grid min-w-0 flex-1 gap-3 xl:grid-cols-2" style={{ gridTemplateColumns: view === 'canvas' ? '1fr' : view === 'code' ? '1fr' : undefined }}>
          {(view === 'split' || view === 'code') && (
            <div className="glass flex h-[70vh] min-h-[420px] flex-col overflow-hidden rounded-2xl">
              <CodeEditor code={code} onChange={setCode} status={status} error={error} />
              <div className="flex flex-wrap gap-1.5 border-t border-white/10 p-2.5">
                <span className="self-center text-[11px] text-slate-500">Start with</span>
                {STARTERS.map(([id, label]) => (
                  <button key={id} onClick={() => loadTemplate(id)} className="chip hover:bg-white/10">{label}</button>
                ))}
              </div>
            </div>
          )}
          {(view === 'split' || view === 'canvas') && (
            <div className="glass relative h-[70vh] min-h-[420px] overflow-hidden rounded-2xl">
              <CanvasStage ref={canvasApi} containerRef={containerRef} grid={grid} status={status} />
            </div>
          )}
        </div>
      </div>

      {/* snapshots */}
      <div className="glass rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-white">Snapshots</span>
          <input value={snapLabel} onChange={(e) => setSnapLabel(e.target.value)} placeholder="Label (optional)" className="w-48 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none placeholder:text-slate-600" />
          <button onClick={saveSnapshot} className="btn-ghost !py-1.5 text-xs"><Check className="size-3.5" /> Save snapshot</button>
          <button onClick={() => nav('/saved')} className="ml-auto text-xs text-slate-400 hover:text-white">Open gallery →</button>
        </div>
        {snapshots.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {snapshots.slice(0, 8).map((s) => (
              <button key={s.id} title={new Date(s.createdAt).toLocaleString()} onClick={() => { setCode(s.code); setTitle(s.title); setTimeout(() => canvasApi.current?.fit(), 120) }} className={cn('chip hover:bg-white/10')}>{s.version} · {s.title.slice(0, 18)}</button>
            ))}
          </div>
        )}
      </div>


      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-[13px] text-white shadow-2xl backdrop-blur">{toast}</div>
      )}
    </div>
  )
}

function RailBtn({ icon, label, active, ...props }) {
  return (
    <button {...props} aria-label={label} aria-pressed={active === undefined ? undefined : !!active} title={label} className={cn('flex min-w-[52px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-[10px] font-semibold transition md:w-full md:flex-none', active ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
      {icon}{label}
    </button>
  )
}
