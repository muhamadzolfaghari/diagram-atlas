/** The single source of truth for editing, import, preview, and documentation. */
export const FORMATS = [
  {
    id: "mermaid",
    name: "Mermaid",
    ext: "mmd",
    extensions: ["mmd", "mermaid"],
    language: "diagram",
    mode: "Native",
    family: "Diagrams",
    description: "Flowcharts, ER, UML, mindmaps, Gantt, charts, and C4.",
    sample:
      "flowchart LR\n  Client[Web client] --> API[API gateway]\n  API --> Service[Order service]\n  Service --> DB[(Database)]",
  },
  {
    id: "graphviz",
    name: "Graphviz DOT",
    ext: "dot",
    extensions: ["dot", "gv"],
    language: "diagram",
    mode: "Native",
    family: "Architecture",
    description: "Native Graphviz layout through WebAssembly.",
    sample:
      "digraph Architecture {\n  rankdir=LR;\n  node [shape=box, style=rounded];\n  Client -> Gateway -> Service -> Database;\n}",
  },
  {
    id: "plantuml",
    name: "PlantUML",
    ext: "puml",
    extensions: ["puml", "plantuml"],
    language: "diagram",
    mode: "Derived",
    family: "UML",
    description:
      "Sequence, class, and state subsets; styling and macros are not preserved.",
    sample:
      "@startuml\nparticipant Client\nparticipant API\nClient -> API: Create order\nAPI --> Client: Order confirmed\n@enduml",
  },
  {
    id: "d2",
    name: "D2",
    ext: "d2",
    extensions: ["d2"],
    language: "diagram",
    mode: "Derived",
    family: "Architecture",
    description:
      "Basic nodes, connections, and containers; layout and styling are approximate.",
    sample:
      "client: Web Client\napi: API Gateway\ndb: Database\nclient -> api: Request\napi -> db: Query",
  },
  {
    id: "sql",
    name: "SQL DDL",
    ext: "sql",
    extensions: ["sql"],
    language: "sql",
    mode: "Derived",
    family: "Data",
    description:
      "CREATE TABLE columns and foreign keys to ER schemas; dialect-specific syntax may need simplification.",
    sample:
      "CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name VARCHAR(100)\n);\nCREATE TABLE orders (\n  id INTEGER PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id)\n);",
  },
  {
    id: "graphql",
    name: "GraphQL SDL",
    ext: "graphql",
    extensions: ["graphql", "gql"],
    language: "diagram",
    mode: "Derived",
    family: "Data",
    description: "Types, fields, and relationships to a class diagram.",
    sample:
      "type User {\n  id: ID!\n  name: String!\n  orders: [Order!]!\n}\ntype Order {\n  id: ID!\n  user: User!\n}",
  },
  {
    id: "openapi",
    name: "OpenAPI / Swagger",
    ext: "yaml",
    extensions: [],
    language: "yaml",
    mode: "Derived",
    family: "APIs",
    description:
      "JSON or YAML paths to a request sequence. Preview shows the first 10 paths.",
    sample:
      'openapi: 3.0.3\ninfo:\n  title: Orders API\n  version: 1.0.0\npaths:\n  /orders:\n    get:\n      summary: List orders\n      responses:\n        "200":\n          description: Order list',
  },
  {
    id: "asyncapi",
    name: "AsyncAPI",
    ext: "yaml",
    extensions: [],
    language: "yaml",
    mode: "Derived",
    family: "APIs",
    description:
      "JSON or YAML v2/v3 channels to event sequences. Preview shows the first 12 channels.",
    sample:
      "asyncapi: 2.6.0\ninfo:\n  title: Orders events\n  version: 1.0.0\nchannels:\n  orders.created:\n    publish:\n      message:\n        name: OrderCreated",
  },
  {
    id: "drawio",
    name: "Draw.io",
    ext: "drawio",
    extensions: ["drawio"],
    language: "xml",
    mode: "Derived",
    family: "Diagrams",
    description:
      "Compressed or plain XML nodes and edges; first page preview, approximate shapes and layout.",
    sample:
      '<mxGraphModel><root>\n  <mxCell id="0"/><mxCell id="1" parent="0"/>\n  <mxCell id="a" value="Client" vertex="1" parent="1"/>\n  <mxCell id="b" value="Service" vertex="1" parent="1"/>\n  <mxCell id="e" edge="1" source="a" target="b" parent="1"/>\n</root></mxGraphModel>',
  },
  {
    id: "bpmn",
    name: "BPMN 2.0",
    ext: "bpmn",
    extensions: ["bpmn"],
    language: "xml",
    mode: "Derived",
    family: "Processes",
    description:
      "Tasks, events, gateways, and sequence flows; no BPMN execution semantics.",
    sample:
      '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">\n  <process id="orders">\n    <startEvent id="start" name="Order received"/>\n    <task id="check" name="Check inventory"/>\n    <endEvent id="end" name="Confirmed"/>\n    <sequenceFlow id="f1" sourceRef="start" targetRef="check"/>\n    <sequenceFlow id="f2" sourceRef="check" targetRef="end"/>\n  </process>\n</definitions>',
  },
  {
    id: "c4",
    name: "C4 / Structurizr DSL",
    ext: "dsl",
    extensions: ["dsl", "c4"],
    language: "diagram",
    mode: "Derived",
    family: "Architecture",
    description:
      "Basic people, systems, containers, and relationships to C4 context.",
    sample:
      'workspace {\n  model {\n    customer = person "Customer"\n    shop = softwareSystem "Online store"\n    customer -> shop "Places orders"\n  }\n}',
  },
  {
    id: "terraform",
    name: "Terraform HCL",
    ext: "tf",
    extensions: ["tf"],
    language: "diagram",
    mode: "Derived",
    family: "Architecture",
    description:
      "Resources and direct references; modules, dynamic blocks, and evaluated values are not resolved.",
    sample:
      'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n}\nresource "aws_subnet" "app" {\n  vpc_id = aws_vpc.main.id\n  cidr_block = "10.0.1.0/24"\n}',
  },
  {
    id: "markdown",
    name: "Markdown outline",
    ext: "md",
    extensions: ["md", "markdown", "txt"],
    language: "markdown",
    mode: "Derived",
    family: "Mindmaps",
    description:
      "Indented lists to a mindmap. Embedded Mermaid fences can be rendered.",
    sample:
      "- Product strategy\n  - Discovery\n    - Interviews\n    - Research\n  - Delivery\n    - Build\n    - Test",
  },
  {
    id: "csv",
    name: "CSV relationships",
    ext: "csv",
    extensions: ["csv"],
    language: "diagram",
    mode: "Derived",
    family: "Data",
    description: "Source,target rows to a relationship graph.",
    sample:
      "source,target,label\nClient,Gateway,Request\nGateway,Service,Route\nService,Database,Query",
  },
  {
    id: "freemind",
    name: "FreeMind",
    ext: "mm",
    extensions: ["mm"],
    language: "xml",
    mode: "Derived",
    family: "Mindmaps",
    description:
      "Topic hierarchy to a mindmap; styling and metadata remain in the original XML.",
    sample:
      '<map version="1.0.1">\n  <node TEXT="Product">\n    <node TEXT="Discovery"/>\n    <node TEXT="Delivery"/>\n  </node>\n</map>',
  },
  {
    id: "opml",
    name: "OPML",
    ext: "opml",
    extensions: ["opml"],
    language: "xml",
    mode: "Derived",
    family: "Mindmaps",
    description: "Outline hierarchy to a mindmap.",
    sample:
      '<opml version="2.0"><body>\n  <outline text="Product">\n    <outline text="Discovery"/>\n    <outline text="Delivery"/>\n  </outline>\n</body></opml>',
  },
  {
    id: "xmind",
    name: "XMind",
    ext: "xmind",
    extensions: ["xmind"],
    language: "diagram",
    mode: "Mindmap",
    family: "Mindmaps",
    description:
      "First sheet of ZEN or legacy workbooks to an editable Mermaid mindmap; original workbook retained, fresh workbook export supported.",
    sample:
      "mindmap\n  root((Product))\n    Discovery\n      Research\n    Delivery\n      Build\n      Test",
  },
  {
    id: "code",
    name: "Source code → UML",
    ext: "ts",
    extensions: ["ts", "tsx", "js", "jsx", "py", "java", "cs", "go", "rs"],
    language: "javascript",
    mode: "Derived",
    family: "UML",
    description:
      "Best-effort class/struct extraction. This is a diagram modeler, not a code execution environment.",
    sample:
      "class User {\n  id: string;\n  name: string;\n}\nclass Admin extends User {\n  permissions: string[];\n}",
  },
];
export const getFormat = (id) =>
  FORMATS.find((format) => format.id === id) || FORMATS[0];
