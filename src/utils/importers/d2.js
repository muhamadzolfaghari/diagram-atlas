/**
 * D2 Lang (.d2) to Mermaid Converter
 * Converts D2 connections, direction, labels, and subgraphs into Mermaid flowcharts.
 */

export function parseD2ToMermaid(d2Text) {
  if (!d2Text || typeof d2Text !== 'string') {
    throw new Error('Please provide D2 code to convert.');
  }

  const lines = d2Text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  let direction = 'TD';
  const cleanLines = [];

  for (const line of lines) {
    if (/^direction\s*:\s*right/i.test(line)) {
      direction = 'LR';
    } else if (/^direction\s*:\s*down/i.test(line)) {
      direction = 'TD';
    } else if (/^direction\s*:\s*left/i.test(line)) {
      direction = 'RL';
    } else if (/^direction\s*:\s*up/i.test(line)) {
      direction = 'BT';
    } else {
      cleanLines.push(line);
    }
  }

  const output = [`flowchart ${direction}`];

  for (const line of cleanLines) {
    // Connection with label: from -> to: label
    // or bidirectional: from <-> to: label
    // or dependency: from -- to
    const edgeMatch = line.match(/^([\w\d_.-]+)\s*(->|<-|<->|--)\s*([\w\d_.-]+)(?:\s*:\s*(.*))?$/);
    if (edgeMatch) {
      const from = edgeMatch[1].replace(/\./g, '_');
      const op = edgeMatch[2];
      const to = edgeMatch[3].replace(/\./g, '_');
      const rawLabel = edgeMatch[4] ? edgeMatch[4].replace(/\{.*$/, '').trim() : '';

      let arrow = '-->';
      if (op === '<->') arrow = '<-->';
      else if (op === '--') arrow = '---';
      else if (op === '<-') arrow = '<--';

      if (rawLabel) {
        const safeLabel = rawLabel.replace(/"/g, "'");
        output.push(`  ${from} ${arrow}|"${safeLabel}"| ${to}`);
      } else {
        output.push(`  ${from} ${arrow} ${to}`);
      }
      continue;
    }

    // Node title / label assignment: node.label: "Display Text" or node: "Display Text"
    const labelMatch = line.match(/^([\w\d_-]+)(?:\.label)?\s*:\s*["']([^"']+)["']/);
    if (labelMatch) {
      const id = labelMatch[1];
      const text = labelMatch[2].replace(/"/g, "'");
      output.push(`  ${id}["${text}"]`);
      continue;
    }
  }

  return output.join('\n') + '\n';
}
