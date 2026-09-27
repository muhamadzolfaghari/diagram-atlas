/**
 * CSV / Tabular Data to Mermaid Converter
 * Supports Flowchart (From, To, Label) and ER Diagram tables.
 */

export function parseCsvToMermaid(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('Please provide CSV data to convert.');
  }

  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  if (lines.length < 2) {
    throw new Error('CSV requires at least a header row and one data row.');
  }

  // Detect delimiter: comma, semicolon, tab
  const headerLine = lines[0];
  let delimiter = ',';
  if (headerLine.includes('\t')) delimiter = '\t';
  else if (headerLine.includes(';')) delimiter = ';';

  const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => line.split(delimiter).map(cell => cell.trim()));

  // 1. Check if ER Diagram format (Entity / Table / Column / Type)
  if (headers.some(h => h.includes('table') || h.includes('entity')) &&
      headers.some(h => h.includes('col') || h.includes('field') || h.includes('prop'))) {
    return generateErFromCsv(headers, rows);
  }

  // 2. Default to Graph / Flowchart (From, To, [Label/Action])
  return generateFlowchartFromCsv(headers, rows);
}

function generateFlowchartFromCsv(headers, rows) {
  const output = ['flowchart LR'];

  rows.forEach(cols => {
    if (cols.length < 2) return;
    const from = cols[0].replace(/[^\w\d_-]/g, '_') || 'A';
    const to = cols[1].replace(/[^\w\d_-]/g, '_') || 'B';
    const label = cols[2] ? cols[2].replace(/"/g, "'") : '';

    const fromLabel = cols[0].replace(/"/g, "'");
    const toLabel = cols[1].replace(/"/g, "'");

    if (label) {
      output.push(`  ${from}["${fromLabel}"] -->|"${label}"| ${to}["${toLabel}"]`);
    } else {
      output.push(`  ${from}["${fromLabel}"] --> ${to}["${toLabel}"]`);
    }
  });

  return output.join('\n') + '\n';
}

function generateErFromCsv(headers, rows) {
  const tableIdx = headers.findIndex(h => h.includes('table') || h.includes('entity'));
  const colIdx = headers.findIndex(h => h.includes('col') || h.includes('field') || h.includes('prop'));
  const typeIdx = headers.findIndex(h => h.includes('type'));
  const keyIdx = headers.findIndex(h => h.includes('key') || h.includes('constraint'));

  const tables = {}; // { tableName: [ { col, type, key } ] }

  rows.forEach(cols => {
    const tableName = (cols[tableIdx] || 'ENTITY').replace(/[^\w\d_]/g, '_').toUpperCase();
    const colName = (cols[colIdx] || 'id').replace(/[^\w\d_]/g, '_');
    const colType = (typeIdx !== -1 && cols[typeIdx]) ? cols[typeIdx].replace(/[^\w\d_]/g, '_') : 'string';
    const key = (keyIdx !== -1 && cols[keyIdx]) ? cols[keyIdx].toUpperCase() : '';

    if (!tables[tableName]) tables[tableName] = [];
    tables[tableName].push({ colName, colType, key });
  });

  const output = ['erDiagram'];
  for (const [tableName, fields] of Object.entries(tables)) {
    output.push(`  ${tableName} {`);
    fields.forEach(f => {
      const keySuffix = f.key ? ` ${f.key}` : '';
      output.push(`    ${f.colType} ${f.colName}${keySuffix}`);
    });
    output.push('  }');
  }

  return output.join('\n') + '\n';
}
