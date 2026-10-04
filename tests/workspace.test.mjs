import test from "node:test";
import assert from "node:assert/strict";
import {
  createDocument,
  createProject,
  addDocuments,
  parseProject,
  serializeProject,
  loadWorkspace,
  saveWorkspace,
  WORKSPACE_KEY,
} from "../src/lib/workspace.js";
const storage = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
};
test("project backup preserves editable files, attachments, tabs, and snapshots", () => {
  const doc = {
    ...createDocument("sql", "schema.sql"),
    original: { name: "original.xmind", base64: "YWJj" },
  };
  const project = createProject("Data platform", [doc]);
  project.snapshots = [
    { id: "s", name: doc.name, source: doc.source, format: doc.format },
  ];
  const restored = parseProject(serializeProject(project));
  assert.deepEqual(restored.documents, project.documents);
  assert.equal(restored.snapshots.length, 1);
  assert.equal(restored.activeId, doc.id);
});
test("adding duplicate names makes independent uniquely named documents", () => {
  const project = createProject("Test", [createDocument("sql", "schema.sql")]);
  const result = addDocuments(project, [
    {
      name: "schema.sql",
      format: "sql",
      source: "CREATE TABLE a (id INTEGER);",
    },
  ]);
  assert.equal(result.documents[1].name, "schema-2.sql");
  assert.notEqual(result.documents[0].id, result.documents[1].id);
  assert.equal(project.documents.length, 1);
});
test("workspace roundtrip and legacy draft migration", () => {
  const local = storage();
  local.setItem("nodeflow_draft_v1", "flowchart TD\n Legacy --> Preserved");
  const workspace = loadWorkspace(local);
  assert.match(workspace.projects[0].documents[0].source, /Legacy/);
  saveWorkspace(workspace, local);
  assert.deepEqual(loadWorkspace(local), workspace);
});
test("corrupt storage opens a usable workspace without deleting existing storage", () => {
  const local = storage();
  local.setItem(WORKSPACE_KEY, "bad json");
  assert.equal(loadWorkspace(local).projects.length, 1);
  assert.equal(local.getItem(WORKSPACE_KEY), "bad json");
});
test("invalid backups are rejected", () => {
  assert.throws(() => parseProject("{}"), /not a supported/);
  assert.throws(
    () =>
      parseProject(
        JSON.stringify({
          app: "DiagramAtlas",
          version: 1,
          project: {
            name: "Bad",
            documents: [{ name: "x", format: "unknown", source: "x" }],
          },
        }),
      ),
    /invalid file/,
  );
});
