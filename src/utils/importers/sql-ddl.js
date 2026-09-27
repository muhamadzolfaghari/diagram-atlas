/**
 * SQL DDL to Mermaid ER Diagram Converter
 * Parses CREATE TABLE statements, columns, types, primary keys, and foreign keys.
 */

export function parseSqlDdlToMermaid(sqlText) {
  if (!sqlText || typeof sqlText !== 'string') {
    throw new Error('Please provide SQL DDL text to convert.');
  }

  const cleanSql = sqlText
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*/g, '');

  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|\[)?([a-zA-Z0-9_]+)(?:`|"|\])?\s*\(([\s\S]*?)\);/gi;
  const tables = {}; // { tableName: { columns: [], fks: [] } }
  const relations = []; // { from, to, label }

  let match;
  while ((match = tableRegex.exec(cleanSql)) !== null) {
    const tableName = match[1].toLowerCase();
    const body = match[2];
    tables[tableName] = { columns: [], fks: [] };

    const lines = body.split(/,(?![^(]*\))/); // split commas outside parentheses
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Foreign key inline or constraint: FOREIGN KEY (user_id) REFERENCES users(id)
      const fkMatch = trimmed.match(/(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\((?:`|")?(\w+)(?:`|")?\)\s*REFERENCES\s*(?:`|")?(\w+)(?:`|")?\s*\((?:`|")?(\w+)(?:`|")?\)/i);
      if (fkMatch) {
        const col = fkMatch[1];
        const refTable = fkMatch[2].toLowerCase();
        tables[tableName].fks.push({ col, refTable });
        relations.push({ from: refTable, to: tableName, label: col });
        continue;
      }

      // Skip table-level primary key: PRIMARY KEY (id)
      const tablePkMatch = trimmed.match(/^PRIMARY\s+KEY\s*\((.*?)\)/i);
      if (tablePkMatch) {
        const pkCols = tablePkMatch[1].split(',').map(c => c.trim().replace(/[`"']/g, ''));
        tables[tableName].columns.forEach(colObj => {
          if (pkCols.includes(colObj.name)) colObj.key = 'PK';
        });
        continue;
      }

      // Column definition: id INT PRIMARY KEY, name VARCHAR(100)
      const colMatch = trimmed.match(/^(?:`|"|\[)?([a-zA-Z0-9_]+)(?:`|"|\])?\s+([a-zA-Z0-9_]+(?:\([^)]*\))?)(.*)$/i);
      if (colMatch) {
        const colName = colMatch[1];
        let colType = colMatch[2].replace(/\s+/g, '').replace(/,/g, '_');
        const rest = colMatch[3] || '';

        // Simplify data types for Mermaid ER compliance
        colType = colType.replace(/\(.*\)/, ''); // Mermaid ER doesn't like parentheses in types

        let key = '';
        if (/PRIMARY\s+KEY/i.test(rest)) key = 'PK';
        else if (/REFERENCES\s+(\w+)/i.test(rest)) {
          key = 'FK';
          const inlineRef = rest.match(/REFERENCES\s+([a-zA-Z0-9_]+)/i);
          if (inlineRef) {
            relations.push({ from: inlineRef[1].toLowerCase(), to: tableName, label: colName });
          }
        }

        tables[tableName].columns.push({ name: colName, type: colType, key });
      }
    }
  }

  const output = ['erDiagram'];

  // Output table schemas
  for (const [tName, data] of Object.entries(tables)) {
    output.push(`  ${tName.toUpperCase()} {`);
    if (data.columns.length === 0) {
      output.push('    string id PK');
    } else {
      data.columns.forEach(c => {
        const keySuffix = c.key ? ` ${c.key}` : '';
        output.push(`    ${c.type} ${c.name}${keySuffix}`);
      });
    }
    output.push('  }');
  }

  // Output relations
  relations.forEach(r => {
    output.push(`  ${r.from.toUpperCase()} ||--o{ ${r.to.toUpperCase()} : "${r.label}"`);
  });

  return output.join('\n') + '\n';
}
