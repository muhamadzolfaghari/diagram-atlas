/**
 * Onboarding Flow Generator
 * Converts a list of steps/screens into a Mermaid user-journey flowchart.
 */

/**
 * @param {string} stepsText - One step per line, optionally prefixed with decorators:
 *   [decision] Step name
 *   [parallel] Step name
 *   [error]    Error step name
 *   Step name  (regular step)
 * @param {object} opts
 * @param {{ name: string }} opts.actor - User persona name
 * @param {boolean} opts.includeMetrics - Add timing/effort annotations
 * @returns {string} Mermaid flowchart TD syntax
 */
export function generateOnboardingFlow(stepsText, opts = {}) {
  const actorName = opts.actor || 'New User';
  const includeMetrics = opts.includeMetrics !== false;

  const rawLines = stepsText.split('\n').map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) throw new Error('Please enter at least one step.');

  const nodes = [];
  const connections = [];

  rawLines.forEach((line, i) => {
    const id = `S${i + 1}`;
    let type = 'step';
    let label = line;

    // Parse decorators
    const decMatch = line.match(/^\[(decision|parallel|error|success|wait|email|gate)\]\s*(.+)$/i);
    if (decMatch) {
      type = decMatch[1].toLowerCase();
      label = decMatch[2];
    }

    nodes.push({ id, label, type, index: i });
  });

  // Build the Mermaid source
  const lines = [];
  lines.push('flowchart TD');
  lines.push('');

  // Actor entry
  lines.push(`    START(["👤 ${actorName}\\nEntry Point"])`);
  lines.push('');

  // Subgraph: Onboarding Journey
  lines.push('    subgraph JOURNEY["🚀 Onboarding Journey"]');
  lines.push('        direction TB');

  nodes.forEach(n => {
    switch (n.type) {
      case 'decision':
        lines.push(`        ${n.id}{"${escMmd(n.label)}"}`);
        break;
      case 'error':
        lines.push(`        ${n.id}["❌ ${escMmd(n.label)}"]`);
        break;
      case 'success':
        lines.push(`        ${n.id}["✅ ${escMmd(n.label)}"]`);
        break;
      case 'wait':
        lines.push(`        ${n.id}[/"⏳ ${escMmd(n.label)}"/]`);
        break;
      case 'email':
        lines.push(`        ${n.id}[/"📧 ${escMmd(n.label)}"/]`);
        break;
      case 'gate':
        lines.push(`        ${n.id}[["🔒 ${escMmd(n.label)}"]`);
        break;
      case 'parallel':
        lines.push(`        ${n.id}["⚡ ${escMmd(n.label)}"]`);
        break;
      default:
        lines.push(`        ${n.id}["${escMmd(n.label)}"]`);
    }
  });

  lines.push('    end');
  lines.push('');

  // Completion node
  lines.push('    DONE(["🎉 Activation Complete\\nUser is Onboarded"])');
  lines.push('');

  // ── Connections ───────────────────────────────────────────────────────────
  lines.push('    START --> ' + nodes[0].id);

  for (let i = 0; i < nodes.length; i++) {
    const cur = nodes[i];
    const next = nodes[i + 1];

    if (cur.type === 'decision') {
      // Decision splits into Yes/No
      if (next) {
        lines.push(`    ${cur.id} -- Yes --> ${next.id}`);
        // Error branch — either find next error node or loop back
        const errorNode = nodes.find((n, j) => j > i && n.type === 'error');
        if (errorNode) {
          lines.push(`    ${cur.id} -- No --> ${errorNode.id}`);
        } else {
          lines.push(`    ${cur.id} -- No --> RETRY_${cur.id}["↩️ Retry / Support"]`);
        }
      } else {
        lines.push(`    ${cur.id} -- Yes --> DONE`);
        lines.push(`    ${cur.id} -- No --> DONE`);
      }
    } else if (cur.type === 'error') {
      // Errors loop back to previous decision or end
      const prevDecision = nodes.slice(0, i).reverse().find(n => n.type === 'decision');
      if (prevDecision) {
        lines.push(`    ${cur.id} --> ${prevDecision.id}`);
      }
    } else if (next) {
      const label = includeMetrics ? `|Step ${i + 1}|` : '';
      lines.push(`    ${cur.id} ${label}--> ${next.id}`);
    } else {
      lines.push(`    ${cur.id} --> DONE`);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  lines.push('');
  lines.push('    classDef step fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#e0e7ff');
  lines.push('    classDef decision fill:#3b2005,stroke:#f59e0b,stroke-width:2px,color:#fef3c7');
  lines.push('    classDef error fill:#2b1419,stroke:#ef4444,stroke-width:2px,color:#fee2e2');
  lines.push('    classDef success fill:#052e16,stroke:#10b981,stroke-width:2px,color:#d1fae5');
  lines.push('    classDef wait fill:#0c1a2e,stroke:#06b6d4,stroke-width:2px,color:#cffafe');
  lines.push('    classDef email fill:#0c1a2e,stroke:#06b6d4,stroke-width:2px,color:#cffafe');
  lines.push('    classDef gate fill:#1a0533,stroke:#a855f7,stroke-width:2px,color:#f3e8ff');
  lines.push('    classDef parallel fill:#0f2027,stroke:#34d399,stroke-width:2px,color:#d1fae5');
  lines.push('    classDef start fill:#1e3a5f,stroke:#38bdf8,stroke-width:3px,color:#bae6fd,rx:99');

  // Apply classes
  const grouped = {};
  nodes.forEach(n => {
    const cls = n.type || 'step';
    (grouped[cls] = grouped[cls] || []).push(n.id);
  });
  for (const [cls, ids] of Object.entries(grouped)) {
    lines.push(`    class ${ids.join(',')} ${cls}`);
  }
  lines.push('    class START,DONE start');

  return lines.join('\n') + '\n';
}

function escMmd(s) {
  return s.replace(/"/g, "'").replace(/[<>]/g, '').replace(/\n/g, ' ');
}

// ── ER Builder ────────────────────────────────────────────────────────────────

/**
 * Builds a Mermaid erDiagram from a structured definition.
 * @param {Array<{name: string, fields: Array<{name: string, type: string, key: string}>}>} tables
 * @param {Array<{from: string, to: string, rel: string, label: string}>} relations
 * @returns {string} Mermaid erDiagram syntax
 */
export function buildErDiagram(tables, relations) {
  if (!tables || tables.length === 0) throw new Error('Add at least one table.');

  const lines = ['erDiagram'];

  tables.forEach(t => {
    const tName = t.name.toUpperCase().replace(/\s+/g, '_');
    lines.push(`  ${tName} {`);
    (t.fields || []).forEach(f => {
      const key = f.key ? ` ${f.key}` : '';
      const fType = (f.type || 'string').replace(/[^a-zA-Z0-9_]/g, '');
      const fName = (f.name || 'field').replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`    ${fType} ${fName}${key}`);
    });
    lines.push('  }');
  });

  (relations || []).forEach(r => {
    const from = r.from.toUpperCase().replace(/\s+/g, '_');
    const to = r.to.toUpperCase().replace(/\s+/g, '_');
    const rel = r.rel || '||--o{';
    const label = r.label || 'has';
    lines.push(`  ${from} ${rel} ${to} : "${label}"`);
  });

  return lines.join('\n') + '\n';
}
