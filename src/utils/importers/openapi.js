/**
 * OpenAPI / Swagger JSON Specification to Mermaid Diagram Converter
 * Converts API paths, methods, and responses into a clean Mermaid sequence diagram.
 */

export function parseOpenApiToMermaid(specText) {
  if (!specText || typeof specText !== 'string') {
    throw new Error('Please provide OpenAPI JSON or YAML text to convert.');
  }

  let spec;
  try {
    spec = JSON.parse(specText);
  } catch (err) {
    throw new Error(`OpenAPI parser expects JSON: ${err.message}`);
  }

  const title = spec.info?.title || 'API Architecture';
  const paths = spec.paths || {};

  const output = ['sequenceDiagram'];
  output.push('  autonumber');
  output.push('  actor Client as "User / Client"');
  output.push('  participant Gateway as "API Gateway"');
  output.push('  participant Service as "Microservice Engine"');

  const pathEntries = Object.entries(paths).slice(0, 10); // Take first 10 endpoints for clean diagram
  if (pathEntries.length === 0) {
    throw new Error('No paths found in OpenAPI specification.');
  }

  pathEntries.forEach(([pathUrl, methods]) => {
    Object.entries(methods).forEach(([method, def]) => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        const upperMethod = method.toUpperCase();
        const summary = def.summary || def.operationId || `${upperMethod} ${pathUrl}`;
        const cleanSummary = summary.replace(/"/g, "'").slice(0, 40);

        output.push(`  Client->>Gateway: ${upperMethod} ${pathUrl}`);
        output.push(`  Gateway->>Service: Forward (${cleanSummary})`);

        // Responses
        const responses = def.responses || {};
        const successCode = Object.keys(responses).find(c => c.startsWith('2')) || '200';
        const responseDesc = (responses[successCode]?.description || 'OK').replace(/"/g, "'").slice(0, 30);

        output.push(`  Service-->>Gateway: ${successCode} ${responseDesc}`);
        output.push(`  Gateway-->>Client: HTTP ${successCode} Response`);
      }
    });
  });

  return output.join('\n') + '\n';
}
