import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  Network,
  Database,
  GitBranch,
  Calendar,
  Shapes,
  Layers,
  X,
} from "lucide-react";
import {
  SectionHeader,
  Badge,
  EmptyState,
  Button,
  Input,
} from "../components/ui.jsx";
import { DIAGRAM_TEMPLATES } from "../components/templates.js";
const icons = {
  er: Database,
  sequence: GitBranch,
  gantt: Calendar,
  class: Shapes,
  mindmap: GitBranch,
  flowchart: Network,
};
export default function Templates() {
  const [params, setParams] = useSearchParams(),
    q = params.get("q") || "",
    category = params.get("category") || "All";
  const categories = [
    "All",
    ...new Set(DIAGRAM_TEMPLATES.map((t) => t.category)),
  ];
  const setFilter = (key, value, replace = false) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value && value !== "All") next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace },
    );
  const list = useMemo(
    () =>
      DIAGRAM_TEMPLATES.filter(
        (t) =>
          (category === "All" || category === t.category) &&
          (!q ||
            `${t.title} ${t.kind} ${t.category} ${t.description} ${t.code}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [q, category],
  );
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <SectionHeader
        eyebrow="Start with a model"
        title="Template library"
        desc="Examples for systems, data, product planning, and all 14 UML categories. Each template opens as an editable file in your project."
        action={
          <Button variant="outline" asChild>
            <Link to="/studio">
              Open workspace <ArrowUpRight />
            </Link>
          </Button>
        }
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[210px_1fr]">
        <aside>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              aria-label="Search templates"
              className="pl-9"
              placeholder="Search templates…"
              value={q}
              onChange={(e) => setFilter("q", e.target.value, true)}
            />
          </div>
          <p className="mb-3 mt-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Collections
          </p>
          <div className="flex flex-wrap gap-1 lg:grid">
            {categories.map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                onClick={() => setFilter("category", c)}
                className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs ${category === c ? "bg-primary/10 text-blue-300" : "text-muted-foreground hover:bg-accent"}`}
              >
                <span>{c === "All" ? "All templates" : c}</span>
                <span className="text-[10px] opacity-70">
                  {c === "All"
                    ? DIAGRAM_TEMPLATES.length
                    : DIAGRAM_TEMPLATES.filter((t) => t.category === c).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-md border bg-card p-3 text-xs leading-5 text-muted-foreground">
            UML classes, sequences, and states use native Mermaid types. Other
            UML categories use adapted flowchart, class, or timeline templates.
          </div>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {list.length} templates{q && ` matching “${q}”`}
            </p>
            {(q || category !== "All") && (
              <Button variant="ghost" size="sm" onClick={() => setParams({})}>
                <X />
                Clear filters
              </Button>
            )}
          </div>
          {list.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((t) => {
                const Icon = icons[t.kind] || Layers;
                return (
                  <Link
                    key={t.id}
                    to={`/studio?template=${t.id}`}
                    className="group flex flex-col overflow-hidden rounded-lg border bg-card transition hover:border-primary/50"
                  >
                    <div className="relative flex h-28 items-center justify-center border-b bg-background/40">
                      <div className="dot-grid absolute inset-0 opacity-30" />
                      <Icon className="relative size-10 text-slate-500 group-hover:text-blue-300" />
                      <Badge className="absolute bottom-3 left-3" tone="indigo">
                        {t.kind}
                      </Badge>
                      <ArrowUpRight className="absolute right-3 top-3 size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h2 className="text-sm font-medium leading-5">
                        {t.title.replace(/^\d+\. /, "")}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                        {t.description}
                      </p>
                      <p className="mt-4 border-t pt-3 text-[10px] text-muted-foreground">
                        {t.category}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Search />}
              title="No matching templates"
              desc="Try a diagram type such as ER, sequence, or mindmap."
              action={
                <Button variant="outline" onClick={() => setParams({})}>
                  Clear filters
                </Button>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
