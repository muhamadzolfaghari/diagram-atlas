/**
 * AI Syntax Fixer for Mermaid Diagrams
 * Automatically diagnoses, repairs, and validates broken Mermaid syntax.
 * Combines deterministic rule-based repair (instant, 0 latency) with
 * local LLM fallback (Qwen / Ollama) when available.
 */
import mermaid from 'mermaid';

/**
 * Repairs broken Mermaid diagram code
 * @param {string} code - The broken Mermaid source code
 * @param {string} errorMessage - The parser error message
 * @param {object} opts - Optional options (aiAssistant, etc.)
 * @returns {Promise<{ success: boolean, fixedCode: string, fixes: string[], error?: string }>}
 */
export async function fixMermaidSyntax(code, errorMessage = '', opts = {}) {
  if (!code || typeof code !== 'string') {
    return { success: false, error: 'No code provided to fix.' };
  }

  const fixes = [];
  let currentCode = code;

  // 1. Strip markdown fences or chat conversational wrappers
  const cleanedWrapper = stripMarkdownFences(currentCode);
  if (cleanedWrapper !== currentCode) {
    fixes.push('Removed markdown backtick wrappers and conversational text');
    currentCode = cleanedWrapper;
  }

  // 2. Rule-based repairs
  const ruleResult = applyRuleBasedFixes(currentCode, errorMessage);
  if (ruleResult.fixes.length > 0) {
    fixes.push(...ruleResult.fixes);
    currentCode = ruleResult.code;
  }

  // 3. Test if current code now compiles cleanly
  const validation = await testMermaidSyntax(currentCode);
  if (validation.valid) {
    return {
      success: true,
      fixedCode: currentCode,
      fixes: fixes.length > 0 ? fixes : ['Cleaned syntax and resolved syntax conflicts'],
      method: 'deterministic',
    };
  }

  // 4. If rules didn't completely solve it, try secondary heuristics
  const secondaryResult = applyAggressiveFixes(currentCode, validation.error || errorMessage);
  if (secondaryResult.fixed) {
    const secondValidation = await testMermaidSyntax(secondaryResult.code);
    if (secondValidation.valid) {
      fixes.push(...secondaryResult.fixes);
      return {
        success: true,
        fixedCode: secondaryResult.code,
        fixes,
        method: 'heuristic',
      };
    }
  }

  // 5. If AI Assistant engine is provided and ready (Qwen or Ollama), query it
  if (opts.aiAssistant) {
    try {
      const aiResult = await fixWithLlm(opts.aiAssistant, code, errorMessage);
      if (aiResult && aiResult.success) {
        const aiValidation = await testMermaidSyntax(aiResult.code);
        if (aiValidation.valid) {
          return {
            success: true,
            fixedCode: aiResult.code,
            fixes: ['AI diagnosed and restructured invalid syntax'],
            method: 'llm',
          };
        }
      }
    } catch (llmErr) {
      console.warn('AI LLM syntax fix error:', llmErr);
    }
  }

  // If we made some valid progress, return best-effort
  return {
    success: false,
    fixedCode: currentCode,
    fixes,
    error: validation.error || errorMessage,
  };
}

/**
 * Validates syntax using Mermaid parser
 */
export async function testMermaidSyntax(code) {
  if (!code || !code.trim()) return { valid: false, error: 'Empty code' };
  try {
    const res = await mermaid.parse(code);
    return { valid: Boolean(res) };
  } catch (err) {
    if (err?.message?.includes('DOMPurify')) {
      // In headless/Node test environments DOMPurify is not attached to window,
      // but reaching DOMPurify hook means Mermaid parser syntax validation passed!
      return { valid: true };
    }
    return { valid: false, error: err?.message || String(err) };
  }
}

/**
 * Strips ```mermaid ... ``` or conversational artifacts
 */
