/**
 * Describe to Any Diagram Converter
 * Converts unstructured text, user stories, architecture notes, or specifications
 * into any Mermaid diagram type:
 * - Flowchart (TD / LR)
 * - Sequence Diagram
 * - Mindmap
 * - State Diagram (v2)
 * - ER Diagram
 * - Class Diagram
 * - User Journey
 * - Gantt / Project Schedule
 * - Timeline
 * - Git Graph
 * - Pie Chart
 * - Quadrant Matrix
 */

export const SUPPORTED_DIAGRAM_TYPES = [
  { id: 'auto', label: '🎯 Auto-Detect Best Type' },
  { id: 'flowchart', label: '🔀 Flowchart (Process & Logic)' },
  { id: 'sequence', label: '↔️ Sequence (Interactions & APIs)' },
  { id: 'mindmap', label: '🧠 Mindmap (Brainstorm & Topics)' },
  { id: 'state', label: '⚙️ State Machine (Lifecycle)' },
  { id: 'er', label: '🗄️ ER Diagram (Database Schema)' },
  { id: 'class', label: '📐 Class Diagram (OOP & Domain)' },
  { id: 'journey', label: '🚀 User Journey (UX Experience)' },
  { id: 'gantt', label: '📅 Gantt (Roadmap & Schedule)' },
  { id: 'timeline', label: '📆 Timeline (Milestones & History)' },
  { id: 'gitGraph', label: '🌿 Git Graph (Branches & Release)' },
  { id: 'pie', label: '🥧 Pie Chart (Breakdown & Stats)' },
  { id: 'quadrant', label: '📊 Quadrant Matrix (Priorities)' },
];

/**
 * Auto-detects the most suitable Mermaid diagram type from text content
 */
export function detectDiagramType(text) {
  if (!text) return 'flowchart';
  const lower = text.toLowerCase();

  // Sequence cues
  if (
    lower.includes('sequence') ||
    lower.includes('participant') ||
    lower.includes('actor') ||
    (lower.includes('request') && lower.includes('response')) ||
    (lower.includes('api') && lower.includes('client') && lower.includes('server')) ||
    /\b(calls|queries|replies to|sends token to)\b/.test(lower)
  ) {
    return 'sequence';
  }

  // State Machine cues
  if (
    lower.includes('state machine') ||
    lower.includes('lifecycle') ||
    lower.includes('state diagram') ||
    (lower.includes('transition') && lower.includes('state')) ||
    /\b(draft|pending|in review|approved|cancelled|active|inactive)\b/.test(lower)
  ) {
    return 'state';
  }

  // ER Diagram cues
  if (
    lower.includes('er diagram') ||
    lower.includes('entity relationship') ||
    lower.includes('foreign key') ||
    lower.includes('primary key') ||
    lower.includes('relational schema') ||
    (lower.includes('tables') && lower.includes('columns'))
  ) {
    return 'er';
  }

  // Class Diagram cues
  if (
    lower.includes('class diagram') ||
    lower.includes('inheritance') ||
    lower.includes('implements') ||
    (lower.includes('class') && lower.includes('interface')) ||
    lower.includes('clean architecture')
  ) {
    return 'class';
  }

  // Mindmap cues
  if (
    lower.includes('mindmap') ||
    lower.includes('brainstorm') ||
    lower.includes('hierarchy') ||
    lower.includes('categories and subcategories') ||
    lower.includes('breakdown of topics')
  ) {
    return 'mindmap';
  }

  // User Journey cues
  if (
    lower.includes('user journey') ||
    lower.includes('customer journey') ||
    lower.includes('experience map') ||
    lower.includes('satisfaction score') ||
    lower.includes('persona')
  ) {
    return 'journey';
  }

  // Gantt Chart cues
  if (
    lower.includes('gantt') ||
    lower.includes('project schedule') ||
    lower.includes('sprint plan') ||
    lower.includes('roadmap') ||
    /\b(\d+ days|\d+ weeks|duration|milestone)\b/.test(lower)
  ) {
    return 'gantt';
  }

  // Timeline cues
  if (
    lower.includes('timeline') ||
    lower.includes('history of') ||
    lower.includes('chronology') ||
    /\b(q1|q2|q3|q4|202\d|19\d\d)\b/.test(lower)
  ) {
    return 'timeline';
  }

  // Git Graph cues
  if (
    lower.includes('git graph') ||
    lower.includes('git branching') ||
    lower.includes('pull request') ||
    (lower.includes('branch') && lower.includes('merge'))
  ) {
    return 'gitGraph';
  }

  // Pie Chart cues
  if (
    lower.includes('pie chart') ||
    lower.includes('percentage') ||
    lower.includes('distribution') ||
    lower.includes('market share') ||
    /\b(\d+%\s*|\d+\s*percent)\b/.test(lower)
  ) {
    return 'pie';
  }

  // Quadrant cues
  if (
    lower.includes('quadrant') ||
    lower.includes('2x2') ||
    lower.includes('effort vs impact') ||
    lower.includes('priority matrix')
  ) {
    return 'quadrant';
  }

  return 'flowchart';
}

