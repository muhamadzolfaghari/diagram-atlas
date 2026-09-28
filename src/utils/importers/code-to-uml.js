/**
 * Code → Mermaid Class Diagram Converter
 * Supports: TypeScript, JavaScript, Python, Java, C#, Go, Rust (best-effort)
 */

/**
 * @param {string} code - Source code string
 * @returns {string} Mermaid classDiagram syntax
 */
export function parseCodeToClassDiagram(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Please provide source code to convert.');
  }

  const classes = {}; // { className: { fields, methods, parents, interfaces } }

  // Strip block comments /* … */ and line comments // … / # …
  const clean = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/#.*/g, '');

  // ─── TypeScript / JavaScript class detection ──────────────────────────────
  const tsClassRe = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g;
  let m;
  while ((m = tsClassRe.exec(clean)) !== null) {
    const name = m[1];
    if (!classes[name]) classes[name] = { fields: [], methods: [], parents: [], interfaces: [] };
    if (m[2]) classes[name].parents.push(m[2]);
    if (m[3]) m[3].split(',').map(s => s.trim()).filter(Boolean).forEach(i => classes[name].interfaces.push(i));
  }

  // ─── Python class detection ───────────────────────────────────────────────
  const pyClassRe = /class\s+(\w+)(?:\(([\w,\s]*)\))?:/g;
  while ((m = pyClassRe.exec(clean)) !== null) {
    const name = m[1];
    if (!classes[name]) classes[name] = { fields: [], methods: [], parents: [], interfaces: [] };
    if (m[2]) {
      m[2].split(',').map(s => s.trim()).filter(s => s && s !== 'object').forEach(p => {
        classes[name].parents.push(p);
      });
    }
  }

  // ─── Java / C# class / interface detection ────────────────────────────────
  const javaClassRe = /(?:public|private|protected|abstract|static)?\s*(?:class|interface|enum)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g;
  while ((m = javaClassRe.exec(clean)) !== null) {
    const name = m[1];
    if (!classes[name]) classes[name] = { fields: [], methods: [], parents: [], interfaces: [] };
    if (m[2] && !classes[name].parents.includes(m[2])) classes[name].parents.push(m[2]);
    if (m[3]) m[3].split(',').map(s => s.trim()).filter(Boolean).forEach(i => {
      if (!classes[name].interfaces.includes(i)) classes[name].interfaces.push(i);
    });
  }

  // ─── Go struct detection ──────────────────────────────────────────────────
  const goStructRe = /type\s+(\w+)\s+struct\s*\{/g;
  while ((m = goStructRe.exec(clean)) !== null) {
    const name = m[1];
    if (!classes[name]) classes[name] = { fields: [], methods: [], parents: [], interfaces: [] };
  }

  // ─── Rust struct detection ────────────────────────────────────────────────
  const rustStructRe = /(?:pub\s+)?struct\s+(\w+)/g;
  while ((m = rustStructRe.exec(clean)) !== null) {
    const name = m[1];
    if (!classes[name]) classes[name] = { fields: [], methods: [], parents: [], interfaces: [] };
  }

  // ─── Field extraction ────────────────────────────────────────────────────
  // TypeScript: [access modifier] fieldName[?]: Type
  const tsFieldRe = /(?:(?:public|private|protected|readonly|static|override)\s+)*(\w+)\s*(?:\??\s*):\s*([\w<>\[\]|&, ]+)\s*(?:=|;)/g;

  // Python: self.field = … or field: Type = …
  const pyFieldRe = /(?:self\.(\w+)\s*=|(\w+)\s*:\s*([\w\[\], |]+)\s*=)/g;

  // Java/C# fields: [modifier] Type fieldName;
  const javaFieldRe = /(?:(?:public|private|protected|static|final|readonly)\s+)+(\w+(?:<[\w<>, ]+>)?(?:\[\])?)\s+(\w+)\s*(?:=|;)/g;

  // Apply field extraction per class body (best-effort: scan between consecutive class names)
  const classNames = Object.keys(classes);
  for (const className of classNames) {
    // Find the class body region
    const classBodyStart = new RegExp(`\\b(?:class|struct)\\s+${className}\\b`);
    const startIdx = clean.search(classBodyStart);
    if (startIdx === -1) continue;

    // Extract up to next top-level class or end of file
    let nextIdx = clean.length;
    for (const other of classNames) {
      if (other === className) continue;
      const otherIdx = clean.search(new RegExp(`\\b(?:class|struct)\\s+${other}\\b`));
      if (otherIdx > startIdx && otherIdx < nextIdx) nextIdx = otherIdx;
    }

    const body = clean.slice(startIdx, nextIdx);

    // TS fields
    let fm;
    const tsFieldLocal = new RegExp(tsFieldRe.source, 'g');
    while ((fm = tsFieldLocal.exec(body)) !== null) {
      const fname = fm[1];
      const ftype = (fm[2] || 'any').trim().replace(/[<>[\] ]/g, '').slice(0, 20);
      if (fname && !['constructor', 'return', 'const', 'let', 'var'].includes(fname)) {
        classes[className].fields.push({ name: fname, type: ftype, vis: '+' });
      }
    }

    // Python self.field
    const pyLocal = new RegExp(pyFieldRe.source, 'g');
    while ((fm = pyLocal.exec(body)) !== null) {
      const fname = fm[1] || fm[2];
      const ftype = fm[3] || 'Any';
      if (fname) {
        const vis = fname.startsWith('__') ? '-' : fname.startsWith('_') ? '#' : '+';
        if (!classes[className].fields.some(f => f.name === fname)) {
          classes[className].fields.push({ name: fname, type: ftype.trim().slice(0, 20), vis });
        }
      }
    }

    // Java/C# fields
    const javaLocal = new RegExp(javaFieldRe.source, 'g');
    while ((fm = javaLocal.exec(body)) !== null) {
      const ftype = fm[1].slice(0, 20);
      const fname = fm[2];
      if (fname && !['void', 'class', 'return'].includes(ftype.toLowerCase())) {
        if (!classes[className].fields.some(f => f.name === fname)) {
          classes[className].fields.push({ name: fname, type: ftype, vis: '+' });
        }
      }
    }

    // ─── Method extraction ─────────────────────────────────────────────────
    // TS/JS: [modifier] methodName(args): ReturnType { or =>
    const tsMethodRe = /(?:(?:public|private|protected|static|async|override|abstract)\s+)*(\w+)\s*\(([^)]*)\)\s*(?::\s*[\w<>\[\]|& ,]+)?\s*(?:\{|=>)/g;
    while ((fm = tsMethodRe.exec(body)) !== null) {
      const mname = fm[1];
      if (!['if', 'for', 'while', 'switch', 'catch'].includes(mname)) {
        const vis = mname.startsWith('_') ? '-' : '+';
        if (!classes[className].methods.some(me => me.name === mname)) {
          classes[className].methods.push({ name: mname, args: (fm[2] || '').slice(0, 30), vis });
        }
      }
    }

    // Python: def method(self, …):
    const pyMethodRe = /def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[\w\[\], |]+)?\s*:/g;
    while ((fm = pyMethodRe.exec(body)) !== null) {
      const mname = fm[1];
      const vis = mname.startsWith('__') ? '-' : mname.startsWith('_') ? '#' : '+';
      if (!classes[className].methods.some(me => me.name === mname)) {
        const args = (fm[2] || '').replace(/self,?\s*/, '').slice(0, 30);
        classes[className].methods.push({ name: mname, args, vis });
      }
    }
  }

  // ─── Build Mermaid output ─────────────────────────────────────────────────
  if (Object.keys(classes).length === 0) {
    throw new Error('No classes, structs, or interfaces detected in the source code.');
  }

  const lines = ['classDiagram'];

  for (const [cname, data] of Object.entries(classes)) {
    lines.push(`  class ${cname} {`);

    // Fields (cap at 12 to keep diagram readable)
    data.fields.slice(0, 12).forEach(f => {
      lines.push(`    ${f.vis}${f.type} ${f.name}`);
    });

    // Methods (cap at 10)
    data.methods.slice(0, 10).forEach(me => {
      lines.push(`    ${me.vis}${me.name}(${me.args})`);
    });

    lines.push('  }');
  }

  // Relationships
  for (const [cname, data] of Object.entries(classes)) {
    data.parents.forEach(p => {
      if (classes[p]) lines.push(`  ${p} <|-- ${cname}`);
    });
    data.interfaces.forEach(i => {
      if (classes[i]) lines.push(`  ${i} <|.. ${cname}`);
    });
  }

  return lines.join('\n') + '\n';
}