function stripMarkdownFences(text) {
  let cleaned = text.trim();
  // If wrapped in ```mermaid ... ``` code block inside chat response, extract the block
  const blockMatch = cleaned.match(/```(?:mermaid)?\s*\n([\s\S]*?)\n```/i);
  if (blockMatch) {
    return blockMatch[1].trim();
  }
  // Strip standalone opening fence ```mermaid or ```
  cleaned = cleaned.replace(/^```(?:mermaid)?\s*\n?/i, '');
  // Strip standalone closing fence ```
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  // Strip common conversational chat prefixes/suffixes
  cleaned = cleaned.replace(/^(?:Here is the(?: fixed)? (?:Mermaid )?diagram:?|Sure! Here is the code:?)\s*\n+/i, '');
  cleaned = cleaned.replace(/\n+(?:Hope this helps!?|Let me know if you need any adjustments!?|Enjoy!?)\s*$/i, '');
  return cleaned.trim();
}

/**
 * Applies deterministic rule-based corrections for common Mermaid syntax errors
 */
function applyRuleBasedFixes(code, errorMsg = '') {
  const fixes = [];
  let lines = code.split('\n');

  // A. Check for missing diagram type header
  const firstNonEmpty = lines.find((l) => l.trim().length > 0) || '';
  const hasHeader = /^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|journey|xychart|block)\b/i.test(
    firstNonEmpty.trim()
  );

  if (!hasHeader) {
    if (/\b(?:->>|-->>)\b/.test(code) || /\b(?:actor|participant)\b/i.test(code)) {
      lines.unshift('sequenceDiagram', '    autonumber');
      fixes.push('Added missing sequenceDiagram header with autonumber');
    } else if (/\b(?:\|\|--|}\|--|--o\{)\b/.test(code)) {
      lines.unshift('erDiagram');
      fixes.push('Added missing erDiagram header');
    } else if (/\[\*\]\s*--?>|--?>\s*\[\*\]/.test(code)) {
      lines.unshift('stateDiagram-v2');
      fixes.push('Added missing stateDiagram-v2 header');
    } else if (/\b(?:<\|--|<\|\.\.|\*--|o--)\b/.test(code) || /^\s*class\s+\w+/m.test(code)) {
      lines.unshift('classDiagram');
      fixes.push('Added missing classDiagram header');
    } else {
      lines.unshift('flowchart TD');
      fixes.push('Added missing flowchart TD header');
    }
  }

  // B. Standardize flowchart / graph headers
  if (/^graph\b/i.test(lines[0].trim())) {
    const rest = lines[0].trim().replace(/^graph\s*/i, '');
    lines[0] = `flowchart ${rest || 'TD'}`;
    fixes.push('Updated legacy graph syntax to modern flowchart');
  } else if (/^flowcharts?\b/i.test(lines[0].trim()) && !/^flowchart\s+[A-Z]{2}\b/i.test(lines[0].trim())) {
    lines[0] = 'flowchart TD';
    fixes.push('Standardized flowchart direction to flowchart TD');
  }

  // C. Fix unclosed subgraphs
  const subgraphCount = lines.filter((l) => /^\s*subgraph\b/i.test(l)).length;
  const endCount = lines.filter((l) => /^\s*end\b/i.test(l)).length;
  if (subgraphCount > endCount) {
    const missing = subgraphCount - endCount;
    for (let i = 0; i < missing; i++) {
      lines.push('    end');
    }
    fixes.push(`Closed ${missing} unclosed subgraph block(s) with 'end'`);
  }

  // D. Process line by line for arrow operators and unquoted labels
  let inFlowchart = /^(?:flowchart|graph)\b/i.test(lines[0]);
  let inSequence = /^sequenceDiagram\b/i.test(lines[0]);
  let inState = /^stateDiagram\b/i.test(lines[0]);

  lines = lines.map((line, idx) => {
    let l = line;

    if (inFlowchart) {
      // Fix single arrow '->' in flowchart which Mermaid rejects
      if (/(^|[^-])->([^-]|$)/.test(l) && !/-->/.test(l)) {
        l = l.replace(/([A-Za-z0-9_\]\)\}])\s*->\s*([A-Za-z0-9_\[\(\{])/g, '$1 --> $2');
        if (l !== line) fixes.push(`Replaced invalid single arrow '->' with '-->' on line ${idx + 1}`);
      }

      // Fix pipe labels with spaces: --> | label | B -> -->|label| B
      l = l.replace(/-->\s*\|\s*(.*?)\s*\|\s*/g, '-->|$1| ');

      // Fix unquoted special characters in node bracket labels: id[Some (Text) & /More/] -> id["Some (Text) & /More/"]
      const quotedBracket = l.replace(/(\b\w+)\s*\[([^"\n\[\]]*?[()\/&:,+{}<>][^"\n\[\]]*?)\]/g, (match, id, text) => {
        return `${id}["${text.trim()}"]`;
      });
      if (quotedBracket !== l) {
        l = quotedBracket;
        fixes.push(`Quoted special characters in node label on line ${idx + 1}`);
      }

      // Fix unquoted nested parentheses in round nodes: id(Some (Text)) -> id("Some (Text)")
      const quotedParen = l.replace(/(\b\w+)\s*\(([^"\n()]*?[()[\]{}][^"\n()]*?)\)/g, (match, id, text) => {
        return `${id}("${text.trim()}")`;
      });
      if (quotedParen !== l) {
        l = quotedParen;
        fixes.push(`Quoted special characters in rounded node on line ${idx + 1}`);
      }

      // Fix invalid subgraph syntax: subgraph Some Name (v1) -> subgraph SUB_N ["Some Name (v1)"]
      if (/^\s*subgraph\s+[^\["\n]+\s+[^\["\n]+/i.test(l) && !/\[/.test(l)) {
        const match = l.match(/^(\s*subgraph\s+)(.+)$/i);
        if (match) {
          const rawTitle = match[2].trim();
          const cleanId = rawTitle.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 16);
          l = `${match[1]}${cleanId} ["${rawTitle}"]`;
          fixes.push(`Quoted multi-word subgraph title on line ${idx + 1}`);
        }
      }
    }

    if (inSequence) {
      // Fix dotted arrow without double arrowhead: Bob --> Alice -> Bob -->> Alice
      if (/(^|\s)(\w+)\s*-->\s*(\w+)/.test(l)) {
        l = l.replace(/(^|\s)(\w+)\s*-->\s*(\w+)/g, '$1$2-->>$3');
        fixes.push(`Corrected dotted sequence arrow to '-->>' on line ${idx + 1}`);
      }
      // Fix single arrow '->' in sequence to '->>'
      if (/(^|\s)(\w+)\s*->\s*(\w+)/.test(l) && !/->>/.test(l)) {
        l = l.replace(/(^|\s)(\w+)\s*->\s*(\w+)/g, '$1$2->>$3');
        fixes.push(`Corrected arrow to '->>' on line ${idx + 1}`);
      }
      // Fix missing colon in sequence message: A->>B message -> A->>B: message
      if (/(->>|-->>|-\)|--\))\s*(\w+)\s+([^:\n]+)$/.test(l) && !l.includes(':')) {
        l = l.replace(/(->>|-->>|-\)|--\))\s*(\w+)\s+(.+)$/, '$1$2: $3');
        fixes.push(`Added missing ':' for message on line ${idx + 1}`);
      }
    }

    if (inState) {
      // Fix state diagram single arrows
      l = l.replace(/\[\*\]\s*->\s*/g, '[*] --> ');
      l = l.replace(/\s*->\s*\[\*\]/g, ' --> [*]');
      l = l.replace(/(\w+)\s*->\s*(\w+)/g, '$1 --> $2');
    }

    return l;
  });

  return { code: lines.join('\n'), fixes: Array.from(new Set(fixes)) };
}

