export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function detectDiagramType(code = '') {
  const clean = code.replace(/---[\s\S]*?---/, '').trim()
  const first = (clean.split('\n')[0] || '').trim()
  if (/^(strict\s+)?(di)?graph\b/i.test(first) && /[{;]/.test(clean)) return 'Graphviz · Wasm'
  if (/^flowchart/i.test(first)) return 'Flowchart'
  if (/^graph/i.test(first)) return 'Graph'
  if (/^sequenceDiagram/i.test(first)) return 'Sequence'
  if (/^classDiagram/i.test(first)) return 'Class'
  if (/^stateDiagram/i.test(first)) return 'State'
  if (/^erDiagram/i.test(first)) return 'ER Schema'
  if (/^gitGraph/i.test(first)) return 'Git Graph'
  if (/^gantt/i.test(first)) return 'Gantt'
  if (/^mindmap/i.test(first)) return 'Mindmap'
  if (/^journey/i.test(first)) return 'Journey'
  if (/^kanban/i.test(first)) return 'Kanban'
  if (/^quadrantChart/i.test(first)) return 'Quadrant'
  if (/^timeline/i.test(first)) return 'Timeline'
  if (/^sankey/i.test(first)) return 'Sankey'
  if (/^block/i.test(first)) return 'Block'
  if (/^xychart/i.test(first)) return 'XY Chart'
  if (/^C4/i.test(first)) return 'C4'
  if (/^pie/i.test(first)) return 'Pie'
  return 'Diagram'
}

export function statsFor(code = '') {
  return { lines: code.split('\n').length, chars: code.length }
}
