/**
 * FreeMind (.mm) & OPML (.opml) to Mermaid Mindmap Converter
 * Parses FreeMind XML <node TEXT="..."> and OPML <outline text="..."> structures
 * into clean, hierarchical Mermaid mindmaps.
 */

export function parseFreeMindOrOpmlToMermaid(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') {
    throw new Error('Please provide FreeMind XML or OPML text to convert.');
  }

  const isOpml = /<opml\b/i.test(xmlText);
  const isFreeMind = /<map\b|<node\b/i.test(xmlText);

  if (!isOpml && !isFreeMind) {
    throw new Error('Text does not appear to be valid FreeMind (.mm) or OPML (.opml) XML.');
  }

  const lines = ['mindmap'];

  // Resilient recursive parsing using regex to support browser and Node environments
  if (isOpml) {
    parseOpml(xmlText, lines);
  } else {
    parseFreeMind(xmlText, lines);
  }

  if (lines.length <= 1) {
    throw new Error('Could not parse any nodes from FreeMind/OPML XML.');
  }

  return lines.join('\n');
}

function parseFreeMind(xmlText, output) {
  // Regex to iterate over <node TEXT="..."> tags and their closing </node> tags
  // to track tree depth
  const tokenRegex = /<node\b([^>]*?)(\/?>)|<\/node>/gi;
  let depth = 1;
  let match;
  let rootFound = false;

  while ((match = tokenRegex.exec(xmlText)) !== null) {
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = match[2] === '/>';
    const attrs = match[1] || '';

    if (isClosing) {
      if (depth > 1) depth--;
      continue;
    }

    const textMatch = attrs.match(/\bTEXT=["']([^"']+)["']/i);
    const rawText = textMatch ? textMatch[1] : 'Node';
    const cleanText = rawText.replace(/[()\[\]{}"\n\r]/g, ' ').trim() || 'Node';

    const indent = '  '.repeat(depth);
    if (!rootFound) {
      output.push(`${indent}root((${cleanText}))`);
      rootFound = true;
    } else {
      output.push(`${indent}${cleanText}`);
    }

    if (!isSelfClosing) {
      depth++;
    }
  }
}

function parseOpml(xmlText, output) {
  const tokenRegex = /<outline\b([^>]*?)(\/?>)|<\/outline>/gi;
  let depth = 1;
  let match;
  let rootFound = false;

  while ((match = tokenRegex.exec(xmlText)) !== null) {
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = match[2] === '/>';
    const attrs = match[1] || '';

    if (isClosing) {
      if (depth > 1) depth--;
      continue;
    }

    const textMatch = attrs.match(/\btext=["']([^"']+)["']/i) || attrs.match(/\btitle=["']([^"']+)["']/i);
    const rawText = textMatch ? textMatch[1] : 'Topic';
    const cleanText = rawText.replace(/[()\[\]{}"\n\r]/g, ' ').trim() || 'Topic';

    const indent = '  '.repeat(depth);
    if (!rootFound) {
      output.push(`${indent}root((${cleanText}))`);
      rootFound = true;
    } else {
      output.push(`${indent}${cleanText}`);
    }

    if (!isSelfClosing) {
      depth++;
    }
  }
}
