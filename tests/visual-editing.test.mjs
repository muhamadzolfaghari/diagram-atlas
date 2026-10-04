import test from "node:test";
import assert from "node:assert/strict";
import {
  flowchartNodes,
  renameFlowchartNode,
  addFlowchartNode,
  connectFlowchartNodes,
} from "../src/lib/visual-editing.js";
test("canvas label edits preserve unrelated source and shape", () => {
  const source =
    "flowchart LR\n A[Client] --> B([Service])\n %% Keep this comment";
  const next = renameFlowchartNode(source, "B", "New service");
  assert.match(next, /B\(\["New service"\]\)/);
  assert.match(next, /Keep this comment/);
  assert.equal(flowchartNodes(next).length, 2);
});
test("adding and connecting nodes use unique ids and escaped labels", () => {
  const source = "flowchart TD\n node1[Existing]";
  const next = addFlowchartNode(source, 'Review "order"');
  assert.match(next, /node2\["Review &quot;order&quot;"\]/);
  assert.match(
    connectFlowchartNodes(next, "node1", "node2", "continue"),
    /node1 -->\|"continue"\| node2/,
  );
  assert.throws(
    () => connectFlowchartNodes(next, "missing", "node2"),
    /existing nodes/,
  );
});
