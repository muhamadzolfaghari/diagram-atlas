/**
 * PlantUML -> Mermaid Diagram Converter Engine
 * Converts PlantUML sequence, class, state, and activity diagrams
 * into clean Mermaid syntax.
 */

export function parsePlantUmlToMermaid(pumlText) {
  if (!pumlText || typeof pumlText !== 'string') {
    throw new Error('Please provide PlantUML text to convert.');
  }

  // Strip @startuml and @enduml wrappers
  const cleanLines = pumlText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => !line.startsWith('@startuml') && !line.startsWith('@enduml') && !line.startsWith('skinparam'));

  // Detect diagram type
  const joined = cleanLines.join('\n');
  const isSequence = /->|-->|participant|actor|boundary|control|entity|database|autonumber/i.test(joined);
  const isClass = /class\s+\w+|\binterface\s+\w+|<\|--|\*--|o--/i.test(joined);
  const isState = /\[\*\]\s*-->|state\s+\w+/i.test(joined);

  if (isClass && !isSequence) {
    return convertPlantUmlClassToMermaid(cleanLines);
  }

  if (isState && !isSequence) {
    return convertPlantUmlStateToMermaid(cleanLines);
  }

  // Default to Sequence diagram
  return convertPlantUmlSequenceToMermaid(cleanLines);
}

function convertPlantUmlSequenceToMermaid(lines) {
  const output = ['sequenceDiagram'];

  for (const line of lines) {
    if (!line || line.startsWith('\'')) continue; // Skip comments

    if (/^autonumber/i.test(line)) {
      output.push('  autonumber');
      continue;
    }

    // Participant / Actor definitions: participant "Display Name" as Id
    const partMatch = line.match(/^(participant|actor|boundary|control|entity|database)\s+(?:"([^"]+)"|(\w+))(?:\s+as\s+(\w+))?/i);
    if (partMatch) {
      const type = partMatch[1].toLowerCase() === 'actor' ? 'actor' : 'participant';
      const label = partMatch[2] || partMatch[3];
      const alias = partMatch[4] || label;
      if (alias !== label) {
        output.push(`  ${type} ${alias} as ${label}`);
      } else {
        output.push(`  ${type} ${alias}`);
      }
      continue;
    }

    // Notes: note (left of|right of|over) Target: text
    const noteMatch = line.match(/^note\s+(left of|right of|over)\s+([^:]+)(?::\s*(.*))?$/i);
    if (noteMatch) {
      const position = noteMatch[1].trim();
      const target = noteMatch[2].trim();
      const text = noteMatch[3] ? noteMatch[3].trim() : '';
      output.push(`  Note ${position} ${target}: ${text}`);
      continue;
    }

    // Alt / Else / Opt / Loop / Par blocks
    if (/^alt\b/i.test(line)) {
      output.push(`  ${line}`);
      continue;
    }
    if (/^else\b/i.test(line)) {
      output.push(`  ${line}`);
      continue;
    }
    if (/^loop\b/i.test(line)) {
      output.push(`  ${line}`);
      continue;
    }
    if (/^opt\b/i.test(line)) {
      output.push(`  ${line}`);
      continue;
    }
    if (/^par\b/i.test(line)) {
      output.push(`  ${line}`);
      continue;
    }
    if (/^end\b/i.test(line)) {
      output.push('  end');
      continue;
    }

    // Arrows:
    // A -> B: Message   => A->>B: Message
    // A --> B: Response => A-->>B: Response
    // A ->> B: Async    => A-)B: Async
    // A -->> B: Async   => A--)B: Async
    const arrowMatch = line.match(/^([\w\d_-]+)\s*(-->|->>|-->>|->)\s*([\w\d_-]+)\s*(?::\s*(.*))?$/);
    if (arrowMatch) {
      const from = arrowMatch[1];
      const op = arrowMatch[2];
      const to = arrowMatch[3];
      const msg = arrowMatch[4] ? arrowMatch[4].trim() : '';

      let mermaidArrow = '->>';
      if (op === '-->') mermaidArrow = '-->>';
      if (op === '->>') mermaidArrow = '-)';
      if (op === '-->>') mermaidArrow = '--)';

      output.push(`  ${from}${mermaidArrow}${to}: ${msg}`);
      continue;
    }

    // Fallback pass-through indented
    output.push(`  ${line}`);
  }

  return output.join('\n') + '\n';
}

function convertPlantUmlClassToMermaid(lines) {
  const output = ['classDiagram'];

  for (const line of lines) {
    if (!line || line.startsWith('\'')) continue;

    // Handle inheritance / relations: A <|-- B
    if (/<\|--|\*--|o--|\.\.>|-->/.test(line)) {
      output.push(`  ${line}`);
      continue;
    }

    // Class definition: class ClassName { ... }
    output.push(`  ${line}`);
  }

  return output.join('\n') + '\n';
}

function convertPlantUmlStateToMermaid(lines) {
  const output = ['stateDiagram-v2'];

  for (const line of lines) {
    if (!line || line.startsWith('\'')) continue;
    output.push(`  ${line}`);
  }

  return output.join('\n') + '\n';
}
