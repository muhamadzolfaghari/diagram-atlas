import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { deflateSync, strToU8 } from "fflate";
import {
  FORMATS,
  compileDocument,
  detectFormat,
  importDocument,
} from "../src/lib/formats.js";
const dom = new JSDOM("<!doctype html><body></body>");
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
const { default: mermaid } = await import("mermaid");
mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
for (const format of FORMATS) {
  test(`${format.name}: sample compiles without changing original source`, async () => {
    const original = { format: format.id, source: format.sample };
    const result = await compileDocument(original);
    assert.equal(original.source, format.sample);
    assert.ok(result.code);
    if (format.id !== "graphviz")
      assert.notEqual(await mermaid.parse(result.code), false);
    assert.equal(result.warnings.length, format.mode === "Derived" ? 1 : 0);
  });
}
test("ambiguous spec extensions are detected by content", () => {
  assert.equal(detectFormat("schema.json", '{"openapi":"3.0.0"}'), "openapi");
  assert.equal(detectFormat("events.yaml", "asyncapi: 3.0.0"), "asyncapi");
  assert.equal(
    detectFormat("model.xml", FORMATS.find((f) => f.id === "drawio").sample),
    "drawio",
  );
  assert.equal(
    detectFormat("diagram.txt", "sequenceDiagram\n A->>B: Hi"),
    "mermaid",
  );
  assert.throws(
    () => detectFormat("unrelated.json", '{"hello":true}'),
    /Cannot identify/,
  );
});
test("compressed Draw.io first page can be previewed", async () => {
  const xml = FORMATS.find((f) => f.id === "drawio").sample;
  const payload = Buffer.from(
    deflateSync(strToU8(encodeURIComponent(xml))),
  ).toString("base64");
  const result = await compileDocument({
    format: "drawio",
    source: `<mxfile><diagram>${payload}</diagram></mxfile>`,
  });
  assert.match(result.code, /Client/);
  assert.notEqual(await mermaid.parse(result.code), false);
});
test("PlantUML class and state arrows do not misclassify as sequence", async () => {
  const state = await compileDocument({
    format: "plantuml",
    source: "@startuml\n[*] --> Idle\nIdle --> Active\n@enduml",
  });
  assert.match(state.code, /^stateDiagram-v2/);
  const klass = await compileDocument({
    format: "plantuml",
    source: "@startuml\nclass User\nclass Order\nUser --> Order\n@enduml",
  });
  assert.match(klass.code, /^classDiagram/);
});
test("invalid and empty input report useful diagnostics", async () => {
  await assert.rejects(
    compileDocument({ format: "openapi", source: "openapi: [invalid" }),
  );
  await assert.rejects(
    compileDocument({ format: "drawio", source: "<broken" }),
  );
  assert.deepEqual(await compileDocument({ format: "sql", source: "" }), {
    code: "",
    warnings: [],
  });
});

test("native file import retains source, name and format", async () => {
  const source = "CREATE TABLE product (id INT PRIMARY KEY);";
  const result = await importDocument(new File([source], "schema.sql"));
  assert.equal(result.source, source);
  assert.equal(result.format, "sql");
  assert.equal(result.name, "schema.sql");
});
test("XMind binary import retains original workbook and editable first sheet", async () => {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file(
    "content.json",
    JSON.stringify([
      {
        rootTopic: {
          title: "Atlas",
          children: { attached: [{ title: "Studio" }] },
        },
      },
    ]),
  );
  const data = await zip.generateAsync({ type: "uint8array" });
  const imported = await importDocument(new File([data], "plan.xmind"));
  assert.equal(imported.format, "xmind");
  assert.match(imported.source, /Atlas/);
  assert.match(imported.source, /Studio/);
  assert.deepEqual(
    Buffer.from(imported.original.base64, "base64"),
    Buffer.from(data),
  );
  assert.notEqual(await mermaid.parse(imported.source), false);
});
