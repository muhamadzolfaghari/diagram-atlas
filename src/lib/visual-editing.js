const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const safeLabel = (label) =>
  label
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/[\r\n]/g, " ");
export const isFlowchart = (doc) =>
  doc?.format === "mermaid" &&
  /^\s*(flowchart|graph)\s+(TD|TB|BT|LR|RL)\b/m.test(doc.source);
export function flowchartNodes(source) {
  const nodes = new Map();
  for (const match of source.matchAll(
    /\b([A-Za-z_][\w-]*)\s*(\[\[|\(\(|\(\[|\{|\[|\()([^\n]*?)(\]\]|\)\)|\]\)|\}|\]|\))/g,
  )) {
    if (!["subgraph", "classDef", "style"].includes(match[1]))
      nodes.set(match[1], match[3].replace(/^"|"$/g, ""));
  }
  return [...nodes].map(([id, label]) => ({ id, label }));
}
export function renameFlowchartNode(source, id, label) {
  const pattern = new RegExp(
    `(\\b${escapeRegex(id)}\\s*)(\\[\\[|\\(\\(|\\(\\[|\\{|\\[|\\()([^\\n]*?)(\\]\\]|\\)\\)|\\]\\)|\\}|\\]|\\))`,
  );
  if (!pattern.test(source))
    throw new Error(
      "This node is not declared with an editable label. Edit its declaration in the source.",
    );
  return source.replace(
    pattern,
    (_, prefix, open, old, close) =>
      `${prefix}${open}"${safeLabel(label)}"${close}`,
  );
}
export function addFlowchartNode(source, label) {
  if (!label.trim()) throw new Error("Enter a node label.");
  let number = 1;
  while (new RegExp(`\\bnode${number}\\b`).test(source)) number++;
  return `${source.trimEnd()}\n  node${number}["${safeLabel(label)}"]\n`;
}
export function connectFlowchartNodes(source, from, to, label = "") {
  const nodes = flowchartNodes(source);
  if (!nodes.some((n) => n.id === from) || !nodes.some((n) => n.id === to))
    throw new Error("Choose two existing nodes.");
  return `${source.trimEnd()}\n  ${from} -->${label.trim() ? `|"${safeLabel(label)}"|` : ""} ${to}\n`;
}