export const FILE_ACCEPT = [
  ...new Set(
    FORMATS.flatMap((f) => f.extensions).concat([
      "json",
      "yaml",
      "yml",
      "xml",
      "atlas",
    ]),
  ),
]
  .map((ext) => `.${ext}`)
  .join(",");

export function detectFormat(name = "", source = "") {
  const ext = name.toLowerCase().split(".").pop();
  const known = FORMATS.find(
    (f) => f.extensions.includes(ext) && f.id !== "markdown",
  );
  if (known) return known.id;
  if (/^\s*(strict\s+)?(di)?graph\s*[^\n]*\{/i.test(source)) return "graphviz";
  if (
    /^\s*(?:---[\s\S]*?---\s*)?(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|mindmap|gantt|pie|xychart|C4|gitGraph|journey|timeline|sankey|quadrantChart|kanban|block)\b/m.test(
      source,
    )
  )
    return "mermaid";
  if (/(?:"openapi"|"swagger")\s*:|^\s*(openapi|swagger)\s*:/m.test(source))
    return "openapi";
  if (/"asyncapi"\s*:|^\s*asyncapi\s*:/m.test(source)) return "asyncapi";
  if (/<mxfile\b|<mxGraphModel\b/.test(source)) return "drawio";
  if (/<(?:\w+:)?definitions\b|<(?:\w+:)?process\b/.test(source)) return "bpmn";
  if (/<opml\b/.test(source)) return "opml";
  if (/<map\b/.test(source)) return "freemind";
  if (/^\s*@startuml/m.test(source)) return "plantuml";
  if (/CREATE\s+TABLE/i.test(source)) return "sql";
  if (["md", "markdown", "txt"].includes(ext)) return "markdown";
  throw new Error(
    `Cannot identify ${name || "this source"}. Choose a format in the file inspector.`,
  );
}

async function specification(source) {
  const { parse } = await import("yaml");
  const value = parse(source);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a JSON or YAML specification object.");
  return JSON.stringify(value);
}

async function expandDrawio(source) {
  const doc = new DOMParser().parseFromString(source, "application/xml");
  if (doc.querySelector("parsererror"))
    throw new Error("Invalid Draw.io XML. Check closing tags and attributes.");
  const page = doc.querySelector("diagram");
  if (!page) return source;
  const model = page.querySelector("mxGraphModel");
  if (model) return new XMLSerializer().serializeToString(model);
  const compressed = page.textContent.trim();
  if (compressed.startsWith("<")) return compressed;
  const { inflateSync, strFromU8 } = await import("fflate");
  try {
    const bytes = Uint8Array.from(atob(compressed), (c) => c.charCodeAt(0));
    return decodeURIComponent(strFromU8(inflateSync(bytes)));
  } catch {
    throw new Error(
      "Unable to decode the first Draw.io page. Export an uncompressed XML file and retry.",
    );
  }
}

export async function compileDocument(document) {
  const { format, source } = document;
  if (!source.trim()) return { code: "", warnings: [] };
  let code;
  switch (format) {
    case "mermaid":
    case "graphviz":
    case "xmind":
      code = source;
      break;
    case "plantuml":
      code = (
        await import("../utils/importers/plantuml.js")
      ).parsePlantUmlToMermaid(source);
      break;
    case "d2":
      code = (await import("../utils/importers/d2.js")).parseD2ToMermaid(
        source,
      );
      break;
    case "sql":
      code = (
        await import("../utils/importers/sql-ddl.js")
      ).parseSqlDdlToMermaid(source);
      break;
    case "graphql":
      code = (
        await import("../utils/importers/graphql.js")
      ).parseGraphQLToMermaid(source);
      break;
    case "openapi":
      code = (
        await import("../utils/importers/openapi.js")
      ).parseOpenApiToMermaid(await specification(source));
      break;
    case "asyncapi":
      code = (
        await import("../utils/importers/asyncapi.js")
      ).parseAsyncApiToMermaid(await specification(source));
      break;
    case "drawio":
      code = (
        await import("../utils/importers/drawio.js")
      ).parseDrawioToMermaid(await expandDrawio(source));
      break;
    case "bpmn":
      code = (await import("../utils/importers/bpmn.js")).parseBpmnToMermaid(
        source,
      );
      break;
    case "c4":
      code = (await import("../utils/importers/c4-dsl.js")).parseC4DslToMermaid(
        source,
      );
      break;
    case "terraform":
      code = (
        await import("../utils/importers/terraform.js")
      ).parseTerraformToMermaid(source);
      break;
    case "markdown": {
      const fence = source.match(/```mermaid\s*\n([\s\S]*?)```/i);
      code = fence
        ? fence[1]
        : (await import("../utils/importers/markdown-outline.js")).parseOutline(
            source,
            "mindmap",
          );
      break;
    }
    case "csv":
      code = (
        await import("../utils/importers/csv-table.js")
      ).parseCsvToMermaid(source);
      break;
    case "freemind":
    case "opml":
      code = (
        await import("../utils/importers/freemind.js")
      ).parseFreeMindOrOpmlToMermaid(source);
      break;
    case "code":
      code = (
        await import("../utils/importers/code-to-uml.js")
      ).parseCodeToClassDiagram(source);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  if (!code || code.trim().split("\n").length < 2)
    throw new Error(
      `No diagram elements found in ${getFormat(format).name}. Check the supported syntax.`,
    );
  const derived = getFormat(format).mode === "Derived";
  return {
    code,
    warnings: derived
      ? [
          getFormat(format).description +
            " Your original source stays editable.",
        ]
      : [],
  };
}

export async function importDocument(file) {
  if (file.size > 15 * 1024 * 1024)
    throw new Error(`${file.name} exceeds the 15 MB per-file limit.`);
  if (file.name.toLowerCase().endsWith(".xmind")) {
    const buffer = await file.arrayBuffer();
    const { parseXmindToMermaid } = await import("../utils/importers/xmind.js");
    const parsed = await parseXmindToMermaid(buffer);
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return {
      name: file.name,
      source: parsed.mermaidCode,
      format: "xmind",
      original: { name: file.name, base64: btoa(binary) },
    };
  }
  const source = await file.text();
  return {
    name: file.webkitRelativePath || file.name,
    source,
    format: detectFormat(file.name, source),
  };
}
