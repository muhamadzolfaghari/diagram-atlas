import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  StreamLanguage,
  syntaxHighlighting,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import { xml } from "@codemirror/lang-xml";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { undo, redo } from "@codemirror/commands";
import { openSearchPanel } from "@codemirror/search";
import { getFormat } from "../lib/formats.js";

const keywords =
  "flowchart graph sequenceDiagram classDiagram stateDiagram-v2 erDiagram mindmap gantt pie xychart-beta C4Context gitGraph journey timeline sankey-beta quadrantChart kanban block-beta subgraph end participant actor class state direction title section autonumber".split(
    " ",
  );
const diagramLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.match(/%%.*|\/\/.*|#.*|'.*$/)) return "comment";
    if (stream.match(/"[^"]*"/)) return "string";
    if (stream.match(/(?:-->|->>|-->>|--|->|<\|--)/)) return "operator";
    if (stream.match(/\b\d+\b/)) return "number";
    if (stream.match(new RegExp(`\\b(${keywords.join("|")})\\b`)))
      return "keyword";
    stream.next();
    return null;
  },
});
function language(doc) {
  const name = doc.name.toLowerCase();
  switch (getFormat(doc.format).language) {
    case "sql":
      return sql();
    case "xml":
      return xml();
    case "markdown":
      return markdown();
    case "yaml":
      return name.endsWith(".json") ? json() : yaml();
    case "javascript":
      return name.endsWith(".py")
        ? python()
        : javascript({ typescript: true, jsx: true });
    default:
      return diagramLanguage;
  }
}
const theme = EditorView.theme(
  {
    "&": { backgroundColor: "#0f1520", color: "#dce5f2", fontSize: "12px" },
    ".cm-content": {
      fontFamily: "JetBrains Mono, monospace",
      padding: "16px 0",
      caretColor: "#aac7ff",
    },
    ".cm-line": { padding: "0 16px", lineHeight: "22px" },
    ".cm-gutters": {
      backgroundColor: "#0f1520",
      color: "#5e708a",
      border: "none",
      minWidth: "42px",
    },
    ".cm-activeLineGutter": { backgroundColor: "#1a2638", color: "#b6c9e9" },
    ".cm-activeLine": { backgroundColor: "#17223466" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "#2b4674",
    },
    ".cm-cursor": { borderLeftColor: "#8bacff" },
    ".cm-panels": { backgroundColor: "#17202c", color: "#dce5f2" },
    ".cm-tooltip": {
      backgroundColor: "#17202c",
      border: "1px solid #34445b",
      color: "#dce5f2",
    },
  },
  { dark: true },
);
const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#94b6ff" },
  { tag: tags.string, color: "#83d5ad" },
  { tag: tags.comment, color: "#657993" },
  { tag: tags.number, color: "#f3c686" },
  { tag: tags.operator, color: "#c0abf5" },
  { tag: tags.typeName, color: "#7dd3fc" },
]);
const CodeEditor = forwardRef(function CodeEditor({ document, onChange }, ref) {
  const host = useRef(null),
    editor = useRef(null),
    latest = useRef({ document, onChange }),
    states = useRef(new Map()),
    currentId = useRef(null),
    compartment = useRef(new Compartment());
  latest.current = { document, onChange };
  const createState = (doc) =>
    EditorState.create({
      doc: doc.source,
      extensions: [
        basicSetup,
        theme,
        syntaxHighlighting(highlight),
        compartment.current.of(language(doc)),
        EditorView.contentAttributes.of({
          "aria-label": "Diagram source code",
          spellcheck: "false",
        }),
        autocompletion({
          override:
            doc.format === "mermaid" || doc.format === "graphviz"
              ? [
                  (context) => {
                    const word = context.matchBefore(/\w*/);
                    if (!word || (word.from === word.to && !context.explicit))
                      return null;
                    return {
                      from: word.from,
                      options: keywords.map((label) => ({
                        label,
                        type: "keyword",
                      })),
                    };
                  },
                ]
              : undefined,
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged)
            latest.current.onChange(
              currentId.current,
              update.state.doc.toString(),
            );
        }),
      ],
    });
  useEffect(() => {
    if (!document) return;
    editor.current = new EditorView({
      state: createState(document),
      parent: host.current,
    });
    currentId.current = document.id;
    return () => {
      editor.current?.destroy();
      editor.current = null;
    };
  }, []);
  useEffect(() => {
    if (!document || !editor.current) return;
    const view = editor.current;
    if (currentId.current !== document.id) {
      states.current.set(currentId.current, view.state);
      currentId.current = document.id;
      view.setState(states.current.get(document.id) || createState(document));
    }
    if (view.state.doc.toString() !== document.source)
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: document.source,
        },
      });
    view.dispatch({
      effects: compartment.current.reconfigure(language(document)),
    });
  }, [document?.id, document?.source, document?.format, document?.name]);
  useImperativeHandle(ref, () => ({
    undo: () => editor.current && undo(editor.current),
    redo: () => editor.current && redo(editor.current),
    search: () => editor.current && openSearchPanel(editor.current),
    focus: () => editor.current?.focus(),
    goTo: (line) => {
      const v = editor.current;
      if (v) {
        const at = v.state.doc.line(
          Math.max(1, Math.min(line, v.state.doc.lines)),
        ).from;
        v.dispatch({
          selection: { anchor: at },
          effects: EditorView.scrollIntoView(at, { y: "center" }),
        });
        v.focus();
      }
    },
  }));
  return <div ref={host} className="code-mirror" />;
});
export default CodeEditor;
