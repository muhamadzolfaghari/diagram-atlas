import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, FolderOpen, ArrowUpRight } from 'lucide-react'
import { StorageManager } from '../components/storage.js'
import { SectionHeader, EmptyState, Stat } from '../components/ui.jsx'

export default function Saved() {
  const nav = useNavigate()
  const [tick, setTick] = useState(0)
  const saved = StorageManager.getSavedDiagrams?.() || []
  const snaps = StorageManager.getSnapshots?.() || []
  const openDiagram = (diagram) => nav('/studio', { state: { diagram } })
  const refresh = () => setTick((t) => t + 1)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" key={tick}>
      <SectionHeader eyebrow="Local-first library" title="Saved diagrams & snapshots" desc="Your diagrams and checkpoints, saved in this browser." />
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Saved diagrams" value={saved.length} />
        <Stat label="Snapshots" value={snaps.length} />
        <Stat label="Storage" value="local" />
      </div>

      <h3 className="mt-10 flex items-center gap-2 font-bold text-white"><FolderOpen className="size-4" /> Saved diagrams</h3>
      {saved.length === 0 ? (
        <div className="mt-3"><EmptyState icon="📁" title="Nothing saved yet" desc="Open the studio, craft a diagram, then choose Save to keep it here." action={<button onClick={() => nav('/studio')} className="btn-primary !py-2 text-[13px]">Open studio <ArrowUpRight className="size-4" /></button>} /></div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {saved.map((d) => (
            <div key={d.id} className="glass card-hover rounded-2xl p-4">
              <button onClick={() => openDiagram(d)} className="w-full text-left font-bold text-white hover:text-indigo-200">{d.title}</button>
              <div className="mt-0.5 text-xs text-slate-500">{new Date(d.updatedAt).toLocaleString()} · {d.code.length} chars</div>
              <pre className="mt-2 max-h-20 overflow-hidden rounded-xl bg-black/40 p-2.5 font-mono text-[11px] text-slate-500">{d.code.slice(0, 240)}</pre>
              <div className="mt-2 flex gap-2">
                <button onClick={() => openDiagram(d)} className="btn-ghost !py-1.5 text-xs">Open</button>
                <button onClick={() => { StorageManager.deleteDiagram?.(d.id); refresh() }} className="btn-ghost !py-1.5 text-xs !text-rose-300"><Trash2 className="size-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="mt-10 font-bold text-white">Version snapshots</h3>
      {snaps.length === 0 ? (
        <div className="mt-3"><EmptyState icon="📸" title="No snapshots" desc="Snapshots are manual checkpoints you create from the studio footer bar." /></div>
      ) : (
        <div className="mt-3 grid gap-2">
          {snaps.map((s) => (
            <div key={s.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">{s.version}</span>
              <span className="text-sm font-semibold text-white">{s.title}</span>
              <span className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</span>
              <button onClick={() => { StorageManager.deleteSnapshot?.(s.id); refresh() }} className="ml-auto text-xs text-slate-500 hover:text-rose-300">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