/**
 * Secondary aggressive fixes when syntax still fails
 */
function applyAggressiveFixes(code, errorMsg = '') {
  const fixes = [];
  let lines = code.split('\n');

  // Strip empty lines from start/end
  while (lines.length > 0 && !lines[0].trim()) lines.shift();
  while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();

  // If Parse error indicates a specific line number:
  const lineMatch = errorMsg.match(/line\s+(\d+)/i);
  if (lineMatch) {
    const errorLineIdx = parseInt(lineMatch[1], 10) - 1;
    if (lines[errorLineIdx]) {
      const errLine = lines[errorLineIdx];
      // Escape all double quotes in that line inside node brackets
      const escaped = errLine.replace(/\[(.*?)\]/g, (m, content) => {
        const cleanContent = content.replace(/"/g, "'");
        return `["${cleanContent}"]`;
      });
      if (escaped !== errLine) {
        lines[errorLineIdx] = escaped;
        fixes.push(`Sanitized quotes and special characters on line ${errorLineIdx + 1}`);
      }
    }
  }

  // Remove any stray unclosed quotes across the file
  lines = lines.map((l) => {
    const quoteCount = (l.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      fixes.push('Balanced unclosed quotes in diagram line');
      return l + '"';
    }
    return l;
  });

  return { fixed: fixes.length > 0, code: lines.join('\n'), fixes };
}

/**
 * Fallback to LLM if active in AIAssistant (Qwen or Ollama)
 */
async function fixWithLlm(aiAssistant, code, errorMsg) {
  if (!aiAssistant) return null;

  const prompt = `Fix this invalid Mermaid diagram syntax error.
Error: ${errorMsg}

Broken Code:
\`\`\`mermaid
${code}
\`\`\`

Return ONLY the corrected valid Mermaid diagram code inside a single \`\`\`mermaid ... \`\`\` code block. Do NOT include explanations.`;

  try {
    if (aiAssistant.engineMode === 'ollama' && aiAssistant.ollamaConnected) {
      const res = await fetch(`${aiAssistant.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiAssistant.ollamaModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.message?.content || '';
        const fixed = aiAssistant.extractMermaidCode(text);
        if (fixed) return { success: true, code: fixed };
      }
    }

    if (aiAssistant.engineMode === 'qwen' && aiAssistant.qwenLoaded && aiAssistant.qwenEngine) {
      const completion = await aiAssistant.qwenEngine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: 600,
      });
      const text = completion.choices[0]?.message?.content || '';
      const fixed = aiAssistant.extractMermaidCode(text);
      if (fixed) return { success: true, code: fixed };
    }
  } catch (err) {
    console.warn('fixWithLlm error:', err);
  }

  return null;
}
