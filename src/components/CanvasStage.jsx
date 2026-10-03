import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Minus, Plus, Maximize, Crosshair, RotateCcw, Grid3X3 } from 'lucide-react'

const CanvasStage = forwardRef(function CanvasStage({ containerRef, grid = 'dots', status }, ref) {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const state = useRef({ x: 40, y: 40, z: 1 })

  const apply = () => {
    const c = canvasRef.current
    const s = stageRef.current
    if (!c || !s) return
    c.style.transform = `translate3d(${state.current.x}px, ${state.current.y}px, 0) scale(${state.current.z})`
    setZoom(state.current.z)
    const gx = ((state.current.x % 22) + 22) % 22
    const gy = ((state.current.y % 22) + 22) % 22
    s.style.backgroundPosition = `${gx}px ${gy}px`
  }

  const fit = () => {
    const s = stageRef.current
    const svg = containerRef.current?.querySelector('svg')
    if (!s || !svg) return
    let w = 1000, h = 700
    try {
      const box = svg.viewBox?.baseVal
      if (box?.width) { w = box.width; h = box.height }
      else { const b = svg.getBBox(); if (b.width) { w = b.width; h = b.height } }
    } catch {}
    const sw = s.clientWidth, sh = s.clientHeight
    const scale = Math.min(1.2, Math.min((sw - 80) / w, (sh - 80) / h))
    state.current.z = Math.min(4, Math.max(0.08, scale || 1))
    state.current.x = (sw - w * state.current.z) / 2
    state.current.y = Math.max(24, (sh - h * state.current.z) / 2)
    apply()
  }

  useImperativeHandle(ref, () => ({ fit, zoomIn: () => zoomBy(1.2), zoomOut: () => zoomBy(1 / 1.2), reset: () => { state.current.z = 1; apply() } }))

  const zoomBy = (f, cx, cy) => {
    const s = stageRef.current
    const r = s.getBoundingClientRect()
    const ax = cx ?? r.width / 2, ay = cy ?? r.height / 2
    const nz = Math.min(4, Math.max(0.08, state.current.z * f))
    const wx = (ax - state.current.x) / state.current.z
    const wy = (ay - state.current.y) / state.current.z
    state.current.z = nz
    state.current.x = ax - wx * nz
    state.current.y = ay - wy * nz
    apply()
  }

  useEffect(() => {
    const s = stageRef.current
    if (!s) return
    let drag = null, moved = false, vx = 0, vy = 0, last = 0, lx = 0, ly = 0, inertia = 0

    const down = (e) => {
      if (e.button !== 0) return
      drag = { sx: e.clientX - state.current.x, sy: e.clientY - state.current.y }
      moved = false; vx = vy = 0; last = performance.now(); lx = e.clientX; ly = e.clientY
      cancelAnimationFrame(inertia)
      s.setPointerCapture(e.pointerId)
    }
    const move = (e) => {
      if (!drag) return
      const nx = e.clientX - drag.sx, ny = e.clientY - drag.sy
      if (Math.hypot(nx - state.current.x, ny - state.current.y) > 3) moved = true
      state.current.x = nx; state.current.y = ny; apply()
      const now = performance.now(), dt = now - last
      if (dt > 8) { vx = vx * 0.3 + ((e.clientX - lx) / dt) * 0.7; vy = vy * 0.3 + ((e.clientY - ly) / dt) * 0.7; last = now; lx = e.clientX; ly = e.clientY }
    }
    const up = () => {
      if (!drag) return
      drag = null
      const sp = Math.hypot(vx, vy)
      if (sp > 0.15 && !moved === false) {
        let cx = vx, cy = vy
        const step = () => {
          state.current.x += cx * 16; state.current.y += cy * 16; apply()
          cx *= 0.92; cy *= 0.92
          if (Math.hypot(cx, cy) > 0.02) inertia = requestAnimationFrame(step)
        }
        inertia = requestAnimationFrame(step)
      }
    }
    const wheel = (e) => {
      e.preventDefault()
      const r = s.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) zoomBy(Math.exp(-e.deltaY * 0.008), e.clientX - r.left, e.clientY - r.top)
      else if (e.shiftKey) { state.current.x -= e.deltaY; apply() }
      else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { state.current.x -= e.deltaX; state.current.y -= e.deltaY; apply() }
      else zoomBy(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top)
    }
    s.addEventListener('pointerdown', down)
    s.addEventListener('pointermove', move)
    s.addEventListener('pointerup', up)
    s.addEventListener('wheel', wheel, { passive: false })
    const key = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, textarea, select, button, [contenteditable="true"], dialog')) return
      if (e.key.toLowerCase() === 'f') { e.preventDefault(); fit() }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1.25) }
      else if (e.key === '-') { e.preventDefault(); zoomBy(1 / 1.25) }
      else if (e.key === '0') { e.preventDefault(); state.current = { x: 40, y: 40, z: 1 }; apply() }
    }
    window.addEventListener('keydown', key)
    const t = setTimeout(fit, 350)
    return () => { window.removeEventListener('keydown', key); s.removeEventListener('pointerdown', down); s.removeEventListener('pointermove', move); s.removeEventListener('pointerup', up); s.removeEventListener('wheel', wheel); clearTimeout(t); cancelAnimationFrame(inertia) }
    // eslint-disable-next-line
  }, [])

  // refit when diagram changes size
  useEffect(() => {
    const t = setTimeout(() => {
      const svg = containerRef.current?.querySelector('svg')
      if (svg && state.current.z === 1 && state.current.x === 40) fit()
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [status.message])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={stageRef}
        className={`studio-canvas absolute inset-0 ${grid === 'dots' ? 'dot-grid' : grid === 'lines' ? 'line-grid' : ''}`}
        style={{ touchAction: 'none' }}
      >
        <div ref={canvasRef} className="absolute left-0 top-0 will-change-transform" style={{ transformOrigin: '0 0' }}>
          <div ref={containerRef} className="mermaid-stage min-w-[400px]" />
        </div>
      </div>

      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
        <span className="chip !bg-black/50 backdrop-blur">{Math.round(zoom * 100)}%</span>
        {status.state === 'rendering' && <span className="chip !bg-black/50">Rendering…</span>}
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-black/60 p-1.5 shadow-2xl backdrop-blur-xl">
        <DockBtn onClick={() => zoomBy(1 / 1.25)} title="Zoom out"><Minus className="size-4" /></DockBtn>
        <button onClick={() => { state.current.z = 1; apply() }} className="rounded-xl px-2.5 py-2 font-mono text-xs text-slate-300 hover:bg-white/10">{Math.round(zoom * 100)}%</button>
        <DockBtn onClick={() => zoomBy(1.25)} title="Zoom in"><Plus className="size-4" /></DockBtn>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <DockBtn onClick={fit} title="Fit to screen (F)"><Maximize className="size-4" /></DockBtn>
        <DockBtn onClick={() => { const s = stageRef.current; state.current.x = (s.clientWidth - 1000 * state.current.z) / 2; state.current.y = (s.clientHeight - 700 * state.current.z) / 2; apply() }} title="Center"><Crosshair className="size-4" /></DockBtn>
        <DockBtn onClick={() => { state.current = { x: 40, y: 40, z: 1 }; apply() }} title="Reset"><RotateCcw className="size-4" /></DockBtn>
      </div>
    </div>
  )
})

function DockBtn({ children, ...props }) {
  return <button aria-label={props.title} {...props} className="grid size-9 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white" />
}

export function GridToggle({ grid, onChange }) {
  return (
    <button onClick={() => onChange(grid === 'dots' ? 'lines' : grid === 'lines' ? 'none' : 'dots')} className="btn-ghost !px-3 !py-2 text-xs" aria-label={`Canvas grid: ${grid}. Click to change`} title="Toggle grid">
      <Grid3X3 className="size-4" /> {grid}
    </button>
  )
}

export default CanvasStage
