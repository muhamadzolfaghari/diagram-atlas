/**
 * Graphviz DOT (.dot / .gv) to Mermaid Flowchart Converter
 * Translates digraph / graph definitions, node labels, rankdir, and edges.
 */

export function parseDotToMermaid(dotText) {
  if (!dotText || typeof dotText !== 'string') {
    throw new Error('Please provide Graphviz DOT text to convert.');
  }

  const clean = dotText
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
    .replace(/\/\/.*/g, '')          // remove single-line comments
    .replace(/#.*/g, '');

  let direction = 'TD';
  if (/rankdir\s*=\s*["']?LR["']?/i.test(clean)) direction = 'LR';
  else if (/rankdir\s*=\s*["']?RL["']?/i.test(clean)) direction = 'RL';
  else if (/rankdir\s*=\s*["']?BT["']?/i.test(clean)) direction = 'BT';

  const output = [`flowchart ${direction}`];
  const nodeLabels = {}; // { id: label }

  // Extract node declarations: id [label="Name", shape=box]
  const nodeDeclRegex = /^\s*([a-zA-Z0-9_]+)\s*\[(.*?)\]\s*;?/gm;
  let match;
  while ((match = nodeDeclRegex.exec(clean)) !== null) {
    const id = match[1];
    const attrs = match[2];
    const labelMatch = attrs.match(/label\s*=\s*["']([^"']+)["']/i);
    if (labelMatch) {
      nodeLabels[id] = labelMatch[1].replace(/"/g, "'");
    }
  }

  // Extract edges: A -> B [label="Text"]
  const edgeRegex = /([a-zA-Z0-9_]+)\s*(?:->|--)\s*([a-zA-Z0-9_]+)(?:\s*\[(.*?)\])?\s*;?/g;
  while ((match = edgeRegex.exec(clean)) !== null) {
    const from = match[1];
    const to = match[2];
    const attrs = match[3] || '';

    const labelMatch = attrs.match(/label\s*=\s*["']([^"']+)["']/i);
    const edgeLabel = labelMatch ? labelMatch[1].replace(/"/g, "'") : '';

    const fromText = nodeLabels[from] ? `["${nodeLabels[from]}"]` : '';
    const toText = nodeLabels[to] ? `["${nodeLabels[to]}"]` : '';

    if (edgeLabel) {
      output.push(`  ${from}${fromText} -->|"${edgeLabel}"| ${to}${toText}`);
    } else {
      output.push(`  ${from}${fromText} --> ${to}${toText}`);
    }
  }

  // If no edges found, output standalone nodes
  if (output.length === 1 && Object.keys(nodeLabels).length > 0) {
    for (const [id, label] of Object.entries(nodeLabels)) {
      output.push(`  ${id}["${label}"]`);
    }
  }

  return output.join('\n') + '\n';
}
