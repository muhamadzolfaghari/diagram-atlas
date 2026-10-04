import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  FilePlus,
  FolderPlus,
  FolderOpen,
  Files,
  Download,
  Upload,
  Undo2,
  Redo2,
  Search,
  PanelLeft,
  PanelRight,
  Code2,
  X,
  ChevronDown,
  Maximize,
  Settings2,
  History,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Copy,
  Save,
  Shapes,
  Braces,
  FileCode2,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui.jsx";
import CodeEditor from "../components/CodeEditor.jsx";
import CanvasStage, { GridToggle } from "../components/CanvasStage.jsx";
import { DIAGRAM_TEMPLATES, getTemplateById } from "../components/templates.js";
import {
  FORMATS,
  FILE_ACCEPT,
  getFormat,
  importDocument,
} from "../lib/formats.js";
import {
  createDocument,
  createProject,
  addDocuments,
  parseProject,
  serializeProject,
  uid,
} from "../lib/workspace.js";
import { useWorkspace } from "../hooks/useWorkspace.jsx";
import { useDocumentPreview } from "../hooks/useDocumentPreview.js";
import { useDiagramAssistant } from "../hooks/useDiagramAssistant.js";
import { Exporter } from "../components/exporter.js";
import { StorageManager } from "../components/storage.js";
import { formatMermaidCode } from "../utils/mermaid-formatter.js";
import { SUPPORTED_DIAGRAM_TYPES } from "../utils/importers/describe-to-diagram.js";
import {
  isFlowchart,
  flowchartNodes,
  renameFlowchartNode,
  addFlowchartNode,
  connectFlowchartNodes,
} from "../lib/visual-editing.js";
import { cn } from "../lib/utils.js";

const BLANK =
  "flowchart TD\n  Start([Start]) --> Process[Process task]\n  Process --> Done([Complete])";
