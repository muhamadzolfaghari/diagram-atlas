import mermaid from 'mermaid';
import { renderGraphvizWasm } from './wasm/wasm-accelerator.js';

/**
 * Mermaid & WebAssembly Graphviz renderer manager for NodeFlow
 * Provides theme initialization, pre-parse syntax validation,
 * and dual-engine rendering (Mermaid + Native Graphviz WebAssembly).
 */

let currentTheme = 'dark';
let renderSequence = 0;

/**
 * Check if the diagram source is Graphviz DOT syntax
 * @param {string} code
 * @returns {boolean}
 */
export function isGraphvizDot(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.replace(/---[\s\S]*?---/, '').trim();
  const firstLine = clean.split('\n')[0] || '';
  // Match standard Graphviz digraph, graph, strict digraph, strict graph
  return /^\s*(strict\s+)?(di)?graph\b/i.test(firstLine) && /[{;]/.test(clean);
}

export function initMermaid(theme = 'dark') {
  currentTheme = theme;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: currentTheme,
    suppressErrorRendering: true,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
      curve: 'basis',
      nodeSpacing: 45,
      rankSpacing: 75,
    },
    gantt: {
      useWidth: 2400,
      barHeight: 28,
      barGap: 8,
      topPadding: 56,
      leftPadding: 200,
      gridLineStartPadding: 45,
    },
    sequence: {
      useMaxWidth: false,
      boxMargin: 10,
      noteMargin: 10,
      messageMargin: 35,
    },
    class: {
      useMaxWidth: false,
    },
    state: {
      useMaxWidth: false,
    },
    er: {
      useMaxWidth: false,
    },
  });
}

export function setMermaidTheme(theme) {
  currentTheme = theme;
  initMermaid(theme);
}

export function getMermaidTheme() {
  return currentTheme;
}

/**
 * Validates and renders mermaid or native Graphviz source code into the target container.
 * If syntax is invalid, returns { success: false, error } without clearing the existing SVG!
 */
export async function renderMermaid(container, code) {
  const seq = ++renderSequence;

  if (!code || !code.trim()) {
    return { success: false, error: 'Empty diagram source' };
  }

  // 1. Native Graphviz WebAssembly Path
  if (isGraphvizDot(code)) {
    try {
      const svg = await renderGraphvizWasm(code);
      if (seq !== renderSequence) {
        return { success: false, aborted: true };
      }
      container.classList.remove('is-gantt');
      container.innerHTML = svg;
      return {
        success: true,
        svg,
        isGraphviz: true,
        engine: 'Graphviz C Engine (WebAssembly)',
      };
    } catch (gvErr) {
      const errorMsg = gvErr?.message || String(gvErr);
      return { success: false, error: cleanErrorMessage(errorMsg), isGraphviz: true };
    }
  }

  // 2. Standard Mermaid Path
  // Pre-validate syntax to prevent crashing or displaying default Mermaid error SVG
  try {
    const parseResult = await mermaid.parse(code, { suppressErrors: true });
    if (parseResult === false) {
      return { success: false, error: 'Invalid Mermaid syntax.' };
    }
  } catch (parseErr) {
    const errorMsg = parseErr?.message || parseErr?.str || String(parseErr);
    return { success: false, error: cleanErrorMessage(errorMsg) };
  }


  try {
    const id = `mermaid-render-${seq}`;
    const result = await mermaid.render(id, code);

    // If a newer render was triggered while this one was running, discard output
    if (seq !== renderSequence) {
      return { success: false, aborted: true };
    }

    // Determine if diagram is gantt for layout width handling
    const isGantt = /^\s*gantt\b/m.test(code);
    container.classList.toggle('is-gantt', isGantt);

    // Insert new SVG
    container.innerHTML = result.svg;
    if (typeof result.bindFunctions === 'function') {
      result.bindFunctions(container);
    }

    return {
      success: true,
      svg: result.svg,
      isGantt,
    };
  } catch (renderErr) {
    const errorMsg = renderErr?.message || renderErr?.str || String(renderErr);
    return { success: false, error: cleanErrorMessage(errorMsg) };
  }
}

function cleanErrorMessage(msg) {
  // Strip out HTML tags or internal stack trace artifacts if present
  let clean = msg.replace(/<[^>]*>/g, '').trim();
  if (clean.includes('Parse error on line')) {
    clean = clean.split('\n')[0];
  }
  return clean || 'Mermaid syntax error detected.';
}
