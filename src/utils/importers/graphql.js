/**
 * GraphQL SDL (Schema Definition Language) to Mermaid Class Diagram Converter
 * Parses GraphQL types, interfaces, enums, unions, and fields into Mermaid classDiagram.
 */

export function parseGraphQLToMermaid(sdlText) {
  if (!sdlText || typeof sdlText !== 'string') {
    throw new Error('Please provide GraphQL Schema text to convert.');
  }

  // Strip block comments (""" ... """) and line comments (# ...)
  const cleanText = sdlText
    .replace(/"""[\s\S]*?"""/g, '')
    .replace(/#.*$/gm, '')
    .trim();

  if (!cleanText) {
    throw new Error('GraphQL Schema text contains no valid definitions.');
  }

  const output = ['classDiagram'];
  const relationships = [];

  // Match: type | interface | input | enum Name [implements Interface] { fields }
  const typeRegex = /(type|interface|input|enum)\s+([A-Za-z0-9_]+)(?:\s+implements\s+([A-Za-z0-9_,\s]+))?\s*\{([^}]*)\}/g;
  let match;
  let count = 0;

  while ((match = typeRegex.exec(cleanText)) !== null) {
    const kind = match[1];
    const name = match[2];
    const implementsClause = match[3];
    const body = match[4];

    // Skip root Query, Mutation, Subscription if desired, or include them as controllers
    output.push(`  class ${name} {`);
    if (kind === 'enum') {
      output.push('    <<enumeration>>');
      const enumValues = body
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
      for (const val of enumValues.slice(0, 15)) {
        output.push(`    +${val}`);
      }
    } else if (kind === 'interface') {
      output.push('    <<interface>>');
    }

    if (implementsClause) {
      const interfaces = implementsClause.split(',').map(i => i.trim()).filter(Boolean);
      for (const iface of interfaces) {
        relationships.push(`  ${iface} <|-- ${name} : implements`);
      }
    }

    if (kind !== 'enum') {
      const fieldLines = body
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      for (const line of fieldLines) {
        // fieldName(args): Type! or fieldName: Type
        const fieldMatch = line.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*([A-Za-z0-9_!\[\]]+)/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const rawType = fieldMatch[2];
          const cleanType = rawType.replace(/!/g, '');
          const isList = cleanType.startsWith('[') && cleanType.endsWith(']');
          const baseType = isList ? cleanType.slice(1, -1) : cleanType;

          // Standard GraphQL scalars
          const scalars = ['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime', 'JSON'];
          if (!scalars.includes(baseType)) {
            if (isList) {
              relationships.push(`  ${name} --> "0..*" ${baseType} : ${fieldName}`);
            } else {
              relationships.push(`  ${name} --> "1" ${baseType} : ${fieldName}`);
            }
          }

          const safeType = isList ? `List~${baseType}~` : baseType;
          output.push(`    +${safeType} ${fieldName}`);
        }
      }
    }

    output.push('  }');
    count++;
  }

  // Match unions: union SearchResult = User | Post | Comment
  const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
  while ((match = unionRegex.exec(cleanText)) !== null) {
    const unionName = match[1];
    const members = match[2].split('|').map(m => m.trim()).filter(Boolean);
    output.push(`  class ${unionName} {`);
    output.push('    <<union>>');
    output.push('  }');
    for (const mem of members) {
      relationships.push(`  ${unionName} <|-- ${mem} : variant`);
    }
    count++;
  }

  if (count === 0) {
    throw new Error('No GraphQL types, interfaces, or enums could be parsed.');
  }

  // Deduplicate and append relationships
  const uniqueRels = [...new Set(relationships)];
  for (const rel of uniqueRels) {
    output.push(rel);
  }

  return output.join('\n');
}
