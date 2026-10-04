import { FORMATS, getFormat } from "./formats.js";
export const WORKSPACE_KEY = "diagramatlas_workspace_v1";
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `atlas_${Date.now()}_${Math.random().toString(36).slice(2)}`;
export function createDocument(format = "mermaid", name, source) {
  const definition = getFormat(format);
  return {
    id: uid(),
    name: name || `untitled.${definition.ext}`,
    format,
    source: source ?? definition.sample,
    updatedAt: new Date().toISOString(),
  };
}
export function createProject(
  name = "Untitled project",
  documents = [createDocument()],
) {
  return {
    id: uid(),
    name,
    documents,
    openIds: documents.map((d) => d.id),
    activeId: documents[0]?.id || null,
    snapshots: [],
    updatedAt: new Date().toISOString(),
  };
}
export function validateProject(value) {
  if (
    !value ||
    typeof value.name !== "string" ||
    !Array.isArray(value.documents) ||
    !value.documents.length ||
    value.documents.length > 100
  )
    throw new Error("A project must have a name and between 1 and 100 files.");
  const ids = new Set();
  const documents = value.documents.map((d) => {
    if (
      !d ||
      typeof d.name !== "string" ||
      typeof d.source !== "string" ||
      !FORMATS.some((f) => f.id === d.format)
    )
      throw new Error(
        "A project contains an invalid file or an unsupported format.",
      );
    if (d.source.length > 15 * 1024 * 1024)
      throw new Error("A project file exceeds 15 MB.");
    let id = typeof d.id === "string" ? d.id : uid();
    if (ids.has(id)) id = uid();
    ids.add(id);
    const original =
      d.original &&
      typeof d.original.name === "string" &&
      typeof d.original.base64 === "string"
        ? { name: d.original.name, base64: d.original.base64 }
        : undefined;
    return {
      id,
      name: d.name,
      format: d.format,
      source: d.source,
      updatedAt: d.updatedAt || new Date().toISOString(),
      ...(original && { original }),
    };
  });
  return {
    id: typeof value.id === "string" ? value.id : uid(),
    name: value.name,
    documents,
    openIds: (Array.isArray(value.openIds)
      ? value.openIds
      : documents.map((d) => d.id)
    ).filter((id) => ids.has(id)),
    activeId: ids.has(value.activeId) ? value.activeId : documents[0].id,
    snapshots: Array.isArray(value.snapshots)
      ? value.snapshots
          .filter(
            (s) =>
              s &&
              typeof s.source === "string" &&
              s.source.length <= 15 * 1024 * 1024 &&
              typeof s.name === "string" &&
              FORMATS.some((f) => f.id === s.format),
          )
          .slice(0, 30)
      : [],
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
}
export function loadWorkspace(storage = localStorage) {
  try {
    const raw = JSON.parse(storage.getItem(WORKSPACE_KEY) || "null");
    if (
      raw?.version === 1 &&
      Array.isArray(raw.projects) &&
      raw.projects.length
    ) {
      const projects = raw.projects.map(validateProject);
      return {
        version: 1,
        projects,
        activeProjectId: projects.some((p) => p.id === raw.activeProjectId)
          ? raw.activeProjectId
          : projects[0].id,
      };
    }
  } catch {
    /* A corrupt backup must not prevent the editor from opening. */
  }
  let legacy = null;
  try {
    legacy = storage.getItem("nodeflow_draft_v1");
  } catch {}
  const project = createProject("My first project", [
    createDocument("mermaid", "architecture.mmd", legacy || undefined),
  ]);
  return { version: 1, projects: [project], activeProjectId: project.id };
}
export function saveWorkspace(workspace, storage = localStorage) {
  storage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}
export function uniqueName(project, name) {
  let candidate = name,
    i = 2;
  const at = name.lastIndexOf("."),
    base = at > 0 ? name.slice(0, at) : name,
    ext = at > 0 ? name.slice(at) : "";
  while (project.documents.some((d) => d.name === candidate))
    candidate = `${base}-${i++}${ext}`;
  return candidate;
}
export function addDocuments(project, documents) {
  const next = {
    ...project,
    documents: [...project.documents],
    openIds: [...project.openIds],
  };
  for (const input of documents) {
    const doc = {
      ...createDocument(input.format, input.name, input.source),
      ...input,
      id: uid(),
      name: uniqueName(next, input.name),
    };
    next.documents.push(doc);
    next.openIds.push(doc.id);
    next.activeId = doc.id;
  }
  return { ...next, updatedAt: new Date().toISOString() };
}
export function serializeProject(project) {
  return JSON.stringify({ app: "DiagramAtlas", version: 1, project }, null, 2);
}
export function parseProject(source) {
  const data = JSON.parse(source);
  if (data.app !== "DiagramAtlas" || data.version !== 1)
    throw new Error("This is not a supported DiagramAtlas project backup.");
  return validateProject(data.project);
}
