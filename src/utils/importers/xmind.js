import JSZip from 'jszip';

/**
 * XMind <-> Mermaid Mindmap Bi-directional Conversion Engine
 * Supports modern XMind (.xmind / XMind ZEN / Snowbrush JSON format)
 * and legacy XMind 8 (XML format).
 */

/**
 * Clean and escape node text for Mermaid mindmap syntax
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeMindmapNodeText(text) {
  if (!text) return 'Topic';
  // Replace linebreaks with spaces
  let cleaned = String(text).trim().replace(/\r?\n/g, ' ');
  // If contains special characters like () [] {} " ' or spaces, wrap in safe brackets
  if (/[\(\)\[\]\{\}"',;:!@#$%^&*+=<>?/\\|~`]/.test(cleaned) || cleaned.includes(' ')) {
    // Escape double quotes inside string
    const safeText = cleaned.replace(/"/g, "'");
    return `["${safeText}"]`;
  }
  return cleaned;
}

/**
 * Recursively convert an XMind topic node into indented Mermaid mindmap lines
 * @param {Object} topic - XMind topic object
 * @param {number} depth - Indentation depth
 * @param {Array<string>} lines - Output lines accumulator
 */
function traverseXmindTopic(topic, depth, lines) {
  if (!topic) return;

  const title = topic.title || 'Topic';
  const indent = '  '.repeat(depth);

  if (depth === 1) {
    // Root node
    const safeTitle = title.replace(/"/g, "'").trim();
    lines.push(`${indent}root(("${safeTitle}"))`);
  } else {
    lines.push(`${indent}${sanitizeMindmapNodeText(title)}`);
  }

  // Children can be in topic.children.attached (XMind standard)
  const attached = topic.children?.attached;
  if (Array.isArray(attached) && attached.length > 0) {
    for (const child of attached) {
      traverseXmindTopic(child, depth + 1, lines);
    }
  }

  // Some formats also have detached / summary topics
  const detached = topic.children?.detached;
  if (Array.isArray(detached) && detached.length > 0) {
    for (const child of detached) {
      traverseXmindTopic(child, depth + 1, lines);
    }
  }
}

/**
 * Parse an XMind file (.xmind ArrayBuffer / Uint8Array / Blob) into Mermaid mindmap code
 * @param {ArrayBuffer|Uint8Array|Blob} data 
 * @returns {Promise<{ mermaidCode: string, title: string, sheets: Array<string> }>}
 */
export async function parseXmindToMermaid(data) {
  const zip = new JSZip();
  let zipContent;

  try {
    zipContent = await zip.loadAsync(data);
  } catch (err) {
    throw new Error(`Failed to read .xmind file as ZIP archive: ${err.message}`);
  }

  // 1. Try modern XMind format: content.json
  const contentJsonFile = zipContent.file('content.json');
  if (contentJsonFile) {
    const jsonText = await contentJsonFile.async('text');
    let sheets;
    try {
      sheets = JSON.parse(jsonText);
    } catch (e) {
      throw new Error(`Invalid JSON in XMind content.json: ${e.message}`);
    }

    if (!Array.isArray(sheets) || sheets.length === 0) {
      throw new Error('XMind content.json does not contain any sheets');
    }

    const firstSheet = sheets[0];
    const rootTopic = firstSheet.rootTopic;
    if (!rootTopic) {
      throw new Error('XMind sheet does not contain a root topic');
    }

    const title = rootTopic.title || firstSheet.title || 'XMind Mindmap';
    const lines = ['mindmap'];
    traverseXmindTopic(rootTopic, 1, lines);

    return {
      mermaidCode: lines.join('\n') + '\n',
      title: title,
      sheets: sheets.map(s => s.title || 'Untitled Sheet')
    };
  }

  // 2. Try legacy XMind format: content.xml
  const contentXmlFile = zipContent.file('content.xml');
  if (contentXmlFile) {
    const xmlText = await contentXmlFile.async('text');
    return parseXmindXmlToMermaid(xmlText);
  }

  throw new Error('Unsupported XMind format: neither content.json nor content.xml was found in the archive.');
}

/**
 * Fallback parser for legacy XMind 8 XML content
 * @param {string} xmlText 
 */
function parseXmindXmlToMermaid(xmlText) {
  // Use simple regex-based tree parsing if DOMParser is unavailable, or DOMParser if available
  let doc;
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(xmlText, 'application/xml');
  } else if (typeof global !== 'undefined' && global.window?.DOMParser) {
    const parser = new global.window.DOMParser();
    doc = parser.parseFromString(xmlText, 'application/xml');
  }

  if (doc) {
    const rootTopicEl = doc.querySelector('sheet > topic');
    if (!rootTopicEl) throw new Error('No root topic found in XMind XML');

    const lines = ['mindmap'];
    function walkXmlTopic(topicEl, depth) {
      const titleEl = topicEl.querySelector(':scope > title');
      const title = titleEl ? titleEl.textContent : 'Topic';
      const indent = '  '.repeat(depth);

      if (depth === 1) {
        lines.push(`${indent}root(("${title.replace(/"/g, "'").trim()}"))`);
      } else {
        lines.push(`${indent}${sanitizeMindmapNodeText(title)}`);
      }

      const childTopics = topicEl.querySelectorAll(':scope > children > topics > topic');
      childTopics.forEach(child => walkXmlTopic(child, depth + 1));
    }

    walkXmlTopic(rootTopicEl, 1);
    const rootTitle = rootTopicEl.querySelector(':scope > title')?.textContent || 'XMind Mindmap';
    return {
      mermaidCode: lines.join('\n') + '\n',
      title: rootTitle,
      sheets: ['Sheet 1']
    };
  }

  throw new Error('Unable to parse legacy XML format: DOMParser unavailable');
}

