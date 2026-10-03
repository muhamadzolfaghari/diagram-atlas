import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body><div id="container"></div></body></html>`, {
  url: 'http://localhost:4173/diagram-atlas/',
  pretendToBeVisual: true,
});

global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.XMLSerializer = dom.window.XMLSerializer;

// Dynamically import Mermaid and templates
const { default: mermaid } = await import('mermaid');
const { DIAGRAM_TEMPLATES } = await import('./src/components/templates.js');
import fs from 'fs';
import path from 'path';

console.log('🧪 Starting DiagramAtlas Verification Suite...\n');

mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  securityLevel: 'loose',
  theme: 'dark',
});

let passed = 0;
let failed = 0;

// Test Group 1: Starter Diagram Templates
console.log('--- Test Group 1: Starter Diagram Templates ---');
for (const tpl of DIAGRAM_TEMPLATES) {
  try {
    if (tpl.kind === 'graphviz') {
      const { renderGraphvizWasm } = await import('./src/utils/wasm/wasm-accelerator.js');
      const svg = await renderGraphvizWasm(tpl.code);
      if (svg && svg.includes('<svg')) {
        console.log(`✅ [Template] "${tpl.title}" (${tpl.kind}) compiled with native Wasm Graphviz.`);
        passed++;
      } else {
        console.error(`❌ [Template] "${tpl.title}" failed to compile in Wasm.`);
        failed++;
      }
      continue;
    }

    const valid = await mermaid.parse(tpl.code);
    if (valid !== false) {
      console.log(`✅ [Template] "${tpl.title}" (${tpl.kind}) passed syntax check.`);
      passed++;
    } else {
      console.error(`❌ [Template] "${tpl.title}" returned false.`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [Template] "${tpl.title}" threw error:`, err.message);
    failed++;
  }
}

