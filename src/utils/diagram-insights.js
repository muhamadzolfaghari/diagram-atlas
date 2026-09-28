/**
 * Diagram Insights Analyzer
 * Parses Mermaid source code and extracts structural stats + suggestions.
 */

const TYPE_MAP = {
  flowchart: { label: 'Flowchart', icon: '🔀', color: '#6366f1' },
  graph:     { label: 'Flowchart', icon: '🔀', color: '#6366f1' },
  sequencediagram: { label: 'Sequence', icon: '↔️', color: '#06b6d4' },
  erdiagram:  { label: 'ER Diagram', icon: '🗄️', color: '#10b981' },
  classdiagram: { label: 'Class Diagram', icon: '📐', color: '#8b5cf6' },
  statediagram: { label: 'State Machine', icon: '⚙️', color: '#f59e0b' },
  'statediagram-v2': { label: 'State Machine', icon: '⚙️', color: '#f59e0b' },
  gitgraph:   { label: 'Git Graph', icon: '🌿', color: '#34d399' },
  gantt:      { label: 'Gantt Chart', icon: '📅', color: '#f97316' },
  pie:        { label: 'Pie Chart', icon: '🥧', color: '#ec4899' },
  mindmap:    { label: 'Mindmap', icon: '🧠', color: '#a78bfa' },
  timeline:   { label: 'Timeline', icon: '📆', color: '#fb923c' },
  journey:    { label: 'User Journey', icon: '🚀', color: '#22d3ee' },
  quadrantchart: { label: 'Quadrant', icon: '📊', color: '#4ade80' },
  xychart:    { label: 'XY Chart', icon: '📈', color: '#f472b6' },
  block:      { label: 'Block Diagram', icon: '🔲', color: '#94a3b8' },
};

export function analyzeDiagram(code) {
  if (!code || typeof code !== 'string') return null;
  const lines = code.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // ── Detect type ──────────────────────────────────────────────────────────
  const firstLine = lines[0].toLowerCase().replace(/\s+/g, '');
  let typeKey = Object.keys(TYPE_MAP).find(k => firstLine.startsWith(k)) || 'unknown';
  const typeInfo = TYPE_MAP[typeKey] || { label: 'Diagram', icon: '📊', color: '#94a3b8' };

  // ── Count metrics by type ─────────────────────────────────────────────────
  let nodes = 0, edges = 0, subgraphs = 0, actors = 0, classes = 0,
      entities = 0, relations = 0, commits = 0, states = 0;

  // Flowchart nodes: id["label"], id(label), id{label}, id([label]), id[[label]]
  const nodeRe = /(?:^|\s)([\w"]+)\s*[\(\[\{|>]/gm;
  const edgeRe = /--[->|]+|==+[=>]|\.\.[\->]+|~~~|--x|--o|<--/g;
  const subgraphRe = /^subgraph\s/m;
  const actorRe = /^(?:actor|participant)\s/im;
  const classRe = /^\s*class\s+\w+/m;
  const entityRe = /^\s+\w+\s*\{/m;
  const commitRe = /^\s*commit\b/im;
  const stateRe = /^\s*[\w\[\]]+\s*-->/m;

  if (['flowchart', 'graph'].includes(typeKey)) {
    nodes = (code.match(/(?:^|\s{2,})(\w+)\s*[\(\[\{|>]/gm) || []).length;
    edges = (code.match(edgeRe) || []).length;
    subgraphs = (code.match(/^subgraph\b/gm) || []).length;
  } else if (typeKey === 'sequencediagram') {
    actors = (code.match(/^(?:actor|participant)\s+\S+/gim) || []).length;
    edges = (code.match(/->|-->>|->>|-->/g) || []).length;
  } else if (typeKey === 'erdiagram') {
    entities = (code.match(/^\s+\w+\s*\{/gm) || []).length;
    relations = (code.match(/\|\|--|o\{|--o\|/g) || []).length;
  } else if (typeKey === 'classdiagram') {
    classes = (code.match(/^\s*class\s+\w+/gm) || []).length;
    relations = (code.match(/<\|--|<\|\.\.|\.\.|--|<--|\*--|o--/g) || []).length;
  } else if (typeKey === 'gitgraph') {
    commits = (code.match(/^\s*commit\b/gim) || []).length;
    edges = (code.match(/^\s*merge\b/gim) || []).length;
  } else if (typeKey.startsWith('statediagram')) {
    states = (code.match(/-->/g) || []).length;
  }

  // ── Line count & complexity ───────────────────────────────────────────────
  const lineCount = lines.length;
  const charCount = code.length;

  let complexity = 'Simple';
  let complexityColor = '#10b981';
  let complexityScore = 1;

  const mainCount = nodes || actors || classes || entities || states || commits;
  const connCount = edges || relations;

  if (mainCount > 20 || connCount > 25 || lineCount > 80) {
    complexity = 'Complex'; complexityColor = '#ef4444'; complexityScore = 3;
  } else if (mainCount > 8 || connCount > 10 || lineCount > 35) {
    complexity = 'Moderate'; complexityColor = '#f59e0b'; complexityScore = 2;
  }

  // ── Generate suggestions ──────────────────────────────────────────────────
  const tips = [];

  if (typeKey === 'flowchart' || typeKey === 'graph') {
    if (nodes > 15) tips.push('Consider splitting into sub-diagrams for clarity.');
    if (subgraphs === 0 && nodes > 6) tips.push('Add subgraphs to group related nodes.');
    if (!code.includes('classDef')) tips.push('Add classDef styles to colour-code node categories.');
    if (!code.includes('%%')) tips.push('Use %% comments to document decision points.');
  }
  if (typeKey === 'sequencediagram') {
    if (!code.includes('autonumber')) tips.push('Add "autonumber" to label message steps.');
    if (!code.includes('loop') && !code.includes('alt')) tips.push('Use loop/alt blocks for conditional flows.');
  }
  if (typeKey === 'erdiagram') {
    if (entities < 3) tips.push('Add more entities to build a meaningful schema.');
    if (!code.includes('PK')) tips.push('Mark primary keys with PK for clarity.');
  }
  if (typeKey === 'classdiagram') {
    if (classes > 12) tips.push('Large class diagram — consider splitting by module.');
    if (!code.includes('<|--') && !code.includes('<|..')) tips.push('Add inheritance relationships if applicable.');
  }
  if (typeKey === 'gitgraph') {
    if (!code.includes('tag:')) tips.push('Add release tags with tag: "v1.0.0".');
  }
  if (tips.length === 0) tips.push('Diagram looks well-structured! ✓');

  return {
    typeKey,
    typeInfo,
    lineCount,
    charCount,
    metrics: { nodes, edges, subgraphs, actors, classes, entities, relations, commits, states },
    complexity,
    complexityColor,
    complexityScore,
    tips,
  };
}
