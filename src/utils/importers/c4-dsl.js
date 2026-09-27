/**
 * Structurizr & C4 Model DSL to Mermaid C4Context Diagram Converter
 * Supports Structurizr DSL (`person`, `softwareSystem`, `container`, `->`)
 * and C4-PlantUML syntax (`Person()`, `System()`, `Container()`, `Rel()`).
 */

export function parseC4DslToMermaid(dslText) {
  if (!dslText || typeof dslText !== 'string') {
    throw new Error('Please provide Structurizr or C4 DSL text to convert.');
  }

  const cleanText = dslText
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '');

  const output = ['C4Context'];
  const elements = [];
  const rels = [];

  const cleanId = id => (id || 'node').replace(/[^a-zA-Z0-9_]/g, '_');
  const safeStr = s => (s || '').replace(/["\n\r]/g, "'").trim();

  // 1. Try C4-PlantUML style: Person(id, "Label", "Desc"), System(id, ...), Rel(src, tgt, "label", "tech")
  const plantUmlRegex = /(Person|Person_Ext|System|System_Ext|Container|Container_Ext|Component)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]*)"(?:\s*,\s*"([^"]*)")?/gi;
  let match;
  let found = 0;

  while ((match = plantUmlRegex.exec(cleanText)) !== null) {
    const kind = match[1];
    const id = cleanId(match[2]);
    const label = safeStr(match[3]);
    const desc = safeStr(match[4]);
    elements.push(`  ${kind}(${id}, "${label}", "${desc}")`);
    found++;
  }

  const plantUmlRelRegex = /Rel\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]*)"(?:\s*,\s*"([^"]*)")?\s*\)/gi;
  while ((match = plantUmlRelRegex.exec(cleanText)) !== null) {
    const src = cleanId(match[1]);
    const tgt = cleanId(match[2]);
    const label = safeStr(match[3]);
    const tech = safeStr(match[4]);
    rels.push(tech ? `  Rel(${src}, ${tgt}, "${label}", "${tech}")` : `  Rel(${src}, ${tgt}, "${label}")`);
    found++;
  }

  // 2. Structurizr DSL style:
  // var = person "Name" "Desc"
  // var = softwareSystem "Name" "Desc"
  // var = container "Name" "Desc" "Tech"
  // src -> tgt "Description" "Technology"
  const structurizrElemRegex = /([a-zA-Z0-9_]+)\s*=\s*(person|softwareSystem|container|component)\s*"([^"]+)"(?:\s*"([^"]*)")?(?:\s*"([^"]*)")?/gi;
  while ((match = structurizrElemRegex.exec(cleanText)) !== null) {
    const id = cleanId(match[1]);
    const rawKind = match[2].toLowerCase();
    const label = safeStr(match[3]);
    const desc = safeStr(match[4]);

    let kind = 'System';
    if (rawKind === 'person') kind = 'Person';
    else if (rawKind === 'container') kind = 'Container';
    else if (rawKind === 'component') kind = 'Component';

    elements.push(`  ${kind}(${id}, "${label}", "${desc}")`);
    found++;
  }

  const structurizrRelRegex = /([a-zA-Z0-9_]+)\s*->\s*([a-zA-Z0-9_]+)\s*"([^"]*)"(?:\s*"([^"]*)")?/gi;
  while ((match = structurizrRelRegex.exec(cleanText)) !== null) {
    const src = cleanId(match[1]);
    const tgt = cleanId(match[2]);
    const desc = safeStr(match[3]);
    const tech = safeStr(match[4]);
    rels.push(tech ? `  Rel(${src}, ${tgt}, "${desc}", "${tech}")` : `  Rel(${src}, ${tgt}, "${desc}")`);
    found++;
  }

  if (found === 0) {
    throw new Error('No C4 model elements (Person, System, Container, Rel) found in text.');
  }

  for (const el of elements) output.push(el);
  for (const r of rels) output.push(r);

  return output.join('\n');
}