/**
 * Main dispatcher to convert text to any Mermaid diagram
 * @param {string} text - User prompt / description
 * @param {string} targetType - 'auto' or specific diagram type ID
 * @param {object} opts - Additional options (title, orientation, etc.)
 */
export function describeToDiagram(text, targetType = 'auto', opts = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Please enter a description or specification to convert.');
  }

  const cleanText = text.trim();
  const effectiveType = targetType === 'auto' ? detectDiagramType(cleanText) : targetType;

  switch (effectiveType) {
    case 'flowchart':
      return { code: convertToFlowchart(cleanText, opts), type: 'flowchart', typeLabel: '🔀 Flowchart' };
    case 'sequence':
      return { code: convertToSequence(cleanText, opts), type: 'sequence', typeLabel: '↔️ Sequence Diagram' };
    case 'mindmap':
      return { code: convertToMindmap(cleanText, opts), type: 'mindmap', typeLabel: '🧠 Mindmap' };
    case 'state':
      return { code: convertToState(cleanText, opts), type: 'state', typeLabel: '⚙️ State Diagram' };
    case 'er':
      return { code: convertToEr(cleanText, opts), type: 'er', typeLabel: '🗄️ ER Diagram' };
    case 'class':
      return { code: convertToClass(cleanText, opts), type: 'class', typeLabel: '📐 Class Diagram' };
    case 'journey':
      return { code: convertToJourney(cleanText, opts), type: 'journey', typeLabel: '🚀 User Journey' };
    case 'gantt':
      return { code: convertToGantt(cleanText, opts), type: 'gantt', typeLabel: '📅 Gantt Chart' };
    case 'timeline':
      return { code: convertToTimeline(cleanText, opts), type: 'timeline', typeLabel: '📆 Timeline' };
    case 'gitGraph':
      return { code: convertToGitGraph(cleanText, opts), type: 'gitGraph', typeLabel: '🌿 Git Graph' };
    case 'pie':
      return { code: convertToPie(cleanText, opts), type: 'pie', typeLabel: '🥧 Pie Chart' };
    case 'quadrant':
      return { code: convertToQuadrant(cleanText, opts), type: 'quadrant', typeLabel: '📊 Quadrant Matrix' };
    default:
      return { code: convertToFlowchart(cleanText, opts), type: 'flowchart', typeLabel: '🔀 Flowchart' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FLOWCHART GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToFlowchart(text, opts = {}) {
  const orientation = opts.orientation || (text.length > 300 ? 'TD' : 'LR');
  const lines = parseTextToSteps(text);
  if (lines.length === 0) lines.push('Input Request', 'Process Logic', 'Generate Output');

  const nodes = [];

  lines.forEach((step, i) => {
    const id = `N${i + 1}`;
    const isDecision = /\?|check|verify|is valid|authenticate|approved|succeeded|match/i.test(step);
    const isError = /fail|error|reject|invalid|denied|timeout|abort/i.test(step);
    const isSuccess = /success|complete|done|finish|verified|deliver|active/i.test(step);

    nodes.push({ id, label: cleanLabel(step), isDecision, isError, isSuccess });
  });

  const mmd = [`flowchart ${orientation}`];

  nodes.forEach((n) => {
    if (n.isDecision) {
      mmd.push(`    ${n.id}{"${n.label}"}`);
    } else if (n.isError) {
      mmd.push(`    ${n.id}["❌ ${n.label}"]`);
    } else if (n.isSuccess) {
      mmd.push(`    ${n.id}["✅ ${n.label}"]`);
    } else {
      mmd.push(`    ${n.id}["${n.label}"]`);
    }
  });

  mmd.push('');

  for (let i = 0; i < nodes.length - 1; i++) {
    const cur = nodes[i];
    const next = nodes[i + 1];

    if (cur.isDecision) {
      mmd.push(`    ${cur.id} -->|Yes| ${next.id}`);
      const errNode = nodes.slice(i + 1).find((n) => n.isError);
      if (errNode) {
        mmd.push(`    ${cur.id} -->|No| ${errNode.id}`);
      } else {
        mmd.push(`    ${cur.id} -->|No| RETRY_${cur.id}["↩️ Handle Exception"]`);
      }
    } else if (cur.isError) {
      const prevDecision = nodes.slice(0, i).reverse().find((n) => n.isDecision);
      if (prevDecision) {
        mmd.push(`    ${cur.id} -.-> ${prevDecision.id}`);
      } else {
        mmd.push(`    ${cur.id} --> ${next.id}`);
      }
    } else {
      mmd.push(`    ${cur.id} --> ${next.id}`);
    }
  }

  // Styles
  mmd.push('');
  mmd.push('    classDef default fill:#111827,stroke:#6366f1,stroke-width:2px,color:#f8fafc');
  mmd.push('    classDef decision fill:#312e81,stroke:#a855f7,stroke-width:2px,color:#f3e8ff');
  mmd.push('    classDef error fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fee2e2');
  mmd.push('    classDef success fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#d1fae5');

  const decisions = nodes.filter((n) => n.isDecision).map((n) => n.id);
  const errors = nodes.filter((n) => n.isError).map((n) => n.id);
  const successes = nodes.filter((n) => n.isSuccess).map((n) => n.id);

  if (decisions.length) mmd.push(`    class ${decisions.join(',')} decision`);
  if (errors.length) mmd.push(`    class ${errors.join(',')} error`);
  if (successes.length) mmd.push(`    class ${successes.join(',')} success`);

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEQUENCE DIAGRAM GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToSequence(text, opts = {}) {
  const steps = parseTextToSteps(text);

  const defaultActors = ['User', 'Client App', 'API Gateway', 'Auth Service', 'Database'];
  const extractedActors = new Set();

  const actorKeywords = [
    'user', 'client', 'browser', 'app', 'frontend', 'ui', 'gateway', 'server', 'api',
    'backend', 'auth', 'database', 'db', 'cache', 'redis', 'stripe', 'payment', 'queue',
    'worker', 'notification', 'email', 'service', 'microservice'
  ];

  actorKeywords.forEach((kw) => {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) {
      extractedActors.add(capitalize(kw));
    }
  });

  const actors = extractedActors.size >= 2 ? Array.from(extractedActors).slice(0, 6) : defaultActors;

  const mmd = ['sequenceDiagram', '    autonumber'];
  actors.forEach((a) => mmd.push(`    actor ${a}`));
  mmd.push('');

  if (steps.length > 0) {
    steps.forEach((step, i) => {
      const from = actors[i % (actors.length - 1)];
      const to = actors[(i % (actors.length - 1)) + 1];
      const isReturn = /return|respond|reply|ack|send back|200 ok|token/i.test(step);
      const arrow = isReturn ? '-->>' : '->>';
      mmd.push(`    ${from}${arrow}${to}: ${cleanLabel(step)}`);
    });
  } else {
    mmd.push(`    ${actors[0]}->>${actors[1]}: Send Request`);
    mmd.push(`    ${actors[1]}->>${actors[2] || actors[1]}: Validate & Process`);
    mmd.push(`    ${actors[2] || actors[1]}-->>${actors[0]}: Return Success Payload`);
  }

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MINDMAP GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToMindmap(text, opts = {}) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const titleMatch = text.match(/(?:title|topic|about|for):\s*([^\n]+)/i);
  const rootTitle = titleMatch ? cleanLabel(titleMatch[1]) : (lines[0] ? cleanLabel(lines[0].slice(0, 30)) : 'Central Topic');

  const mmd = ['mindmap', `  root(("${rootTitle}"))`];

  const bulletItems = lines.filter((l) => /^[-*•\d.]+\s+/.test(l));

  if (bulletItems.length >= 3) {
    let currentCategory = null;
    bulletItems.forEach((b) => {
      const clean = cleanLabel(b.replace(/^[-*•\d.]+\s+/, ''));
      if (/^[A-Z\s]{3,}$/.test(clean) || clean.endsWith(':')) {
        currentCategory = clean.replace(':', '');
        mmd.push(`    ${currentCategory}`);
      } else if (currentCategory) {
        mmd.push(`      ${clean}`);
      } else {
        mmd.push(`    ${clean}`);
      }
    });
  } else {
    const words = lines.join(' ').split(/[,;.]+/).map((s) => cleanLabel(s)).filter((s) => s.length > 3).slice(0, 10);
    const groups = {
      'Core Capabilities': [],
      'Architecture': [],
      'Operations & Security': [],
      'Outcomes': [],
    };

    words.forEach((w, i) => {
      const groupKeys = Object.keys(groups);
      groups[groupKeys[i % groupKeys.length]].push(w);
    });

    for (const [grp, items] of Object.entries(groups)) {
      if (items.length > 0) {
        mmd.push(`    ${grp}`);
        items.forEach((it) => mmd.push(`      ${it}`));
      }
    }
  }

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. STATE DIAGRAM GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToState(text, opts = {}) {
  const steps = parseTextToSteps(text);
  const mmd = ['stateDiagram-v2', '    [*] --> Draft'];

  const states = [];
  steps.forEach((s) => {
    const words = s.split(/\s+/).slice(0, 3).join('_').replace(/[^a-zA-Z0-9_]/g, '');
    if (words && words.length > 2) states.push(capitalize(words));
  });

  const stateList = states.length >= 3 ? states.slice(0, 6) : ['Draft', 'InReview', 'Approved', 'Active', 'Completed'];

  for (let i = 0; i < stateList.length - 1; i++) {
    const cur = stateList[i];
    const next = stateList[i + 1];
    mmd.push(`    ${cur} --> ${next} : Step_${i + 1}`);
  }

  const last = stateList[stateList.length - 1];
  mmd.push(`    ${last} --> [*]`);
  mmd.push(`    ${stateList[1] || 'Draft'} --> Cancelled : Reject / Discard`);
  mmd.push('    Cancelled --> [*]');

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ER DIAGRAM GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToEr(text, opts = {}) {
  const mmd = ['erDiagram'];

  const matches = text.match(/\b([A-Z][a-zA-Z0-9_]{2,}|[a-z]{3,}s)\b/g) || [];
  const uniqueNouns = Array.from(new Set(matches.map((m) => m.toUpperCase()))).filter(
    (n) => !['THE', 'FOR', 'AND', 'TABLE', 'DATABASE', 'SCHEMA', 'DATA'].includes(n)
  );

  const tables = uniqueNouns.length >= 2 ? uniqueNouns.slice(0, 4) : ['USERS', 'ORDERS', 'PRODUCTS', 'PAYMENTS'];

  for (let i = 0; i < tables.length - 1; i++) {
    mmd.push(`    ${tables[i]} ||--o{ ${tables[i + 1]} : relates_to`);
  }

  tables.forEach((t) => {
    mmd.push(`    ${t} {`);
    mmd.push('        uuid id PK');
    mmd.push(`        string name`);
    mmd.push(`        timestamp created_at`);
    mmd.push('    }');
  });

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CLASS DIAGRAM GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToClass(text, opts = {}) {
  const mmd = ['classDiagram'];
  const potentialClasses = (text.match(/\b[A-Z][a-zA-Z0-9]+\b/g) || []).filter(
    (c) => !['Mermaid', 'Diagram', 'UML', 'API', 'JSON', 'REST', 'HTTP'].includes(c)
  );

  const classNames = potentialClasses.length >= 2 ? Array.from(new Set(potentialClasses)).slice(0, 5) : ['BaseEntity', 'User', 'Order', 'PaymentProcessor'];

  if (classNames.length >= 2) {
    mmd.push(`    ${classNames[0]} <|-- ${classNames[1]} : inherits`);
  }
  if (classNames.length >= 3) {
    mmd.push(`    ${classNames[1]} --> ${classNames[2]} : manages`);
  }

  classNames.forEach((c) => {
    mmd.push(`    class ${c} {`);
    mmd.push('        +String id');
    mmd.push('        +DateTime createdAt');
    mmd.push(`        +execute() Promise~void~`);
    mmd.push('    }');
  });

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. USER JOURNEY GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToJourney(text, opts = {}) {
  const steps = parseTextToSteps(text);
  const mmd = ['journey', '    title User Journey & Experience Map'];

  const sections = [
    { name: '1. Discovery & Onboarding', score: 4 },
    { name: '2. Core Usage & Workflow', score: 5 },
    { name: '3. Collaboration & Export', score: 5 },
    { name: '4. Delight & Retention', score: 5 },
  ];

  let stepIdx = 0;
  sections.forEach((sec) => {
    mmd.push(`    section ${sec.name}`);
    const count = Math.max(1, Math.floor(steps.length / sections.length));
    for (let j = 0; j < count && stepIdx < steps.length; j++) {
      const step = cleanLabel(steps[stepIdx]);
      mmd.push(`      ${step}: ${sec.score}: User, System`);
      stepIdx++;
    }
    if (stepIdx >= steps.length && sec === sections[0]) {
      mmd.push('      Visit Homepage: 5: User');
      mmd.push('      Create Free Account: 4: User, Auth');
    }
  });

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. GANTT ROADMAP GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToGantt(text, opts = {}) {
  const steps = parseTextToSteps(text);
  const mmd = [
    'gantt',
    '    dateFormat YYYY-MM-DD',
    '    title Project Execution Roadmap',
    '    section Research & Planning',
    '    Architecture Spec     :done, des1, 2026-10-01, 2026-10-05',
    '    Team Alignment Review  :done, des2, after des1, 3d',
    '    section Implementation',
  ];

  const items = steps.length >= 2 ? steps.slice(0, 4) : ['Core Feature Development', 'API Integration', 'Security Audit'];
  items.forEach((it, i) => {
    const id = `task${i + 1}`;
    const after = i === 0 ? 'des2' : `task${i}`;
    mmd.push(`    ${cleanLabel(it.slice(0, 24))} :active, ${id}, after ${after}, 5d`);
  });

  mmd.push('    section Launch');
  mmd.push('    QA & Production Release :crit, launch1, after task2, 4d');

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. TIMELINE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToTimeline(text, opts = {}) {
  const steps = parseTextToSteps(text);
  const mmd = ['timeline', '    title Strategic Milestones & Evolution'];

  const periods = ['2024 Q1 : Foundation', '2024 Q3 : Beta Launch', '2025 Q1 : Enterprise Scale', '2026 Q2 : AI Automation'];

  periods.forEach((p, idx) => {
    mmd.push(`    ${p}`);
    if (steps[idx]) {
      mmd.push(`      : ${cleanLabel(steps[idx].slice(0, 36))}`);
    }
  });

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. GIT GRAPH GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToGitGraph(text, opts = {}) {
  return `gitGraph
    commit id: "Initial commit"
    commit id: "Setup core scaffold"
    branch develop
    checkout develop
    commit id: "Implement data model"
    branch feature/service-layer
    checkout feature/service-layer
    commit id: "Add domain business logic"
    commit id: "Write integration tests"
    checkout develop
    merge feature/service-layer id: "Merge PR #42"
    checkout main
    merge develop tag: "v1.0.0" id: "Production Release"
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. PIE CHART GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToPie(text, opts = {}) {
  const mmd = ['pie title Allocation & Distribution'];
  const numbers = text.match(/([a-zA-Z\s]{3,}):?\s*(\d+)%?/g);

  if (numbers && numbers.length >= 2) {
    numbers.slice(0, 6).forEach((item) => {
      const parts = item.split(/[:\s]+/);
      const val = parseInt(parts[parts.length - 1], 10) || 25;
      const label = parts.slice(0, -1).join(' ').trim() || 'Item';
      mmd.push(`    "${label}" : ${val}`);
    });
  } else {
    mmd.push('    "Frontend & UI" : 35');
    mmd.push('    "Backend API Services" : 30');
    mmd.push('    "Database & Cache" : 20');
    mmd.push('    "DevOps & Security" : 15');
  }

  return mmd.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. QUADRANT MATRIX GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function convertToQuadrant(text, opts = {}) {
  return `quadrantChart
    title Strategic Priority Matrix (Impact vs Effort)
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Quick Wins
    quadrant-2 Major Strategic Bets
    quadrant-3 Low Priority / Fill-ins
    quadrant-4 Re-evaluate & Avoid
    "Authentication UI": [0.25, 0.75]
    "Real-time Collaboration": [0.85, 0.90]
    "Legacy Code Migration": [0.80, 0.30]
    "Dark Mode Theme": [0.15, 0.45]
    "Automated CI/CD Pipeline": [0.35, 0.85]
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Utilities
// ─────────────────────────────────────────────────────────────────────────────
function parseTextToSteps(text) {
  return text
    .split(/\n+|(?<=[.!?])\s+|(?:\s*->\s*)|(?:\s*-->\s*)/)
    .map((l) => l.trim())
    .map((l) => l.replace(/^[-*•\d.]+\s*/, ''))
    .filter((l) => l.length > 2 && !l.startsWith('//') && !l.startsWith('%%'));
}

function cleanLabel(s) {
  return s
    .replace(/[\[\]{}()<>"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
