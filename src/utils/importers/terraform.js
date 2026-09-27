/**
 * Terraform HCL (.tf) to Mermaid Cloud Architecture Converter
 * Extracts resource blocks, module definitions, and dependency references
 * into clean Mermaid architecture flowcharts.
 */

export function parseTerraformToMermaid(tfText) {
  if (!tfText || typeof tfText !== 'string') {
    throw new Error('Please provide Terraform HCL text to convert.');
  }

  // Strip comments (# ... and // ...)
  const cleanText = tfText
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(#|\/\/).*$/gm, '');

  const output = ['flowchart LR'];
  const nodes = new Map();
  const edges = [];

  // Match resource "type" "name" { ... }
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*)\}/gi;
  let match;
  let count = 0;

  const cleanId = s => (s || 'res').replace(/[^a-zA-Z0-9_]/g, '_');

  while ((match = resourceRegex.exec(cleanText)) !== null) {
    const resType = match[1];
    const resName = match[2];
    const body = match[3];

    const fullKey = `${resType}.${resName}`;
    const safeId = cleanId(fullKey);

    // Pick cloud icon based on resource type prefix
    let icon = '📦';
    const lowerType = resType.toLowerCase();
    if (lowerType.includes('vpc') || lowerType.includes('network') || lowerType.includes('subnet')) {
      icon = '🌐';
    } else if (lowerType.includes('instance') || lowerType.includes('compute') || lowerType.includes('server') || lowerType.includes('ecs') || lowerType.includes('k8s')) {
      icon = '💻';
    } else if (lowerType.includes('db') || lowerType.includes('rds') || lowerType.includes('database') || lowerType.includes('sql') || lowerType.includes('dynamo')) {
      icon = '🗄️';
    } else if (lowerType.includes('s3') || lowerType.includes('bucket') || lowerType.includes('storage')) {
      icon = '🪣';
    } else if (lowerType.includes('lb') || lowerType.includes('gateway') || lowerType.includes('ingress')) {
      icon = '🚪';
    } else if (lowerType.includes('security') || lowerType.includes('iam') || lowerType.includes('role') || lowerType.includes('policy')) {
      icon = '🛡️';
    }

    const shortType = resType.replace(/^(aws_|azurerm_|google_)/, '');
    nodes.set(fullKey, `${safeId}["${icon} ${shortType}<br/><b>${resName}</b>"]`);
    count++;

    // Find references to other resources in the body (e.g., aws_vpc.main.id)
    const refRegex = /\b([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\b/g;
    let refMatch;
    while ((refMatch = refRegex.exec(body)) !== null) {
      const targetType = refMatch[1];
      const targetName = refMatch[2];
      const targetKey = `${targetType}.${targetName}`;

      if (targetKey !== fullKey && (targetType.startsWith('aws_') || targetType.startsWith('azurerm_') || targetType.startsWith('google_') || targetType.startsWith('module'))) {
        edges.push({ from: fullKey, to: targetKey });
      }
    }
  }

  // Also match module "name" { source = "..." }
  const moduleRegex = /module\s+"([^"]+)"\s*\{([^}]*)\}/gi;
  while ((match = moduleRegex.exec(cleanText)) !== null) {
    const modName = match[1];
    const fullKey = `module.${modName}`;
    const safeId = cleanId(fullKey);

    nodes.set(fullKey, `${safeId}["🧩 Module<br/><b>${modName}</b>"]`);
    count++;
  }

  if (count === 0) {
    throw new Error('No Terraform resource or module blocks found in text.');
  }

  // Emit nodes
  for (const nodeLine of nodes.values()) {
    output.push(`  ${nodeLine}`);
  }

  // Emit edges
  const seenEdges = new Set();
  for (const edge of edges) {
    if (nodes.has(edge.to) && nodes.has(edge.from)) {
      const fromId = cleanId(edge.from);
      const toId = cleanId(edge.to);
      const edgeKey = `${fromId}->${toId}`;
      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey);
        output.push(`  ${fromId} -.->|depends_on| ${toId}`);
      }
    }
  }

  return output.join('\n');
}
