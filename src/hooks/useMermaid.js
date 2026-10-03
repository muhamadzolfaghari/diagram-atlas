import { useEffect, useRef, useState, useCallback } from 'react'
import { initMermaid, renderMermaid, setMermaidTheme } from '../utils/mermaid-renderer.js'

export function useMermaid(code, theme = 'dark', view = 'split') {
  const ref = useRef(null)
  const [status, setStatus] = useState({ state: 'idle', message: 'Ready', ms: 0 })
  const [error, setError] = useState('')
  const seq = useRef(0)

  useEffect(() => { initMermaid(theme) }, [])
  useEffect(() => { setMermaidTheme(theme) }, [theme])

  const render = useCallback(async (nextCode) => {
    const el = ref.current
    if (!el) return
    const my = ++seq.current
    if (!nextCode?.trim()) {
      setStatus({ state: 'idle', message: 'Empty editor', ms: 0 })
      return
    }
    setStatus({ state: 'rendering', message: 'Rendering…', ms: 0 })
    const t0 = performance.now()
    const res = await renderMermaid(el, nextCode)
    if (my !== seq.current || res.aborted) return
    const ms = Math.round(performance.now() - t0)
    if (res.success) {
      setError('')
      setStatus({ state: 'ok', message: `Rendered · ${ms}ms${res.isGraphviz ? ' · Graphviz Wasm' : ''}`, ms })
    } else {
      setError(res.error || 'Syntax error')
      setStatus({ state: 'error', message: 'Syntax error', ms })
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => render(code), 250)
    return () => clearTimeout(t)
  }, [code, theme, view, render])

  return { containerRef: ref, status, error, rerender: () => render(code) }
}
