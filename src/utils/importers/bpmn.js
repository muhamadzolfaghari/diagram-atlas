/**
 * BPMN 2.0 XML to Mermaid Flowchart Converter
 * Parses Camunda / Signavio / BPMN 2.0 XML definitions into clean Mermaid flowcharts.
 */

export function parseBpmnToMermaid(bpmnXmlText) {
  if (!bpmnXmlText || typeof bpmnXmlText !== 'string') {
    throw new Error('Please provide BPMN 2.0 XML text to convert.');
  }

  // Regex-based extraction for resilient parsing in both Node and Browser without DOM dependencies
  const output = ['flowchart TD'];

  // Safe node ID sanitize
  const cleanId = id => 'bpmn_' + (id || 'node').replace(/[^a-zA-Z0-9_]/g, '_');

  const nodes = new Map();
  const edges = [];

  // Match all BPMN elements: startEvent, endEvent, task, userTask, serviceTask, exclusiveGateway, parallelGateway, etc.
  // Handles namespaced (bpmn:task, bpmn2:task) and plain (<task>) tags
  const elementRegex = /<([a-zA-Z0-9]+:)?(startEvent|endEvent|task|userTask|serviceTask|scriptTask|sendTask|receiveTask|businessRuleTask|exclusiveGateway|parallelGateway|inclusiveGateway)\b([^>]*)(?:\/?>|>([\s\S]*?)<\/\1?\2>)/gi;

  let match;
  while ((match = elementRegex.exec(bpmnXmlText)) !== null) {
    const rawTag = match[2];
    const attrs = match[3];
    const innerContent = match[4] || '';

    // Extract id and name attributes
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);

    if (!idMatch) continue;

    const rawId = idMatch[1];
    const safeId = cleanId(rawId);
    let label = nameMatch ? nameMatch[1] : '';

    // If no name attribute, try looking for an inner <name> tag or default to tag name
    if (!label) {
      const innerName = innerContent.match(/<([a-zA-Z0-9]+:)?name\b[^>]*>([^<]+)<\/\1?name>/i);
      label = innerName ? innerName[2].trim() : rawTag.replace(/([A-Z])/g, ' $1').trim();
    }

    const cleanLabel = label.replace(/["\n\r]/g, ' ').trim();

    // Map BPMN shape styles to Mermaid nodes
    let nodeSyntax = '';
    const lowerTag = rawTag.toLowerCase();

    if (lowerTag.includes('startevent')) {
      nodeSyntax = `${safeId}(["${cleanLabel || 'Start'}"])`;
    } else if (lowerTag.includes('endevent')) {
      nodeSyntax = `${safeId}(["${cleanLabel || 'End'}"])`;
    } else if (lowerTag.includes('gateway')) {
      nodeSyntax = `${safeId}{"🔷 ${cleanLabel || 'Decision'}"}`;
    } else if (lowerTag.includes('usertask')) {
      nodeSyntax = `${safeId}["👤 ${cleanLabel}"]`;
    } else if (lowerTag.includes('servicetask')) {
      nodeSyntax = `${safeId}["⚙️ ${cleanLabel}"]`;
    } else {
      nodeSyntax = `${safeId}["📋 ${cleanLabel}"]`;
    }

    nodes.set(safeId, nodeSyntax);
  }

  // Match sequence flows
  const flowRegex = /<([a-zA-Z0-9]+:)?sequenceFlow\b([^>]*)/gi;
  while ((match = flowRegex.exec(bpmnXmlText)) !== null) {
    const attrs = match[2];
    const sourceMatch = attrs.match(/\bsourceRef=["']([^"']+)["']/i);
    const targetMatch = attrs.match(/\btargetRef=["']([^"']+)["']/i);
    const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);

    if (sourceMatch && targetMatch) {
      const sourceId = cleanId(sourceMatch[1]);
      const targetId = cleanId(targetMatch[1]);
      const flowName = nameMatch ? nameMatch[1].replace(/["\n\r]/g, ' ').trim() : '';

      if (flowName) {
        edges.push(`  ${sourceId} -->|"${flowName}"| ${targetId}`);
      } else {
        edges.push(`  ${sourceId} --> ${targetId}`);
      }
    }
  }

  if (nodes.size === 0 && edges.length === 0) {
    throw new Error('No BPMN 2.0 events, tasks, or sequence flows found in XML text.');
  }

  // Output nodes
  for (const nodeLine of nodes.values()) {
    output.push(`  ${nodeLine}`);
  }

  // Output edges
  for (const edgeLine of edges) {
    output.push(edgeLine);
  }

  return output.join('\n');
}
