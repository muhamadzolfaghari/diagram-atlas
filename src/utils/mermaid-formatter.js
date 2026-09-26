/**
 * Mermaid Code Formatter and Beautifier
 * Auto-indents nested subgraphs, blocks, and normalizes syntax spacing.
 */

export function formatMermaidCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return rawCode;

  const lines = rawCode.split('\n');
  const formattedLines = [];
  let indentLevel = 0;
  const indentStr = '  ';

  // Patterns that increase indentation on following lines
  const indentOpeners = [
    /^\s*subgraph\b/i,
    /^\s*class\s+\w+\s*\{/i,
    /^\s*state\s+.*\{/i,
    /^\s*alt\b/i,
    /^\s*opt\b/i,
    /^\s*loop\b/i,
    /^\s*par\b/i,
    /^\s*critical\b/i,
    /^\s*group\b/i,
    /^\s*rect\b/i,
    /^\s*section\b/i,
  ];

  // Patterns that decrease indentation on current line
  const indentClosers = [
    /^\s*end\b/i,
    /^\s*\}/,
  ];

  // Patterns that temporarily drop indent for intermediate keywords
  const indentMiddle = [
    /^\s*else\b/i,
    /^\s*and\b/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Preserve empty lines, but avoid multiple consecutive blank lines
    if (!line) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    // Check if line closes an indentation block
    const isCloser = indentClosers.some((re) => re.test(line));
    const isMiddle = indentMiddle.some((re) => re.test(line));

    if (isCloser && indentLevel > 0) {
      indentLevel--;
    }

    const currentIndent = isMiddle ? Math.max(0, indentLevel - 1) : indentLevel;
    const prefix = indentStr.repeat(currentIndent);

    // Minor syntax improvements: space around standard arrows if cramped
    line = line
      .replace(/([a-zA-Z0-9_\]\)])-->([a-zA-Z0-9_\[\(])/g, '$1 --> $2')
      .replace(/([a-zA-Z0-9_\]\)])---\|/g, '$1 ---|')
      .replace(/\|-->/g, '| -->');

    formattedLines.push(prefix + line);

    // Check if this line opens a new block
    const isOpener = indentOpeners.some((re) => re.test(line));
    if (isOpener) {
      indentLevel++;
    }
  }

  return formattedLines.join('\n').trim() + '\n';
}
