import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Network,
  Database,
  Code2,
  Files,
  GitBranch,
  Layers,
  Shield,
  FileCode2,
  Braces,
  CheckCircle2,
} from "lucide-react";
import { Button, Badge, Card, CardContent } from "../components/ui.jsx";
import { FORMATS } from "../lib/formats.js";
import { DIAGRAM_TEMPLATES } from "../components/templates.js";
import { useDocumentPreview } from "../hooks/useDocumentPreview.js";
const DEMOS = [
  {
    id: "architecture",
    title: "Architecture",
    file: "architecture.mmd",
    format: "mermaid",
    source:
      "flowchart LR\n  Web[Web client] --> API[API gateway]\n  API --> Orders[Order service]\n  Orders --> DB[(Database)]\n  Orders --> Queue[Event queue]",
  },
  {
    id: "data",
    title: "Database",
    file: "schema.sql",
    format: "sql",
    source:
      "CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name VARCHAR(100)\n);\nCREATE TABLE orders (\n  id INTEGER PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id)\n);",
  },
  {
    id: "uml",
    title: "UML sequence",
    file: "checkout.mmd",
    format: "mermaid",
    source:
      "sequenceDiagram\n  participant Client\n  participant API\n  participant Orders\n  Client->>API: Create order\n  API->>Orders: Validate inventory\n  Orders-->>API: Confirmed\n  API-->>Client: Order created",
  },
];
const features = [
  {
    icon: Files,
    title: "Work in projects",
    description:
      "Keep source files in a project, open multiple tabs, and return to your workspace with your drafts intact.",
  },
  {
    icon: Code2,
    title: "Edit the original source",
    description:
      "Write SQL, UML, API specs, DOT, and more with highlighting, search, completion, and undo.",
  },
  {
    icon: Network,
    title: "Model on the canvas",
    description:
      "Pan and zoom, navigate with a minimap, and edit flowchart nodes and connections alongside source.",
  },
  {
    icon: GitBranch,
    title: "Keep versions and deliver",
    description:
      "Create checkpoints, download project backups, and export diagrams for documentation and presentations.",
  },
];
export default function Landing() {
  const [demo, setDemo] = useState(0),
    document = DEMOS[demo];
  const preview = useDocumentPreview(document, "dark", "split");
  return (
    <div>
      <section className="border-b bg-card/30">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_.8fr]">
            <div>
              <Badge tone="indigo">
                <span className="size-1.5 rounded-full bg-primary" />
                Open source modeling workspace
              </Badge>
              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-.04em] sm:text-6xl">
                Your diagram IDE.
                <br />
                <span className="text-muted-foreground">
                  From source to system.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
                Build UML models, ER schemas, architecture, and charts in one
                browser workspace. Keep source files, live diagrams, and
                versions together.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/studio">
                    Open workspace <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/templates">
                    Explore templates <ArrowUpRight />
                  </Link>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="size-3.5" />
                  Local project storage
                </span>
                <span>No account required</span>
                <span>MIT licensed</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Network,
                  label: "UML & architecture",
                  detail: "Structure, behavior, interactions",
                  query: "UML",
                },
                {
                  icon: Database,
                  label: "Entity relationships",
                  detail: "Tables, keys, and data models",
                  query: "erDiagram",
                },
                {
                  icon: Layers,
                  label: "Charts & planning",
                  detail: "Gantt, timelines, and data charts",
                  query: "Product & Design",
                },
                {
                  icon: GitBranch,
                  label: "Flows & mindmaps",
                  detail: "Processes and connected ideas",
                  query: "mindmap",
                },
              ].map((f) => (
                <Link
                  key={f.label}
                  to={`/templates?q=${encodeURIComponent(f.query)}`}
                  className="group rounded-lg border bg-card p-5 transition hover:border-primary/50"
                >
                  <div className="flex justify-between">
                    <f.icon className="size-6 text-blue-300" />
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <h2 className="mt-5 text-sm font-medium">{f.label}</h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {f.detail}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">
              The working environment
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              A project, not a single preview.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore source and diagrams side by side, then continue in the
              full workspace.
            </p>
          </div>
          <div className="flex gap-1 rounded-md border bg-card p-1">
            {DEMOS.map((d, i) => (
              <button
                key={d.id}
                aria-pressed={demo === i}
                onClick={() => setDemo(i)}
                className={`rounded px-3 py-2 text-xs ${demo === i ? "bg-accent text-foreground" : "text-muted-foreground"}`}
              >
                {d.title}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card shadow-2xl shadow-black/15">
          <div className="flex h-11 items-center gap-3 border-b px-4">
            <span className="flex gap-1.5">
              <i className="size-2 rounded-full bg-slate-500" />
              <i className="size-2 rounded-full bg-slate-600" />
              <i className="size-2 rounded-full bg-slate-700" />
            </span>
            <FileCode2 className="size-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              {document.file}
            </span>
            <Badge className="ml-auto">Live preview</Badge>
          </div>
          <div className="grid min-h-[340px] md:grid-cols-[.75fr_1fr]">
            <pre className="max-h-[380px] overflow-auto border-b bg-background/40 p-6 font-mono text-xs leading-6 text-slate-300 md:border-r md:border-b-0">
              {document.source}
            </pre>
            <div className="marketing-diagram dot-grid grid min-h-[300px] items-center overflow-hidden p-6">
              <div
                ref={preview.containerRef}
                className="mermaid-stage w-full"
              />
              {preview.error && (
                <p className="text-xs text-destructive">{preview.error}</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-400" />
              {preview.status.message}
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link
                to={`/studio?template=${demo === 1 ? "er-diagram" : demo === 2 ? "sequence-auth" : "service-architecture"}`}
              >
                Edit a full example <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title} className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <f.icon className="size-5 text-blue-300" />
              <h3 className="mt-4 text-sm font-medium">{f.title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {f.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="border-y bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-5 py-10 sm:px-8">
          <div>
            <h2 className="text-xl font-semibold">
              Bring the formats you already use.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Native Mermaid and Graphviz rendering, plus editable source-backed
              previews for SQL, PlantUML, API specifications, XML formats, and
              more.
            </p>
            <Button variant="link" className="mt-3 px-0" asChild>
              <Link to="/formats">
                See support and conversion limits <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center sm:gap-10">
            <div>
              <p className="text-3xl font-semibold">{FORMATS.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Source formats
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold">
                {DIAGRAM_TEMPLATES.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Starter templates
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold">14</p>
              <p className="mt-1 text-xs text-muted-foreground">
                UML categories
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border bg-card p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Start with the system you’re building.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a template, open your source files, or create a new
              project.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to="/studio">
              Open DiagramAtlas <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
