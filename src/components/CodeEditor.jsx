import { useMemo, useRef } from 'react'
import { detectDiagramType, statsFor } from '../lib/format.js'
import { Badge } from './ui.jsx'

export default function CodeEditor({ code, onChange, status, error }) {
  const gutterRef = useRef(null)
  const lines = useMemo(() => code.split('\n').length, [code])
  const stats = statsFor(code)
  const type = detectDiagramType(code)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className={`size-2 rounded-full ${status.state === 'error' ? 'bg-rose-400' : status.state === 'rendering' ? 'bg-amber-400 live-dot' : 'bg-emerald-400'}`} />
        <span className="text-xs font-medium text-slate-300">{status.message}</span>
        <span className="ml-auto"><Badge tone="indigo">{type}</Badge></span>
      </div>

      {error && (
        <div className="mx-3 mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-xs leading-relaxed text-rose-200">
          <span className="font-bold">Syntax error — </span>{error}
          <div className="mt-1 text-rose-200/70">Tip: check arrows, brackets and keywords. Your last good render is kept on canvas.</div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div ref={gutterRef} className="w-12 shrink-0 select-none overflow-hidden border-r border-white/5 bg-black/20 py-4 text-right font-mono text-[12px] leading-[21px] text-slate-600">
          {Array.from({ length: lines }, (_, i) => <div key={i} className="px-2">{i + 1}</div>)}
        </div>
        <textarea
          aria-label="Diagram source code"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop }}
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key !== 'Tab') return
            e.preventDefault()
            const el = e.currentTarget
            const start = el.selectionStart, end = el.selectionEnd
            const lineStart = code.lastIndexOf('\n', start - 1) + 1
            const remove = e.shiftKey ? Math.min(2, (code.slice(lineStart).match(/^ */) || [''])[0].length) : 0
            if (e.shiftKey) onChange(code.slice(0, lineStart) + code.slice(lineStart + remove))
            else onChange(code.slice(0, start) + '  ' + code.slice(end))
            requestAnimationFrame(() => el.setSelectionRange(e.shiftKey ? Math.max(lineStart, start - remove) : start + 2, e.shiftKey ? Math.max(lineStart, end - remove) : start + 2))
          }}
          className="code-area flex-1 resize-none bg-transparent p-4 text-slate-100 outline-none placeholder:text-slate-600"
          wrap="off"
          placeholder="flowchart TD ..."
        />
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
        <span className="font-mono">{stats.lines} lines · {stats.chars} chars</span>
        <span className="ml-auto hidden sm:inline">Tab indents · Auto-renders · Draft autosaves</span>
      </div>
    </div>
  )
}