export default function Studio() {
  const [params] = useSearchParams(),
    location = useLocation(),
    nav = useNavigate();
  const {
    workspace,
    project,
    saveStatus,
    updateProject,
    addProject,
    setWorkspace,
  } = useWorkspace(params.get("project"));
  const document = project.documents.find((d) => d.id === project.activeId);
  const fileRef = useRef(null),
    folderRef = useRef(null),
    editorRef = useRef(null),
    canvasRef = useRef(null),
    shellRef = useRef(null),
    entryRef = useRef(null),
    splitRef = useRef(null);
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const resize = () => {
      setWidth(window.innerWidth);
      if (window.innerWidth < 1024) {
        setExplorer(false);
        setView((v) => (v === "split" ? "canvas" : v));
      }
      if (window.innerWidth < 1280) setInspector(false);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const [explorer, setExplorer] = useState(() => window.innerWidth > 900),
    [inspector, setInspector] = useState(() => window.innerWidth >= 1280),
    [view, setView] = useState(() =>
      window.innerWidth < 900 ? "canvas" : "split",
    );
  const [theme, setTheme] = useState("dark"),
    [grid, setGrid] = useState("dots"),
    [toast, setToast] = useState(""),
    [dialog, setDialog] = useState(null),
    [format, setFormat] = useState("mermaid"),
    [name, setName] = useState(""),
    [query, setQuery] = useState(""),
    [inspectorTab, setInspectorTab] = useState("properties"),
    [selected, setSelected] = useState(null),
    [label, setLabel] = useState(""),
    [nodeLabel, setNodeLabel] = useState(""),
    [edgeFrom, setEdgeFrom] = useState(""),
    [edgeTo, setEdgeTo] = useState(""),
    [edgeLabel, setEdgeLabel] = useState(""),
    [prompt, setPrompt] = useState(""),
    [aiType, setAiType] = useState("auto"),
    [aiMode, setAiMode] = useState("instant"),
    [presentation, setPresentation] = useState(false);
  const assistant = useDiagramAssistant();
  const preview = useDocumentPreview(document, theme, view);
  const definition = getFormat(document?.format),
    nodes = isFlowchart(document) ? flowchartNodes(document.source) : [];
  const say = (message) => setToast(message);
  const updateSource = (id, source) =>
    updateProject((p) => ({
      ...p,
      documents: p.documents.map((d) =>
        d.id === id ? { ...d, source, updatedAt: new Date().toISOString() } : d,
      ),
    }));
  const openDocument = (id) => {
    updateProject((p) => ({
      ...p,
      activeId: id,
      openIds: p.openIds.includes(id) ? p.openIds : [...p.openIds, id],
    }));
    setSelected(null);
  };
  const newFiles = (docs) => {
    updateProject((p) => addDocuments(p, docs));
    setSelected(null);
  };
  const openNewFile = (chosen = "mermaid") => {
    setFormat(chosen);
    setName(`untitled.${getFormat(chosen).ext}`);
    setDialog("new-file");
  };
  const selectTemplate = (template) => {
    newFiles([
      {
        name: `${template.id}.${template.kind === "graphviz" ? "dot" : "mmd"}`,
        source: template.code,
        format: template.kind === "graphviz" ? "graphviz" : "mermaid",
      },
    ]);
    setDialog(null);
  };

  useEffect(() => {
    if (entryRef.current === location.key) return;
    entryRef.current = location.key;
    const template = DIAGRAM_TEMPLATES.find(
      (t) => t.id === params.get("template"),
    );
    if (template) {
      selectTemplate(template);
      nav("/studio", { replace: true });
      return;
    }
    if (params.get("fresh")) {
      newFiles([{ name: "flowchart.mmd", format: "mermaid", source: BLANK }]);
      nav("/studio", { replace: true });
      return;
    }
    const legacy = location.state?.diagram;
    if (legacy?.code) {
      newFiles([
        {
          name: `${Exporter.sanitizeFilename(legacy.title)}.mmd`,
          format: "mermaid",
          source: legacy.code,
        },
      ]);
      nav("/studio", { replace: true });
    }
  }, [location.key]);
  useEffect(() => {
    setSelected(null);
  }, [document?.id]);
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timeout);
    }
  }, [toast]);
  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.toLowerCase(),
        modifier = e.metaKey || e.ctrlKey;
      if (modifier && key === "s") {
        e.preventDefault();
        say(
          saveStatus === "Saved locally"
            ? "Project saved in this browser"
            : saveStatus,
        );
      }
      if (modifier && key === "o") {
        e.preventDefault();
        fileRef.current?.click();
      }
      if (modifier && key === "i") {
        e.preventDefault();
        fileRef.current?.click();
      }
      if (modifier && e.shiftKey && key === "n") {
        e.preventDefault();
        openNewFile();
      }
      if (key === "?" && !e.target.closest("input,textarea,[contenteditable]"))
        setDialog("shortcuts");
    };
    const fullscreen = () => {
      if (!globalThis.document.fullscreenElement) setPresentation(false);
    };
    window.addEventListener("keydown", onKey);
    globalThis.document.addEventListener("fullscreenchange", fullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      globalThis.document.removeEventListener("fullscreenchange", fullscreen);
    };
  }, [saveStatus]);

  async function importFiles(files) {
    const accepted = [],
      failures = [];
    for (const file of Array.from(files || [])) {
      try {
        if (file.size > 30 * 1024 * 1024)
          throw new Error("Project or archive exceeds 30 MB.");
        if (file.name.toLowerCase().endsWith(".atlas")) {
          const imported = parseProject(await file.text());
          addProject({ ...imported, id: uid() });
          nav("/studio", { replace: true });
          say(`Opened ${imported.name}`);
        } else if (file.name.toLowerCase().endsWith(".zip")) {
          const { default: JSZip } = await import("jszip");
          const archive = await JSZip.loadAsync(await file.arrayBuffer());
          const backup = archive.file("project.atlas");
          if (backup) {
            const data = await backup.async("uint8array");
            if (data.length > 30 * 1024 * 1024)
              throw new Error("Expanded project backup exceeds 30 MB.");
            const imported = parseProject(new TextDecoder().decode(data));
            addProject({ ...imported, id: uid() });
            nav("/studio", { replace: true });
            say(`Restored ${imported.name}, including snapshots`);
            continue;
          }
          const entries = Object.values(archive.files).filter(
            (f) =>
              !f.dir &&
              !f.name.startsWith("__MACOSX/") &&
              !f.name.split("/").some((part) => part.startsWith(".")),
          );
          if (entries.length > 100)
            throw new Error("A workspace supports up to 100 files.");
          let total = 0;
          for (const entry of entries) {
            const data = await entry.async("uint8array");
            total += data.length;
            if (total > 30 * 1024 * 1024)
              throw new Error("Expanded archive exceeds 30 MB.");
            const input = new File([data], entry.name);
            try {
              accepted.push(await importDocument(input));
            } catch (e) {
              failures.push(`${entry.name}: ${e.message}`);
            }
          }
        } else accepted.push(await importDocument(file));
      } catch (e) {
        failures.push(`${file.name}: ${e.message}`);
      }
    }
    if (accepted.length) {
      if (project.documents.length + accepted.length > 100) {
        say("The project supports up to 100 files. Create another project.");
        return;
      }
      newFiles(accepted);
      say(`Opened ${accepted.length} file${accepted.length === 1 ? "" : "s"}`);
    }
    if (failures.length) {
      setName(failures.join("\n"));
      setDialog("import-errors");
    }
  }
  const download = (content, filename, type = "text/plain") =>
    Exporter.downloadBlob(new Blob([content], { type }), filename);
  const projectBackup = () => {
    download(
      serializeProject(project),
      `${Exporter.sanitizeFilename(project.name)}.atlas`,
      "application/json",
    );
    say("Project backup downloaded");
  };
  async function downloadZip() {
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      zip.file("project.atlas", serializeProject(project));
      for (const doc of project.documents) {
        const path = doc.name
          .split("/")
          .filter((part) => part && part !== "." && part !== "..")
          .join("/");
        zip.file(`sources/${path || `${doc.id}.txt`}`, doc.source);
        if (doc.original)
          zip.file(
            `originals/${doc.original.name.split("/").pop()}`,
            doc.original.base64,
            { base64: true },
          );
      }
      Exporter.downloadBlob(
        await zip.generateAsync({ type: "blob" }),
        `${Exporter.sanitizeFilename(project.name)}.zip`,
      );
    } catch (e) {
      say(e.message);
    }
  }
  async function doExport(kind) {
    if (!document) return;
    try {
      const title = document.name.replace(/\.[^.]+$/, "");
      if (kind === "source") {
        if (document.format === "xmind") {
          const { exportMermaidToXmindBlob } =
            await import("../utils/importers/xmind.js");
          Exporter.downloadBlob(
            await exportMermaidToXmindBlob(document.source, title),
            document.name,
          );
        } else download(document.source, document.name);
        return;
      }
      if (kind === "mermaid") {
        download(preview.code, `${title}.mmd`);
        return;
      }
      if (kind === "original" && document.original) {
        const bytes = Uint8Array.from(atob(document.original.base64), (c) =>
          c.charCodeAt(0),
        );
        Exporter.downloadBlob(new Blob([bytes]), document.original.name);
        return;
      }
      if (preview.error || preview.status.state !== "ok")
        throw new Error(
          "Resolve preview errors before exporting the current diagram.",
        );
      const el = preview.containerRef.current;
      if (!el?.querySelector("svg"))
        throw new Error(
          "Switch to Canvas or Split view before exporting an image.",
        );
      if (kind === "svg") Exporter.downloadSvg(el, title);
      else if (kind === "png")
        await Exporter.downloadPng(el, title, { scale: 2 });
      else if (kind === "png4")
        await Exporter.downloadPng(el, title, { scale: 4 });
      else if (kind === "pdf")
        await Exporter.downloadPdf(el, title, {
          pageSize: "fit",
          background: "#ffffff",
          padding: 32,
        });
      else if (kind === "html")
        Exporter.downloadStandaloneHtml(el, preview.code, title);
      else if (kind === "copy") await Exporter.copyMarkdown(preview.code);
      else if (kind === "xmind") {
        if (!/^\s*mindmap/m.test(preview.code))
          throw new Error("XMind export requires a mindmap.");
        const { exportMermaidToXmindBlob } =
          await import("../utils/importers/xmind.js");
        Exporter.downloadBlob(
          await exportMermaidToXmindBlob(preview.code, title),
          `${title}.xmind`,
        );
      }
      say("Export complete");
    } catch (e) {
      say(e.message || "Export failed");
    }
  }
  const snapshot = () => {
    if (!document) return;
    updateProject((p) => ({
      ...p,
      snapshots: [
        {
          id: uid(),
          documentId: document.id,
          name: document.name,
          format: document.format,
          source: document.source,
          createdAt: new Date().toISOString(),
        },
        ...p.snapshots,
      ].slice(0, 30),
    }));
    say("Version snapshot saved");
  };
  const closeTab = (id) =>
    updateProject((p) => {
      const openIds = p.openIds.filter((open) => open !== id);
      return {
        ...p,
        openIds,
        activeId:
          p.activeId === id ? openIds[openIds.length - 1] || null : p.activeId,
      };
    });
  const chooseNode = (node) => {
    setSelected(node);
    setLabel(node.label);
    setInspector(true);
    setInspectorTab("properties");
  };
  const nodeId = selected?.id?.match(/^flowchart-(.+)-\d+$/)?.[1];
  const startResize = (e) => {
    e.preventDefault();
    const grid = splitRef.current;
    const move = (event) => {
      const r = grid.getBoundingClientRect();
      grid.style.setProperty(
        "--editor-width",
        `${Math.max(25, Math.min(75, ((event.clientX - r.left) / r.width) * 100))}%`,
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  async function present() {
    setView("canvas");
    setExplorer(false);
    setInspector(false);
    setPresentation(true);
    try {
      await shellRef.current?.requestFullscreen();
    } catch {
      say("Presentation mode enabled. Press Escape or Exit to leave.");
    }
  }
  const sourceOutline = useMemo(
    () =>
      document?.source
        .split("\n")
        .map((line, index) => ({ line: index + 1, text: line.trim() }))
        .filter((x) =>
          /^(class |type |CREATE TABLE|resource |subgraph |participant |actor |section |# |\s*\w+\s*\{)/i.test(
            x.text,
          ),
        )
        .slice(0, 60) || [],
    [document?.source],
  );
  const fileList = project.documents.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()),
  );

  const explorerPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 items-center justify-between border-b px-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Project explorer
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="New file"
          onClick={() => openNewFile()}
        >
          <FilePlus />
        </Button>
      </div>
      <div className="border-b px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <FolderOpen className="size-4 text-primary" />
          <span className="truncate">{project.name}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {project.documents.length}
          </span>
        </div>
        <Input
          className="mt-3 h-7 text-xs"
          aria-label="Filter files"
          placeholder="Filter files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-auto py-1">
        {fileList.map((d) => (
          <button
            key={d.id}
            data-document-id={d.id}
            onClick={() => openDocument(d.id)}
            className={cn(
              "flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left text-xs",
              d.id === project.activeId
                ? "border-primary bg-primary/10 text-blue-200"
                : "border-transparent text-muted-foreground hover:bg-accent",
            )}
          >
            <FileCode2 className="size-3.5 shrink-0" />
            <span className="truncate">{d.name}</span>
          </button>
        ))}
        {!fileList.length && (
          <p className="px-3 py-5 text-xs text-muted-foreground">
            No matching files.
          </p>
        )}
      </div>
      <div className="grid gap-1 border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-xs"
          onClick={() => setDialog("templates")}
        >
          <Shapes />
          Browse templates
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-xs"
          onClick={() => setDialog("assistant")}
        >
          <Sparkles />
          Diagram assistant
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-xs"
          asChild
        >
          <Link to="/saved">
            <FolderOpen />
            All projects
          </Link>
        </Button>
      </div>
    </div>
  );

  const inspectorPanel = (
    <Tabs
      value={inspectorTab}
      onValueChange={setInspectorTab}
      className="flex h-full min-h-0 flex-col gap-0"
    >
      <TabsList className="h-10 w-full shrink-0 rounded-none border-b bg-card p-1">
        <TabsTrigger className="text-[11px]" value="properties">
          Inspector
        </TabsTrigger>
        <TabsTrigger className="text-[11px]" value="history">
          History
        </TabsTrigger>
        <TabsTrigger className="text-[11px]" value="outline">
          Outline
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="properties"
        className="m-0 flex-1 overflow-auto p-4 text-xs"
      >
        {document && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              File properties
            </p>
            <label
              className="mt-4 block text-muted-foreground"
              htmlFor="file-format"
            >
              Source format
            </label>
            <select
              id="file-format"
              aria-label="Source format"
              value={document.format}
              onChange={(e) =>
                updateProject((p) => ({
                  ...p,
                  documents: p.documents.map((d) =>
                    d.id === document.id ? { ...d, format: e.target.value } : d,
                  ),
                }))
              }
              className="mt-2 h-8 w-full rounded-md border bg-background px-2 text-xs"
            >
              {FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <p className="mt-3 leading-5 text-muted-foreground">
              {definition.description}
            </p>
            <div className="mt-3 flex gap-2">
              <Badge tone={definition.mode === "Native" ? "green" : "indigo"}>
                {definition.mode === "Native"
                  ? "Native renderer"
                  : "Derived preview"}
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-y py-3 text-muted-foreground">
              <span>
                Lines{" "}
                <strong className="block pt-1 text-foreground">
                  {document.source.split("\n").length}
                </strong>
              </span>
              <span>
                Characters{" "}
                <strong className="block pt-1 text-foreground">
                  {document.source.length.toLocaleString()}
                </strong>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full text-xs"
              onClick={() => {
                setName(document.name);
                setDialog("rename");
              }}
            >
              <Pencil />
              Rename file
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full text-xs"
              onClick={() => newFiles([{ ...document, name: document.name }])}
            >
              <Copy />
              Duplicate file
            </Button>
            {selected && (
              <div className="mt-5 border-t pt-4">
                <p className="font-medium">Selected element</p>
                <p className="mt-2 break-all text-muted-foreground">
                  {selected.label}
                </p>
                <Input
                  aria-label="Selected node label"
                  className="mt-3 h-8 text-xs"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  disabled={!isFlowchart(document) || !nodeId}
                  onClick={() => {
                    try {
                      updateSource(
                        document.id,
                        renameFlowchartNode(document.source, nodeId, label),
                      );
                      say("Node label updated");
                    } catch (e) {
                      say(e.message);
                    }
                  }}
                >
                  Apply label
                </Button>
              </div>
            )}
            {isFlowchart(document) && (
              <div className="mt-5 border-t pt-4">
                <p className="font-medium">Visual model tools</p>
                <Input
                  aria-label="New node label"
                  className="mt-3 h-8 text-xs"
                  placeholder="Node label"
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => {
                    try {
                      updateSource(
                        document.id,
                        addFlowchartNode(document.source, nodeLabel),
                      );
                      setNodeLabel("");
                    } catch (e) {
                      say(e.message);
                    }
                  }}
                >
                  Add node
                </Button>
                <div className="mt-4 grid gap-2">
                  {[
                    ["From", edgeFrom, setEdgeFrom],
                    ["To", edgeTo, setEdgeTo],
                  ].map(([text, value, set]) => (
                    <select
                      key={text}
                      aria-label={`Connection ${text.toLowerCase()}`}
                      className="h-8 w-full rounded-md border bg-background px-2"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                    >
                      <option value="">{text} node…</option>
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  ))}
                  <Input
                    aria-label="Connection label"
                    className="h-8 text-xs"
                    placeholder="Connection label (optional)"
                    value={edgeLabel}
                    onChange={(e) => setEdgeLabel(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      try {
                        updateSource(
                          document.id,
                          connectFlowchartNodes(
                            document.source,
                            edgeFrom,
                            edgeTo,
                            edgeLabel,
                          ),
                        );
                        setEdgeLabel("");
                      } catch (e) {
                        say(e.message);
                      }
                    }}
                  >
                    <GitBranch />
                    Connect nodes
                  </Button>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-6 w-full text-xs text-destructive"
              disabled={project.documents.length === 1}
              onClick={() => setDialog("delete-file")}
            >
              <Trash2 />
              Delete file
            </Button>
          </>
        )}
      </TabsContent>
      <TabsContent value="history" className="m-0 flex-1 overflow-auto p-3">
        <Button
          variant="outline"
          size="sm"
          className="mb-4 w-full text-xs"
          onClick={snapshot}
          disabled={!document}
        >
          <Save />
          Save snapshot
        </Button>
        {project.snapshots.length === 0 && (
          <p className="px-1 text-xs leading-5 text-muted-foreground">
            Keep checkpoints before making larger edits. Snapshots include the
            original source.
          </p>
        )}
        {project.snapshots.map((s) => (
          <div key={s.id} className="mb-2 rounded-md border p-3">
            <p className="truncate text-xs font-medium">{s.name}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(s.createdAt).toLocaleString()}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 h-6 text-xs"
              onClick={() => {
                const existing = project.documents.find(
                  (d) => d.id === s.documentId,
                );
                if (existing) {
                  updateSource(existing.id, s.source);
                  openDocument(existing.id);
                } else
                  newFiles([
                    { name: s.name, source: s.source, format: s.format },
                  ]);
                say("Snapshot restored");
              }}
            >
              Restore
            </Button>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="outline" className="m-0 flex-1 overflow-auto py-2">
        {sourceOutline.map((item) => (
          <button
            key={item.line}
            className="flex w-full gap-3 px-3 py-2 text-left text-[11px] hover:bg-accent"
            onClick={() => {
              setView("code");
              requestAnimationFrame(() => editorRef.current?.goTo(item.line));
            }}
          >
            <span className="w-5 shrink-0 text-muted-foreground">
              {item.line}
            </span>
            <span className="truncate">{item.text}</span>
          </button>
        ))}
        {!sourceOutline.length && (
          <p className="p-4 text-xs text-muted-foreground">
            No outline entries for this file.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <div
      ref={shellRef}
      className="workspace-shell flex flex-col bg-background"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          importFiles(e.dataTransfer.files);
        }
      }}
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={`${FILE_ACCEPT},.zip`}
        className="hidden"
        onChange={(e) => {
          importFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        webkitdirectory=""
        className="hidden"
        onChange={(e) => {
          importFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex h-11 shrink-0 items-center gap-1 border-b bg-card px-2 sm:px-3">
        <Menu label="File">
          <Item onSelect={() => openNewFile()} icon={FilePlus}>
            New file<DropdownMenuShortcut>⇧⌘N</DropdownMenuShortcut>
          </Item>
          <Item
            onSelect={() => {
              setName("Untitled project");
              setDialog("new-project");
            }}
            icon={FolderPlus}
          >
            New project
          </Item>
          <DropdownMenuSeparator />
          <Item onSelect={() => fileRef.current?.click()} icon={Upload}>
            Open files / project<DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </Item>
          <Item onSelect={() => folderRef.current?.click()} icon={FolderOpen}>
            Open folder
          </Item>
          <Item onSelect={() => setDialog("templates")} icon={Shapes}>
            Create from template
          </Item>
          <DropdownMenuSeparator />
          <Item onSelect={projectBackup} icon={Download}>
            Download project backup
          </Item>
          <Item onSelect={downloadZip} icon={Files}>
            Download all files as ZIP
          </Item>
          <Item
            onSelect={() => doExport("source")}
            icon={FileCode2}
            disabled={!document}
          >
            Download current source
          </Item>
        </Menu>
        <Menu label="Edit">
          <Item
            onSelect={() => editorRef.current?.undo()}
            icon={Undo2}
            disabled={view === "canvas"}
          >
            Undo<DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </Item>
          <Item
            onSelect={() => editorRef.current?.redo()}
            icon={Redo2}
            disabled={view === "canvas"}
          >
            Redo<DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
          </Item>
          <Item
            onSelect={() => editorRef.current?.search()}
            icon={Search}
            disabled={view === "canvas"}
          >
            Find in file<DropdownMenuShortcut>⌘F</DropdownMenuShortcut>
          </Item>
          <DropdownMenuSeparator />
          <Item
            onSelect={() =>
              updateSource(document.id, formatMermaidCode(document.source))
            }
            icon={Braces}
            disabled={!document || document.format !== "mermaid"}
          >
            Format Mermaid source
          </Item>
          <Item
            onSelect={() =>
              newFiles([
                {
                  name: "preview.mmd",
                  format: "mermaid",
                  source: preview.code,
                },
              ])
            }
            icon={Code2}
            disabled={
              !preview.code ||
              !!preview.error ||
              document?.format === "graphviz"
            }
          >
            Open preview as editable Mermaid
          </Item>
          <Item onSelect={snapshot} icon={History} disabled={!document}>
            Save version snapshot
          </Item>
        </Menu>
        <Menu label="View">
          <Item onSelect={() => setView("split")}>Split editor and canvas</Item>
          <Item onSelect={() => setView("code")}>Source editor</Item>
          <Item onSelect={() => setView("canvas")}>Canvas only</Item>
          <DropdownMenuSeparator />
          <Item onSelect={() => setExplorer(!explorer)} icon={PanelLeft}>
            Toggle explorer
          </Item>
          <Item onSelect={() => setInspector(!inspector)} icon={PanelRight}>
            Toggle inspector
          </Item>
          <Item onSelect={() => canvasRef.current?.fit()} icon={Maximize}>
            Fit diagram<DropdownMenuShortcut>F</DropdownMenuShortcut>
          </Item>
          <Item onSelect={present} icon={Play}>
            Presentation mode
          </Item>
        </Menu>
        <Menu label="Tools">
          <Item onSelect={() => setDialog("assistant")} icon={Sparkles}>
            Diagram assistant
          </Item>
          <Item onSelect={() => setDialog("shortcuts")}>
            Keyboard shortcuts
          </Item>
          <Item onSelect={() => nav("/formats")}>Format capabilities</Item>
        </Menu>
        <div className="mx-2 hidden h-4 border-l sm:block" />
        <Input
          aria-label="Project name"
          className="hidden h-7 max-w-64 border-transparent bg-transparent px-2 text-xs hover:border-border md:block"
          value={project.name}
          onChange={(e) => updateProject({ name: e.target.value })}
        />
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle explorer"
            onClick={() => setExplorer(!explorer)}
          >
            <PanelLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle inspector"
            onClick={() => setInspector(!inspector)}
          >
            <PanelRight />
          </Button>
          {presentation && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPresentation(false);
                globalThis.document.exitFullscreen?.();
              }}
            >
              Exit
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="text-xs" disabled={!document}>
                <Download />
                Export
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Current file</DropdownMenuLabel>
              <Item onSelect={() => doExport("source")}>
                Original format source
              </Item>
              {document?.original && (
                <Item onSelect={() => doExport("original")}>
                  Original imported workbook
                </Item>
              )}
              <Item
                onSelect={() => doExport("mermaid")}
                disabled={
                  !preview.code ||
                  !!preview.error ||
                  document?.format === "graphviz"
                }
              >
                Derived Mermaid source
              </Item>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Current preview</DropdownMenuLabel>
              {[
                ["svg", "SVG vector"],
                ["png", "PNG image · 2×"],
                ["png4", "PNG image · 4×"],
                ["pdf", "PDF document"],
                ["html", "Interactive HTML"],
                ["xmind", "XMind mindmap"],
                ["copy", "Copy Markdown"],
              ].map(([id, text]) => (
                <Item
                  key={id}
                  onSelect={() => doExport(id)}
                  disabled={!!preview.error || preview.status.state !== "ok"}
                >
                  {text}
                </Item>
              ))}
              <DropdownMenuSeparator />
              <Item onSelect={projectBackup}>Project backup (.atlas)</Item>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {explorer && (
          <aside className="hidden w-52 shrink-0 border-r bg-card lg:block">
            {explorerPanel}
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex h-10 shrink-0 items-center overflow-x-auto border-b bg-background"
            role="tablist"
            aria-label="Open documents"
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const ids = project.openIds;
              const current = ids.indexOf(project.activeId);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? ids.length - 1
                    : (current +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        ids.length) %
                      ids.length;
              if (ids[next]) {
                openDocument(ids[next]);
                requestAnimationFrame(() =>
                  globalThis.document
                    .querySelector('[role="tab"][aria-selected="true"]')
                    ?.focus(),
                );
              }
            }}
          >
            {project.openIds.map((id) => {
              const d = project.documents.find((doc) => doc.id === id);
              return (
                d && (
                  <div
                    key={id}
                    className={cn(
                      "flex h-full shrink-0 items-center border-r",
                      id === project.activeId ? "bg-card" : "bg-background",
                    )}
                  >
                    <button
                      role="tab"
                      tabIndex={id === project.activeId ? 0 : -1}
                      aria-controls="document-panel"
                      aria-selected={id === project.activeId}
                      className={cn(
                        "flex h-full items-center gap-2 border-t-2 pl-3 pr-2 text-xs",
                        id === project.activeId
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground",
                      )}
                      onClick={() => openDocument(id)}
                    >
                      <FileCode2 className="size-3.5" />
                      {d.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="mr-2"
                      aria-label={`Close ${d.name}`}
                      onClick={() => closeTab(id)}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                )
              );
            })}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Add file tab"
              className="mx-2 shrink-0"
              onClick={() => openNewFile()}
            >
              <FilePlus />
            </Button>
          </div>
          <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b bg-card px-3">
            <div className="flex min-w-0 items-center gap-2">
              <Code2 className="size-3.5 text-muted-foreground" />
              <span className="truncate text-[11px] text-muted-foreground">
                {document?.name || "No file selected"}
              </span>
              {document && <Badge>{definition.name}</Badge>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div
                className="flex rounded-md border p-0.5"
                aria-label="Editor layout"
              >
                {[
                  ["split", "Split"],
                  ["code", "Source"],
                  ["canvas", "Canvas"],
                ].map(([id, text]) => (
                  <button
                    key={id}
                    aria-pressed={view === id}
                    onClick={() => setView(id)}
                    className={cn(
                      "rounded px-2 py-1 text-[10px]",
                      view === id
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {text}
                  </button>
                ))}
              </div>
              <select
                aria-label="Diagram theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="hidden h-7 rounded border bg-background px-1 text-[10px] sm:block"
              >
                {["dark", "default", "forest", "neutral"].map((t) => (
                  <option key={t} value={t}>
                    {t === "default"
                      ? "Light"
                      : t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <GridToggle grid={grid} onChange={setGrid} />
            </div>
          </div>
          {document ? (
            <div
              ref={splitRef}
              id="document-panel"
              role="tabpanel"
              aria-label={document.name}
              className={cn(
                "workspace-panels min-h-0 flex-1 overflow-hidden",
                view === "canvas" && "canvas-only",
                view === "code" && "source-only",
              )}
            >
              {view !== "canvas" && (
                <div
                  className={cn(
                    "min-h-0 min-w-0 overflow-hidden bg-card",
                    view === "split" && "hidden lg:block",
                  )}
                >
                  <CodeEditor
                    ref={editorRef}
                    document={document}
                    onChange={updateSource}
                  />
                </div>
              )}
              {view === "split" && (
                <div
                  role="separator"
                  aria-label="Resize editor and canvas"
                  aria-orientation="vertical"
                  tabIndex={0}
                  onPointerDown={startResize}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                      e.preventDefault();
                      const value = parseFloat(
                        splitRef.current.style.getPropertyValue(
                          "--editor-width",
                        ) || "48",
                      );
                      splitRef.current.style.setProperty(
                        "--editor-width",
                        `${Math.max(25, Math.min(75, value + (e.key === "ArrowRight" ? 5 : -5)))}%`,
                      );
                    }
                  }}
                  className="hidden cursor-col-resize border-x bg-background hover:bg-primary/40 focus:bg-primary/40 lg:block"
                />
              )}
              {view !== "code" && (
                <div className="relative min-h-0 min-w-0 overflow-hidden">
                  <CanvasStage
                    ref={canvasRef}
                    containerRef={preview.containerRef}
                    status={preview.status}
                    documentId={document.id}
                    grid={grid}
                    onSelect={chooseNode}
                    presentation={presentation}
                  />
                  {preview.error && (
                    <div
                      role="alert"
                      className="absolute left-3 right-3 top-3 rounded-md border border-destructive/30 bg-card p-3 shadow-lg"
                    >
                      <p className="flex items-center gap-2 text-xs font-medium text-destructive">
                        <AlertCircle className="size-4" />
                        Preview needs attention
                      </p>
                      <p className="mt-2 max-h-24 overflow-auto text-xs leading-5 text-muted-foreground">
                        {preview.error}
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        The last valid preview for this file is retained.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <Files className="mx-auto size-10 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-medium">
                  Your workspace is ready
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open a file from the explorer or create a new diagram.
                </p>
                <Button className="mt-5" onClick={() => openNewFile()}>
                  <FilePlus />
                  New file
                </Button>
              </div>
            </div>
          )}
          <div className="max-h-32 shrink-0 overflow-auto border-t bg-card px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <AlertCircle className="size-3" />
              Problems & output
              <span className="ml-auto">
                {preview.error
                  ? "1 error"
                  : preview.warnings.length
                    ? `${preview.warnings.length} note`
                    : "No errors"}
              </span>
            </div>
            {preview.error ? (
              <p
                role="alert"
                className="mt-2 text-xs leading-5 text-destructive"
              >
                {preview.error}
              </p>
            ) : (
              preview.warnings.map((warning, i) => (
                <p
                  key={i}
                  className="mt-2 text-[11px] leading-5 text-muted-foreground"
                >
                  {warning}
                </p>
              ))
            )}
          </div>
        </div>
        {inspector && (
          <aside className="hidden w-64 shrink-0 border-l bg-card xl:block">
            {inspectorPanel}
          </aside>
        )}
      </div>
      <div className="flex h-7 shrink-0 items-center gap-3 border-t bg-card px-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              saveStatus.startsWith("Storage")
                ? "bg-rose-400"
                : "bg-emerald-400",
            )}
          />
          {saveStatus}
        </span>
        <span className="hidden sm:inline">
          {project.documents.length} files
        </span>
        <span className="ml-auto truncate">{preview.status.message}</span>
        <button
          className="hover:text-foreground"
          onClick={() => setDialog("shortcuts")}
        >
          Shortcuts
        </button>
      </div>
      <Dialog open={explorer && width < 1024} onOpenChange={setExplorer}>
        <DialogContent className="flex h-[70vh] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle>Project files</DialogTitle>
            <DialogDescription>
              Select a file to edit in your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">{explorerPanel}</div>
        </DialogContent>
      </Dialog>
      <Dialog open={inspector && width < 1280} onOpenChange={setInspector}>
        <DialogContent className="flex h-[75vh] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle>Inspector & history</DialogTitle>
            <DialogDescription>
              File settings, visual tools, and version checkpoints.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">{inspectorPanel}</div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[85vh] overflow-auto",
            dialog === "templates" && "sm:max-w-2xl",
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {
                {
                  "new-file": "Create a file",
                  "new-project": "Create a project",
                  rename: "Rename file",
                  templates: "Template library",
                  assistant: "Diagram assistant",
                  "delete-file": "Delete this file?",
                  "import-errors": "Some files could not be opened",
                  shortcuts: "Keyboard shortcuts",
                }[dialog]
              }
            </DialogTitle>
            <DialogDescription>
              {
                {
                  "new-file":
                    "Choose the source format. Each file stays editable in its original language.",
                  "new-project":
                    "A project groups related files, tabs, and snapshots in this browser.",
                  rename: "Change the filename without changing its contents.",
                  templates: "Add a diagram to your current project.",
                  assistant:
                    "Draft a new diagram from a description. Review the generated source before using it.",
                  "delete-file":
                    "This removes the file from this project. Existing version snapshots remain available.",
                  "import-errors":
                    "Successfully recognized files were opened. The following files need attention.",
                  shortcuts:
                    "Use the editor and canvas without leaving the keyboard.",
                }[dialog]
              }
            </DialogDescription>
          </DialogHeader>
          {["new-file", "new-project", "rename"].includes(dialog) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                if (dialog === "new-file") {
                  newFiles([{ ...createDocument(format, name.trim()) }]);
                } else if (dialog === "new-project") {
                  addProject(createProject(name.trim()));
                  nav("/studio", { replace: true });
                } else {
                  if (
                    project.documents.some(
                      (d) => d.id !== document.id && d.name === name.trim(),
                    )
                  ) {
                    say("A file already has that name.");
                    return;
                  }
                  updateProject((p) => ({
                    ...p,
                    documents: p.documents.map((d) =>
                      d.id === document.id ? { ...d, name: name.trim() } : d,
                    ),
                  }));
                }
                setDialog(null);
              }}
            >
              <label
                className="mb-2 block text-xs text-muted-foreground"
                htmlFor="new-name"
              >
                {dialog === "new-project" ? "Project name" : "File name"}
              </label>
              <Input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              {dialog === "new-file" && (
                <>
                  <label
                    className="mb-2 mt-4 block text-xs text-muted-foreground"
                    htmlFor="new-format"
                  >
                    Source format
                  </label>
                  <select
                    id="new-format"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value);
                      setName(`untitled.${getFormat(e.target.value).ext}`);
                    }}
                  >
                    {FORMATS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {getFormat(format).description}
                  </p>
                </>
              )}
              <DialogFooter className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {dialog === "rename" ? "Rename" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          )}
          {dialog === "templates" && (
            <>
              <Input
                aria-label="Search templates"
                placeholder="Search UML, ER, architecture…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="grid max-h-[50vh] gap-2 overflow-auto sm:grid-cols-2">
                {DIAGRAM_TEMPLATES.filter((t) =>
                  (t.title + t.kind + t.category)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className="rounded-md border bg-card p-3 text-left hover:border-primary"
                  >
                    <Badge>{t.kind}</Badge>
                    <p className="mt-2 text-xs font-medium">
                      {t.title.replace(/^\d+\. /, "")}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t.category}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
          {dialog === "assistant" && (
            <>
              <textarea
                aria-label="Diagram description"
                className="min-h-32 w-full rounded-md border bg-background p-3 text-sm"
                placeholder="Describe a system, process, database, or roadmap…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  aria-label="Assistant diagram type"
                  className="h-9 rounded border bg-background px-2 text-xs"
                  value={aiType}
                  onChange={(e) => setAiType(e.target.value)}
                >
                  {SUPPORTED_DIAGRAM_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label.replace(/^\S+\s/, "")}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Assistant engine"
                  className="h-9 rounded border bg-background px-2 text-xs"
                  value={aiMode}
                  onChange={(e) => setAiMode(e.target.value)}
                >
                  <option value="instant">Instant · rule-based</option>
                  <option value="qwen">Qwen · local WebGPU</option>
                </select>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {aiMode === "instant"
                  ? "Runs immediately using local rules. This is a starting draft, not a trained language model."
                  : "Downloads Qwen model weights on first use. Requires WebGPU; prompts run on your device."}
              </p>
              {assistant.progress && (
                <p role="status" className="text-xs text-primary">
                  {assistant.progress}
                </p>
              )}
              <Button
                disabled={assistant.busy || !prompt.trim()}
                onClick={async () => {
                  try {
                    const source = await assistant.generate(
                      prompt,
                      aiType,
                      aiMode,
                    );
                    if (!source)
                      throw new Error("No diagram source was generated.");
                    newFiles([
                      {
                        name: "assistant-draft.mmd",
                        format: "mermaid",
                        source,
                      },
                    ]);
                    setDialog(null);
                    say("Draft added as a new file");
                  } catch (e) {
                    say(e.message);
                  }
                }}
              >
                <Sparkles />
                {assistant.busy ? "Generating…" : "Generate new draft"}
              </Button>
            </>
          )}
          {dialog === "delete-file" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  updateProject((p) => {
                    const documents = p.documents.filter(
                      (d) => d.id !== document.id,
                    );
                    return {
                      ...p,
                      documents,
                      openIds: p.openIds.filter((id) => id !== document.id),
                      activeId: documents[0].id,
                    };
                  });
                  setDialog(null);
                }}
              >
                Delete file
              </Button>
            </DialogFooter>
          )}
          {dialog === "import-errors" && (
            <pre className="whitespace-pre-wrap rounded-md border bg-card p-3 text-xs leading-6 text-muted-foreground">
              {name}
            </pre>
          )}
          {dialog === "shortcuts" && (
            <div className="grid gap-2">
              {[
                ["Save locally", "⌘ / Ctrl + S"],
                ["Open files", "⌘ / Ctrl + O"],
                ["New file", "⌘ / Ctrl + Shift + N"],
                ["Search commands", "⌘ / Ctrl + K"],
                ["Find in source", "⌘ / Ctrl + F"],
                ["Undo / redo", "⌘Z / ⇧⌘Z"],
                ["Fit / center / reset", "F / C / 0"],
                ["Zoom", "+ / −"],
                ["Pan", "Drag / arrow keys"],
                ["Presentation laser", "Move pointer in presentation"],
              ].map(([action, key]) => (
                <div
                  key={action}
                  className="flex justify-between gap-4 border-b py-2 text-xs"
                >
                  <span className="text-muted-foreground">{action}</span>
                  <kbd className="text-right">{key}</kbd>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {toast && (
        <div
          role="status"
          className="fixed bottom-10 left-1/2 z-[100] max-w-[90vw] -translate-x-1/2 rounded-md border bg-popover px-4 py-3 text-xs shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
function Menu({ label, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function Item({ icon: Icon, children, ...props }) {
  return (
    <DropdownMenuItem className="text-xs" {...props}>
      {Icon && <Icon className="size-3.5" />}
      {children}
    </DropdownMenuItem>
  );
}
