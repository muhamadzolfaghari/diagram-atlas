import { sanitizeMindmapNodeText } from './xmind.js';

/**
 * Converts Markdown Bullet Outlines / Indented Lists / OPML
 * into Mermaid Mindmaps or Flowcharts.
 */

export function parseOutline(text, targetFormat = 'mindmap') {
  if (!text || typeof text !== 'string') {
    throw new Error('Please provide outline text to convert.');
  }

  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/\t/g, '    '))
    .filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('Outline text is empty.');
  }

  // Parse lines into hierarchy
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Strip markdown bullet markers: -, *, +, numbers like 1.
    const textContent = trimmed.replace(/^([-*+]|\d+\.)\s+/, '').replace(/^#+\s*/, '');
    const leadingSpaces = line.length - line.trimStart().length;

    items.push({
      indent: leadingSpaces,
      text: textContent
    });
  }

  if (targetFormat === 'flowchart') {
    return generateFlowchartFromItems(items);
  }

  return generateMindmapFromItems(items);
}

function generateMindmapFromItems(items) {
  const output = ['mindmap'];
  const firstItem = items[0];
  const rootTitle = firstItem.text.replace(/"/g, "'").trim();
  output.push(`  root(("${rootTitle}"))`);

  // Normalize indents relative to root
  const baseIndent = items.length > 1 ? items[1].indent : 2;

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    // Map indent spaces to 2-space increments (at least depth 2 for children)
    const depth = Math.max(2, Math.floor(item.indent / Math.max(2, baseIndent)) + 2);
    const indentStr = '  '.repeat(depth);
    output.push(`${indentStr}${sanitizeMindmapNodeText(item.text)}`);
  }

  return output.join('\n') + '\n';
}

function generateFlowchartFromItems(items) {
  const output = ['flowchart TD'];
  const stack = []; // { indent, id }

  items.forEach((item, idx) => {
    const id = `node_${idx + 1}`;
    const safeLabel = item.text.replace(/"/g, "'").replace(/[\[\]]/g, '');

    output.push(`  ${id}["${safeLabel}"]`);

    while (stack.length > 0 && stack[stack.length - 1].indent >= item.indent) {
      stack.pop();
    }

    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      output.push(`  ${parent.id} --> ${id}`);
    }

    stack.push({ indent: item.indent, id });
  });

  return output.join('\n') + '\n';
}