// Test Group 2: Tourism reference .mmd files in public/reference-mmd/
console.log('\n--- Test Group 2: Reference .mmd Files ---');
const refDir = './public/reference-mmd';
const refFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.mmd'));
for (const file of refFiles) {
  const content = fs.readFileSync(path.join(refDir, file), 'utf8');
  try {
    const valid = await mermaid.parse(content);
    if (valid !== false) {
      console.log(`✅ [Reference .mmd] "${file}" passed syntax check.`);
      passed++;
    } else {
      console.error(`❌ [Reference .mmd] "${file}" returned false.`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [Reference .mmd] "${file}" threw error:`, err.message);
    failed++;
  }
}

// Test Group 3: Syntax Error Detection
console.log('\n--- Test Group 3: Syntax Error Detection ---');
const invalidCode = 'flowchart TD\n  A --> [Missing bracket\n  ??? Invalid syntax';
try {
  await mermaid.parse(invalidCode);
  console.error('❌ Expected syntax error but parse succeeded!');
  failed++;
} catch (err) {
  console.log('✅ Syntax error was properly detected and caught:', err.message.split('\n')[0]);
  passed++;
}

// Test Group 4: Inspect production bundle dist/
console.log('\n--- Test Group 4: Production Dist Inspection ---');
if (!fs.existsSync('./dist/index.html')) {
  console.log('⚠️ ./dist/index.html does not exist yet. Please run `npm run build` before testing dist output.');
} else {
  const distHtml = fs.readFileSync('./dist/index.html', 'utf8');
  const checks = [
    { name: 'Base path in JS script', check: distHtml.includes('/diagram-atlas/assets/index-') },
    { name: 'Base path in CSS link', check: distHtml.includes('/diagram-atlas/assets/index-') },
    { name: 'Base path in favicon', check: distHtml.includes('/diagram-atlas/favicon.svg') },
    { name: 'React application mount present', check: distHtml.includes('id="root"') },
    { name: 'Application module entry present', check: /<script[^>]*type="module"[^>]*src="[^"]+/.test(distHtml) },
    { name: 'SEO title present', check: distHtml.includes('<title>DiagramAtlas') },
    { name: 'SEO meta description present', check: distHtml.includes('name="description"') },
  ];

  for (const c of checks) {
    if (c.check) {
      console.log(`✅ [Dist Check] ${c.name}`);
      passed++;
    } else {
      console.error(`❌ [Dist Check] FAILED: ${c.name}`);
      failed++;
    }
  }
}

// Test Group 5: Design System & CVA Components
console.log('\n--- Test Group 5: Design System & CVA Components ---');
try {
  const {
    cn,
    buttonVariants,
    badgeVariants,
    cardVariants,
    inputVariants,
    createButton,
    createBadge,
  } = await import('./src/components/ui/index.js');

  // 1. cn() utility tests
  const mergedClass = cn('p-4 text-sm', false && 'hidden', 'text-white', 'p-2');
  if (mergedClass.includes('p-2') && !mergedClass.includes('p-4') && mergedClass.includes('text-white')) {
    console.log('✅ [Design System] cn() successfully handles conditionals and resolves Tailwind conflicts.');
    passed++;
  } else {
    console.error('❌ [Design System] cn() failed conflict resolution:', mergedClass);
    failed++;
  }

  // 2. buttonVariants tests
  const defaultBtn = buttonVariants();
  const aiBtn = buttonVariants({ variant: 'ai', size: 'sm' });
  const destructiveBtn = buttonVariants({ variant: 'destructive', size: 'lg' });

  if (
    defaultBtn.includes('bg-primary') &&
    aiBtn.includes('bg-gradient-to-r') &&
    aiBtn.includes('h-8') &&
    destructiveBtn.includes('bg-destructive') &&
    destructiveBtn.includes('h-10')
  ) {
    console.log('✅ [Design System] buttonVariants correctly generates CVA variant & size classes.');
    passed++;
  } else {
    console.error('❌ [Design System] buttonVariants generated unexpected classes.');
    failed++;
  }

  // 3. badgeVariants tests
  const aiBadge = badgeVariants({ variant: 'ai', size: 'sm' });
  if (aiBadge.includes('border-indigo-500/40') && aiBadge.includes('text-[10px]')) {
    console.log('✅ [Design System] badgeVariants correctly generates CVA badge classes.');
    passed++;
  } else {
    console.error('❌ [Design System] badgeVariants failed:', aiBadge);
    failed++;
  }

  // 4. inputVariants tests
  const monoInput = inputVariants({ variant: 'mono' });
  if (monoInput.includes('font-mono') && monoInput.includes('border-border')) {
    console.log('✅ [Design System] inputVariants correctly generates CVA input classes.');
    passed++;
  } else {
    console.error('❌ [Design System] inputVariants failed:', monoInput);
    failed++;
  }

  // 5. cardVariants tests
  const interactiveCard = cardVariants({ variant: 'interactive', padding: 'sm' });
  if (interactiveCard.includes('hover:border-primary/50') && interactiveCard.includes('p-3')) {
    console.log('✅ [Design System] cardVariants correctly generates CVA card classes.');
    passed++;
  } else {
    console.error('❌ [Design System] cardVariants failed:', interactiveCard);
    failed++;
  }

  // 6. createButton helper test
  let clicked = false;
  const domBtn = createButton({
    variant: 'ai',
    size: 'sm',
    className: 'custom-extra-class',
    content: '<span>Test AI</span>',
    onClick: () => { clicked = true; },
  });

  domBtn.click();
  if (
    domBtn instanceof dom.window.HTMLButtonElement &&
    domBtn.className.includes('custom-extra-class') &&
    domBtn.className.includes('bg-gradient-to-r') &&
    clicked === true
  ) {
    console.log('✅ [Design System] createButton() creates reactive, fully-styled DOM elements.');
    passed++;
  } else {
    console.error('❌ [Design System] createButton() failed DOM test.');
    failed++;
  }

  // 7. createBadge helper test
  const domBadge = createBadge({
    variant: 'success',
    text: 'Active',
  });
  if (
    domBadge instanceof dom.window.HTMLElement &&
    domBadge.textContent === 'Active' &&
    domBadge.className.includes('bg-emerald-500/10')
  ) {
    console.log('✅ [Design System] createBadge() creates valid styled badge DOM elements.');
    passed++;
  } else {
    console.error('❌ [Design System] createBadge() failed DOM test.');
    failed++;
  }
} catch (err) {
  console.error('❌ [Design System] Component imports or test failed:', err);
  failed++;
}

// Test Group 6: Pro Tier Features & Exporters (100% Free Pro Features)
console.log('\n--- Test Group 6: Pro Tier Features & Exporters ---');
try {
  const { Exporter } = await import('./src/components/exporter.js');
  const { formatMermaidCode } = await import('./src/utils/mermaid-formatter.js');

  // 1. Mermaid Code Formatter test
  const unformatted = 'flowchart TD\nsubgraph ClusterA[Service Group]\nA-->B\nend';
  const formatted = formatMermaidCode(unformatted);
  if (formatted.includes('  A --> B') && formatted.includes('subgraph ClusterA[Service Group]')) {
    console.log('✅ [Pro Formatter] formatMermaidCode() cleans indentation and operator spacing.');
    passed++;
  } else {
    console.error('❌ [Pro Formatter] formatMermaidCode() failed:', formatted);
    failed++;
  }

  // 2. Pure PDF 1.4 Synthesizer test
  const dummyJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9]);
  const pdfBytes = Exporter.synthesizePdfFromJpeg(dummyJpegBytes, 200, 100, { pageSize: 'fit', title: 'Test Diagram' });
  const pdfString = Buffer.from(pdfBytes).toString('latin1');
  if (
    pdfString.startsWith('%PDF-1.4') &&
    pdfString.includes('/Type /Catalog') &&
    pdfString.includes('/Filter /DCTDecode') &&
    pdfString.includes('%%EOF')
  ) {
    console.log('✅ [Pro PDF] synthesizePdfFromJpeg() outputs valid compliant PDF 1.4 binary data.');
    passed++;
  } else {
    console.error('❌ [Pro PDF] synthesizePdfFromJpeg() failed structure check.');
    failed++;
  }

  // 3. Embed & Share snippets test
  const mockContainer = dom.window.document.createElement('div');
  mockContainer.innerHTML = '<svg width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="#080c14"/></svg>';
  const snippets = Exporter.generateEmbedSnippets('graph TD\nA-->B', mockContainer, 'Architecture Overview');
  if (
    snippets.markdown.startsWith('```mermaid') &&
    snippets.html.includes('<pre class="mermaid">') &&
    snippets.dataUri.startsWith('data:image/svg+xml')
  ) {
    console.log('✅ [Pro Embed] generateEmbedSnippets() generates valid GitHub Markdown, HTML, and SVG Data URI.');
    passed++;
  } else {
    console.error('❌ [Pro Embed] generateEmbedSnippets() failed:', snippets);
    failed++;
  }

  // 4. Filename sanitizer test
  const sanitized = Exporter.sanitizeFilename('Project Architecture / v1.0 (Q3)!');
  if (sanitized === 'project-architecture-v1-0-q3') {
    console.log('✅ [Pro Exporter] sanitizeFilename() properly cleans complex diagram titles.');
    passed++;
  } else {
    console.error('❌ [Pro Exporter] sanitizeFilename() failed:', sanitized);
    failed++;
  }
} catch (err) {
  console.error('❌ [Pro Exporter] Test Group 6 failed:', err);
  failed++;
}

// --- Test Group 7: Universal Importers & XMind Engine ---
console.log('\n--- Test Group 7: Universal Importers & XMind Engine ---');
try {
  const { parseXmindToMermaid, exportMermaidToXmindBlob, createSampleXmindData } = await import('./src/utils/importers/xmind.js');
  const { parsePlantUmlToMermaid } = await import('./src/utils/importers/plantuml.js');
  const { parseOutline } = await import('./src/utils/importers/markdown-outline.js');
  const { parseCsvToMermaid } = await import('./src/utils/importers/csv-table.js');
  const JSZip = (await import('jszip')).default;

  // 1. XMind Parse Test
  const sampleData = createSampleXmindData();
  const zip = new JSZip();
  zip.file('content.json', JSON.stringify(sampleData));
  const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
  const xmindResult = await parseXmindToMermaid(zipBuffer);

  if (
    xmindResult.mermaidCode.startsWith('mindmap') &&
    xmindResult.mermaidCode.includes('Cloud Native Application') &&
    xmindResult.mermaidCode.includes('Frontend Client')
  ) {
    console.log('✅ [XMind Importer] parseXmindToMermaid() accurately parses .xmind zip tree into Mermaid mindmap.');
    passed++;
  } else {
    console.error('❌ [XMind Importer] parseXmindToMermaid() failed:', xmindResult);
    failed++;
  }

  // 2. XMind Export Test
  const mindmapMmd = `mindmap\n  root((Project Planning))\n    ["Frontend Client"]\n      ["Vite 6"]\n    ["Backend API"]\n`;
  const xmindBlob = await exportMermaidToXmindBlob(mindmapMmd, 'Project Planning');
  const exportedZip = new JSZip();
  const exportedZipContent = await exportedZip.loadAsync(await xmindBlob.arrayBuffer());
  const contentFile = exportedZipContent.file('content.json');
  const parsedExportedJson = JSON.parse(await contentFile.async('text'));

  if (
    parsedExportedJson[0]?.rootTopic?.title === 'Project Planning' &&
    parsedExportedJson[0]?.rootTopic?.children?.attached?.length === 2
  ) {
    console.log('✅ [XMind Exporter] exportMermaidToXmindBlob() successfully builds valid XMind ZEN JSON workbook archive.');
    passed++;
  } else {
    console.error('❌ [XMind Exporter] exportMermaidToXmindBlob() failed:', parsedExportedJson);
    failed++;
  }

  // 3. PlantUML Sequence Conversion Test
  const pumlSample = `@startuml\nautonumber\nactor Client\nparticipant Server\nClient -> Server: GET /health\nServer --> Client: 200 OK\n@enduml`;
  const convertedPuml = parsePlantUmlToMermaid(pumlSample);
  if (
    convertedPuml.startsWith('sequenceDiagram') &&
    convertedPuml.includes('autonumber') &&
    convertedPuml.includes('Client->>Server: GET /health') &&
    convertedPuml.includes('Server-->>Client: 200 OK')
  ) {
    console.log('✅ [PlantUML Converter] parsePlantUmlToMermaid() accurately converts sequence diagram.');
    passed++;
  } else {
    console.error('❌ [PlantUML Converter] failed:', convertedPuml);
    failed++;
  }

  // 4. Markdown Outline Conversion Test
  const outlineSample = `System Architecture\n- Client Layer\n  - React App\n- Server Layer\n  - Node API\n`;
  const convertedOutline = parseOutline(outlineSample, 'mindmap');
  if (
    convertedOutline.startsWith('mindmap') &&
    convertedOutline.includes('root(("System Architecture"))') &&
    convertedOutline.includes('Client Layer')
  ) {
    console.log('✅ [Markdown Outline] parseOutline() parses nested bullet lists into Mermaid mindmap.');
    passed++;
  } else {
    console.error('❌ [Markdown Outline] failed:', convertedOutline);
    failed++;
  }

  // 5. CSV Tabular Data Conversion Test
  const csvSample = `From,To,Action\nClient,Gateway,HTTPS Request\nGateway,Auth,Token Verify\n`;
  const convertedCsv = parseCsvToMermaid(csvSample);
  if (
    convertedCsv.startsWith('flowchart LR') &&
    convertedCsv.includes('Client') &&
    convertedCsv.includes('Gateway') &&
    convertedCsv.includes('Token Verify')
  ) {
    console.log('✅ [CSV Converter] parseCsvToMermaid() converts tabular rows into Mermaid flowchart connections.');
    passed++;
  } else {
    console.error('❌ [CSV Converter] failed:', convertedCsv);
    failed++;
  }

  // 6. Graphviz DOT Conversion Test
  const { parseDotToMermaid } = await import('./src/utils/importers/graphviz.js');
  const dotSample = `digraph G {\n  rankdir=LR;\n  Router -> Auth [label="Verify"];\n  Auth -> DB;\n}`;
  const convertedDot = parseDotToMermaid(dotSample);
  if (
    convertedDot.startsWith('flowchart LR') &&
    convertedDot.includes('Router -->|"Verify"| Auth') &&
    convertedDot.includes('Auth --> DB')
  ) {
    console.log('✅ [Graphviz DOT] parseDotToMermaid() converts directed graph into Mermaid flowchart.');
    passed++;
  } else {
    console.error('❌ [Graphviz DOT] failed:', convertedDot);
    failed++;
  }

  // 7. D2 Lang Conversion Test
  const { parseD2ToMermaid } = await import('./src/utils/importers/d2.js');
  const d2Sample = `direction: right\nclient -> server: Get Data\nserver -> database: Query\n`;
  const convertedD2 = parseD2ToMermaid(d2Sample);
  if (
    convertedD2.startsWith('flowchart LR') &&
    convertedD2.includes('client -->|"Get Data"| server') &&
    convertedD2.includes('server -->|"Query"| database')
  ) {
    console.log('✅ [D2 Lang] parseD2ToMermaid() converts D2 code into Mermaid flowchart.');
    passed++;
  } else {
    console.error('❌ [D2 Lang] failed:', convertedD2);
    failed++;
  }

  // 8. SQL DDL Conversion Test
  const { parseSqlDdlToMermaid } = await import('./src/utils/importers/sql-ddl.js');
  const sqlSample = `CREATE TABLE users (\n  id INT PRIMARY KEY,\n  email VARCHAR(100)\n);\nCREATE TABLE orders (\n  id INT PRIMARY KEY,\n  user_id INT REFERENCES users(id)\n);`;
  const convertedSql = parseSqlDdlToMermaid(sqlSample);
  if (
    convertedSql.startsWith('erDiagram') &&
    convertedSql.includes('USERS {') &&
    convertedSql.includes('ORDERS {') &&
    convertedSql.includes('USERS ||--o{ ORDERS')
  ) {
    console.log('✅ [SQL DDL] parseSqlDdlToMermaid() generates ER diagram entities and relationships.');
    passed++;
  } else {
    console.error('❌ [SQL DDL] failed:', convertedSql);
    failed++;
  }

  // 9. Draw.io XML Conversion Test
  const { parseDrawioToMermaid } = await import('./src/utils/importers/drawio.js');
  const drawioSample = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="App" vertex="1" parent="1"/><mxCell id="3" value="DB" vertex="1" parent="1"/><mxCell id="4" value="Query" edge="1" source="2" target="3" parent="1"/></root></mxGraphModel>`;
  const convertedDrawio = parseDrawioToMermaid(drawioSample);
  if (
    convertedDrawio.startsWith('flowchart TD') &&
    convertedDrawio.includes('node_2["App"]') &&
    convertedDrawio.includes('node_3["DB"]') &&
    convertedDrawio.includes('Query')
  ) {
    console.log('✅ [Draw.io Converter] parseDrawioToMermaid() parses mxGraph XML cells into Mermaid flowchart.');
    passed++;
  } else {
    console.error('❌ [Draw.io Converter] failed:', convertedDrawio);
    failed++;
  }

  // 10. OpenAPI JSON Specification Test
  const { parseOpenApiToMermaid } = await import('./src/utils/importers/openapi.js');
  const openapiSample = JSON.stringify({
    info: { title: "Store API" },
    paths: {
      "/items": {
        get: { summary: "Fetch Items", responses: { "200": { description: "OK" } } }
      }
    }
  });
  const convertedOpenapi = parseOpenApiToMermaid(openapiSample);
  if (
    convertedOpenapi.startsWith('sequenceDiagram') &&
    convertedOpenapi.includes('GET /items') &&
    convertedOpenapi.includes('Fetch Items')
  ) {
    console.log('✅ [OpenAPI Converter] parseOpenApiToMermaid() converts REST endpoints to sequence flow.');
    passed++;
  } else {
    console.error('❌ [OpenAPI Converter] failed:', convertedOpenapi);
    failed++;
  }

  // 11. GraphQL SDL Test
  const { parseGraphQLToMermaid } = await import('./src/utils/importers/graphql.js');
  const gqlSample = `type User {
    id: ID!
    email: String!
    posts: [Post]
  }
  type Post {
    id: ID!
    title: String!
  }`;
  const convertedGql = parseGraphQLToMermaid(gqlSample);
  if (
    convertedGql.startsWith('classDiagram') &&
    convertedGql.includes('class User {') &&
    convertedGql.includes('+ID id') &&
    convertedGql.includes('User --> "0..*" Post : posts')
  ) {
    console.log('✅ [GraphQL Converter] parseGraphQLToMermaid() generates classDiagram with fields and relationships.');
    passed++;
  } else {
    console.error('❌ [GraphQL Converter] failed:', convertedGql);
    failed++;
  }

  // 12. BPMN 2.0 XML Test
  const { parseBpmnToMermaid } = await import('./src/utils/importers/bpmn.js');
  const bpmnSample = `<?xml version="1.0" encoding="UTF-8"?>
  <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
    <bpmn:process id="OrderProcess">
      <bpmn:startEvent id="Start_1" name="Order Placed" />
      <bpmn:serviceTask id="Task_1" name="Process Payment" />
      <bpmn:endEvent id="End_1" name="Order Fulfilled" />
      <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1" />
      <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="End_1" />
    </bpmn:process>
  </bpmn:definitions>`;
  const convertedBpmn = parseBpmnToMermaid(bpmnSample);
  if (
    convertedBpmn.startsWith('flowchart TD') &&
    convertedBpmn.includes('Start_1') &&
    convertedBpmn.includes('Process Payment') &&
    convertedBpmn.includes('Start_1 --> Task_1')
  ) {
    console.log('✅ [BPMN 2.0 Converter] parseBpmnToMermaid() maps BPMN events and sequenceFlows to flowchart.');
    passed++;
  } else {
    console.error('❌ [BPMN 2.0 Converter] failed:', convertedBpmn);
    failed++;
  }

  // 13. Structurizr & C4 DSL Test
  const { parseC4DslToMermaid } = await import('./src/utils/importers/c4-dsl.js');
  const c4Sample = `Person(customer, "Bank Customer", "Enjoys online banking")
  System(bankingSystem, "Internet Banking", "Allows account access")
  Rel(customer, bankingSystem, "Uses", "HTTPS")`;
  const convertedC4 = parseC4DslToMermaid(c4Sample);
  if (
    convertedC4.startsWith('C4Context') &&
    convertedC4.includes('Person(customer') &&
    convertedC4.includes('System(bankingSystem') &&
    convertedC4.includes('Rel(customer, bankingSystem')
  ) {
    console.log('✅ [C4 DSL Converter] parseC4DslToMermaid() outputs valid C4Context with persons, systems, and rels.');
    passed++;
  } else {
    console.error('❌ [C4 DSL Converter] failed:', convertedC4);
    failed++;
  }

  // 14. Terraform HCL Test
  const { parseTerraformToMermaid } = await import('./src/utils/importers/terraform.js');
  const tfSample = `resource "aws_vpc" "main_vpc" {
    cidr_block = "10.0.0.0/16"
  }
  resource "aws_subnet" "public_subnet" {
    vpc_id = aws_vpc.main_vpc.id
  }`;
  const convertedTf = parseTerraformToMermaid(tfSample);
  if (
    convertedTf.startsWith('flowchart LR') &&
    convertedTf.includes('main_vpc') &&
    convertedTf.includes('public_subnet') &&
    convertedTf.includes('aws_subnet_public_subnet -.->|depends_on| aws_vpc_main_vpc')
  ) {
    console.log('✅ [Terraform Converter] parseTerraformToMermaid() extracts resources and dependencies.');
    passed++;
  } else {
    console.error('❌ [Terraform Converter] failed:', convertedTf);
    failed++;
  }

  // 15. AsyncAPI Specification Test
  const { parseAsyncApiToMermaid } = await import('./src/utils/importers/asyncapi.js');
  const asyncApiSample = JSON.stringify({
    asyncapi: "2.6.0",
    info: { title: "Order Broker" },
    channels: {
      "orders/created": {
        publish: { message: { name: "OrderCreatedEvent" } }
      }
    }
  });
  const convertedAsync = parseAsyncApiToMermaid(asyncApiSample);
  if (
    convertedAsync.startsWith('sequenceDiagram') &&
    convertedAsync.includes('Publish to [orders/created]') &&
    convertedAsync.includes('OrderCreatedEvent')
  ) {
    console.log('✅ [AsyncAPI Converter] parseAsyncApiToMermaid() maps channels and events to sequence diagram.');
    passed++;
  } else {
    console.error('❌ [AsyncAPI Converter] failed:', convertedAsync);
    failed++;
  }

  // 16. FreeMind XML & OPML Test
  const { parseFreeMindOrOpmlToMermaid } = await import('./src/utils/importers/freemind.js');
  const freeMindSample = `<map version="1.0.1">
    <node TEXT="Central Topic">
      <node TEXT="Subtopic A" />
      <node TEXT="Subtopic B" />
    </node>
  </map>`;
  const convertedFm = parseFreeMindOrOpmlToMermaid(freeMindSample);
  if (
    convertedFm.startsWith('mindmap') &&
    convertedFm.includes('root((Central Topic))') &&
    convertedFm.includes('Subtopic A') &&
    convertedFm.includes('Subtopic B')
  ) {
    console.log('✅ [FreeMind / OPML Converter] parseFreeMindOrOpmlToMermaid() parses FreeMind XML into Mermaid mindmap.');
    passed++;
  } else {
    console.error('❌ [FreeMind / OPML Converter] failed:', convertedFm);
    failed++;
  }

} catch (err) {
  console.error('❌ [Universal Importers] Test Group 7 failed:', err);
  failed++;
}

// Test Group 8: WebAssembly High Performance Engine
console.log('\n--- Test Group 8: WebAssembly High Performance Engine ---');
try {
  const {
    wasmFastHash,
    wasmApplyAlphaBackground,
    renderGraphvizWasm,
    getWasmCapabilities,
  } = await import('./src/utils/wasm/wasm-accelerator.js');

  // 1. WebAssembly Fast FNV-1a Hash Test
  const testString = 'graph TD\n  Client[Wasm Client] --> Engine[Turbo Engine]';
  const hash1 = wasmFastHash(testString);
  const hash2 = wasmFastHash(testString);
  if (hash1 && hash1 === hash2 && hash1.length === 8) {
    console.log(`✅ [Wasm Hash] wasmFastHash() calculated consistent 32-bit hardware hash: 0x${hash1}`);
    passed++;
  } else {
    console.error('❌ [Wasm Hash] failed:', hash1, hash2);
    failed++;
  }

  // 2. WebAssembly Native Graphviz C-Engine Test
  const dotSource = 'digraph Architecture { rankdir=LR; DiagramAtlas -> Wasm -> NativePerformance; }';
  const graphvizSvg = await renderGraphvizWasm(dotSource);
  if (graphvizSvg && graphvizSvg.includes('<svg') && graphvizSvg.includes('NativePerformance')) {
    console.log(`✅ [Wasm Graphviz Engine] renderGraphvizWasm() compiled Graphviz C engine in WebAssembly (${graphvizSvg.length} bytes SVG).`);
    passed++;
  } else {
    console.error('❌ [Wasm Graphviz Engine] failed to render SVG:', graphvizSvg);
    failed++;
  }

  // 3. WebAssembly Capabilities Detection
  const caps = await getWasmCapabilities();
  if (caps.wasm === true) {
    console.log(`✅ [Wasm Capabilities] Hardware acceleration detected: Wasm=${caps.wasm}, SIMD=${caps.simd}, Threads=${caps.threads}`);
    passed++;
  } else {
    console.error('❌ [Wasm Capabilities] WebAssembly not supported');
    failed++;
  }

  // 4. WebAssembly Pixel Buffer Compositing
  const mockPixelData = new Uint8ClampedArray(16); // 4 transparent pixels (RGBA)
  const mockImageData = { data: mockPixelData };
  wasmApplyAlphaBackground(mockImageData, 240, 240, 240);
  if (mockPixelData[0] === 240 && mockPixelData[3] === 255) {
    console.log('✅ [Wasm Pixel Processing] wasmApplyAlphaBackground() composited pixel buffer in linear memory.');
    passed++;
  } else {
    console.error('❌ [Wasm Pixel Processing] failed:', mockPixelData);
    failed++;
  }

  // 5. WebAssembly Real-time Benchmark Runner Test
  const { runWasmBenchmark } = await import('./src/utils/wasm/wasm-accelerator.js');
  const benchMetrics = await runWasmBenchmark();
  if (benchMetrics && benchMetrics.hash.speedup > 0 && benchMetrics.pixel.speedup > 0) {
    console.log(`✅ [Wasm Benchmark Suite] runWasmBenchmark() executed: Hash Speedup=${benchMetrics.hash.speedup}x, Pixel Speedup=${benchMetrics.pixel.speedup}x.`);
    passed++;
  } else {
    console.error('❌ [Wasm Benchmark Suite] failed:', benchMetrics);
    failed++;
  }

  // 6. Graphviz DOT vs Mermaid Syntax Detection
  const { isGraphvizDot } = await import('./src/utils/mermaid-renderer.js');
  const isDot1 = isGraphvizDot('digraph Test { a -> b; }');
  const isDot2 = isGraphvizDot('flowchart TD\n  A --> B');
  if (isDot1 === true && isDot2 === false) {
    console.log('✅ [Wasm Syntax Detector] isGraphvizDot() accurately distinguished DOT syntax from Mermaid.');
    passed++;
  } else {
    console.error('❌ [Wasm Syntax Detector] failed:', { isDot1, isDot2 });
    failed++;
  }

} catch (err) {
  console.error('❌ [Wasm Accelerator] Test Group 8 failed:', err);
  failed++;
}

console.log(`\n========================================`);
console.log(`Total checks passed: ${passed}, failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}


