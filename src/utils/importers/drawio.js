/**
 * Draw.io (.drawio / mxGraph XML) to Mermaid Flowchart Converter
 * Parses vertex cells, edge connections, source/target mappings, and edge labels.
 */

export function parseDrawioToMermaid(drawioText) {
  if (!drawioText || typeof drawioText !== 'string') {
    throw new Error('Please provide Draw.io XML text to convert.');
  }

  // Strip XML declaration or unescape HTML entities if needed
  let xmlString = drawioText.trim();

  // If file contains compressed raw deflate, check for plain mxGraphModel first
  let doc;
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(xmlString, 'application/xml');
  } else if (typeof global !== 'undefined' && global.window?.DOMParser) {
    const parser = new global.window.DOMParser();
    doc = parser.parseFromString(xmlString, 'application/xml');
  }

  if (!doc) {
    throw new Error('XML parser not available.');
  }

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Invalid XML in Draw.io file: ${parserError.textContent.slice(0, 100)}`);
  }

  const cells = doc.querySelectorAll('mxCell');
  if (!cells || cells.length === 0) {
    throw new Error('No mxCell diagram elements found in Draw.io file.');
  }

  const vertices = {}; // { id: label }
  const edges = [];    // [ { source, target, label } ]

  cells.forEach(cell => {
    const id = cell.getAttribute('id');
    const value = cell.getAttribute('value') || '';
    const isVertex = cell.getAttribute('vertex') === '1';
    const isEdge = cell.getAttribute('edge') === '1';
    const source = cell.getAttribute('source');
    const target = cell.getAttribute('target');

    // Clean HTML tags from cell values (Draw.io often uses <div>Text</div>)
    const cleanLabel = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().replace(/"/g, "'");

    if (isVertex && id) {
      vertices[id] = cleanLabel || `Node_${id}`;
    }

    if (isEdge && source && target) {
      edges.push({
        source,
        target,
        label: cleanLabel
      });
    }
  });

  const output = ['flowchart TD'];
  const referencedNodeIds = new Set();

  edges.forEach(edge => {
    const fromId = `node_${edge.source.replace(/[^\w\d_]/g, '_')}`;
    const toId = `node_${edge.target.replace(/[^\w\d_]/g, '_')}`;
    const fromLabel = vertices[edge.source] || edge.source;
    const toLabel = vertices[edge.target] || edge.target;

    const fromText = !referencedNodeIds.has(edge.source) ? `["${fromLabel}"]` : '';
    const toText = !referencedNodeIds.has(edge.target) ? `["${toLabel}"]` : '';

    referencedNodeIds.add(edge.source);
    referencedNodeIds.add(edge.target);

    if (edge.label) {
      output.push(`  ${fromId}${fromText} -->|"${edge.label}"| ${toId}${toText}`);
    } else {
      output.push(`  ${fromId}${fromText} --> ${toId}${toText}`);
    }
  });

  // If there are standalone vertices without edges
  for (const [id, label] of Object.entries(vertices)) {
    if (!referencedNodeIds.has(id)) {
      const nodeId = `node_${id.replace(/[^\w\d_]/g, '_')}`;
      output.push(`  ${nodeId}["${label}"]`);
    }
  }

  return output.join('\n') + '\n';
}