/**
 * Parse a Mermaid mindmap string into an in-memory topic tree
 * @param {string} mermaidText 
 * @returns {{ title: string, children: Array<any> }}
 */
export function parseMermaidMindmapToTree(mermaidText) {
  const lines = mermaidText
    .split(/\r?\n/)
    .map(line => line.replace(/\t/g, '  '))
    .filter(line => line.trim().length > 0 && !line.trim().startsWith('%%'));

  if (lines.length === 0 || !lines[0].trim().startsWith('mindmap')) {
    throw new Error('Not a valid Mermaid mindmap diagram (must begin with "mindmap")');
  }

  let root = null;
  const stack = []; // { depth: number, topic: Object }

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Calculate leading spaces
    const leadingSpaces = rawLine.length - rawLine.trimStart().length;
    // Extract node text, stripping shape wrappers like root((Text)), ["Text"], (Text), [Text]
    let nodeText = trimmed;
    const rootMatch = trimmed.match(/^root\s*\(\((.*?)\)\)$/i);
    if (rootMatch) {
      nodeText = rootMatch[1];
    } else {
      const bracketMatch = trimmed.match(/^\["(.*?)"\]$/) ||
                           trimmed.match(/^\("(.*?)"\)$/) ||
                           trimmed.match(/^\[(.*?)\]$/) ||
                           trimmed.match(/^\((.*?)\)$/);
      if (bracketMatch) {
        nodeText = bracketMatch[1];
      }
    }

    const topic = {
      id: `topic-${Math.random().toString(36).slice(2, 9)}`,
      title: nodeText,
      children: { attached: [] }
    };

    if (!root) {
      root = topic;
      stack.push({ depth: leadingSpaces, topic });
      continue;
    }

    // Find parent in stack
    while (stack.length > 0 && stack[stack.length - 1].depth >= leadingSpaces) {
      stack.pop();
    }

    if (stack.length > 0) {
      const parent = stack[stack.length - 1].topic;
      parent.children.attached.push(topic);
    } else {
      // Sibling of root or detached
      root.children.attached.push(topic);
    }

    stack.push({ depth: leadingSpaces, topic });
  }

  return root || { id: 'root', title: 'Central Topic', children: { attached: [] } };
}

/**
 * Export Mermaid mindmap diagram code to a full standard .xmind file Blob
 * Compatible with XMind 2024, XMind Mobile, and XMind ZEN
 * @param {string} mermaidCode 
 * @param {string} [title='Mermaid Diagram'] 
 * @returns {Promise<Blob>}
 */
export async function exportMermaidToXmindBlob(mermaidCode, title = 'Mermaid Diagram') {
  const tree = parseMermaidMindmapToTree(mermaidCode);
  const sheetTitle = tree.title || title;

  const contentJson = [
    {
      id: `sheet-${Date.now()}`,
      class: 'sheet',
      title: sheetTitle,
      rootTopic: {
        id: tree.id || 'root-topic',
        class: 'topic',
        title: tree.title,
        structureClass: 'org.xmind.ui.map.unbalanced',
        children: tree.children
      }
    }
  ];

  const metadataJson = {
    creator: {
      name: 'Mermaid Studio',
      version: '1.0.0'
    }
  };

  const manifestJson = {
    'file-entries': {
      'content.json': {},
      'metadata.json': {}
    }
  };

  const zip = new JSZip();
  zip.file('content.json', JSON.stringify(contentJson, null, 2));
  zip.file('metadata.json', JSON.stringify(metadataJson, null, 2));
  zip.file('manifest.json', JSON.stringify(manifestJson, null, 2));

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.xmind.workbook',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * Generate a ready-to-test sample XMind mindmap object
 * @returns {Object}
 */
export function createSampleXmindData() {
  return [
    {
      id: 'sheet-demo-1',
      title: 'Full-Stack Architecture Plan',
      rootTopic: {
        id: 'root-arch',
        title: 'Cloud Native Application',
        children: {
          attached: [
            {
              id: 'frontend',
              title: 'Frontend Client',
              children: {
                attached: [
                  { id: 'fe-1', title: 'Vite & Tailwind CSS v4' },
                  { id: 'fe-2', title: 'Mermaid Engine v11' },
                  { id: 'fe-3', title: 'Local AI (WebLLM Qwen2.5)' }
                ]
              }
            },
            {
              id: 'backend',
              title: 'Backend Services',
              children: {
                attached: [
                  { id: 'be-1', title: 'Edge Microservices (Cloudflare/Node)' },
                  { id: 'be-2', title: 'Protobuf gRPC Middleware' },
                  { id: 'be-3', title: 'PostgreSQL Database' }
                ]
              }
            },
            {
              id: 'devops',
              title: 'DevOps & Tooling',
              children: {
                attached: [
                  { id: 'do-1', title: 'GitHub Actions CI/CD' },
                  { id: 'do-2', title: 'Vitest Unit & Integration' },
                  { id: 'do-3', title: 'SEO Rich Schemas' }
                ]
              }
            }
          ]
        }
      }
    }
  ];
}
