import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, FilePlus, Shapes, X } from "lucide-react";
import { DIAGRAM_TEMPLATES } from "./templates.js";

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(0);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const nav = useNavigate();
  const results = useMemo(() => {
    const query = q.toLowerCase().trim();
    const base = [
      {
        title: "New diagram",
        desc: "Start with a blank flowchart",
        to: "/studio?fresh=1",
      },
      {
        title: "Open studio",
        desc: "Continue your latest draft",
        to: "/studio",
      },
      {
        title: "Browse templates",
        desc: `${DIAGRAM_TEMPLATES.length} diagrams, models, and charts`,
        to: "/templates",
      },
      {
        title: "Projects",
        desc: "Your project files and snapshots",
        to: "/saved",
      },
      {
        title: "Formats & features",
        desc: "Explore supported diagram types",
        to: "/formats",
      },
    ];
    const templates = DIAGRAM_TEMPLATES.filter(
      (t) =>
        !query ||
        `${t.title} ${t.kind} ${t.description} ${t.category} ${t.code}`
          .toLowerCase()
          .includes(query),
    )
      .slice(0, query ? 10 : 5)
      .map((t) => ({
        title: t.title,
        desc: `${t.kind} · ${t.category}`,
        to: `/studio?template=${t.id}`,
        template: true,
      }));
    return [
      ...base.filter(
        (a) => !query || `${a.title} ${a.desc}`.toLowerCase().includes(query),
      ),
      ...templates,
    ];
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSelected(0);
      dialogRef.current?.showModal();
      inputRef.current?.focus();
    } else dialogRef.current?.close();
  }, [open]);
  useEffect(() => {
    setSelected(0);
  }, [q]);
  useEffect(() => {
    dialogRef.current
      ?.querySelector(`[data-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const choose = (result) => {
    if (result) {
      nav(result.to);
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="command-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="command-dialog"
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setSelected((s) =>
            Math.max(
              0,
              Math.min(
                results.length - 1,
                s + (e.key === "ArrowDown" ? 1 : -1),
              ),
            ),
          );
        }
        if (e.key === "Enter" && e.target === inputRef.current) {
          e.preventDefault();
          choose(results[selected]);
        }
      }}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <Search className="size-5 shrink-0 text-primary" />
        <label id="command-title" htmlFor="command-search" className="sr-only">
          Search diagrams and commands
        </label>
        <input
          id="command-search"
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search diagrams and commands…"
          className="min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={onClose}
          aria-label="Close search"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="max-h-[55vh] overflow-auto p-2">
        {results.map((r, i) => (
          <button
            key={r.to}
            data-index={i}
            onClick={() => choose(r)}
            onMouseEnter={() => setSelected(i)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left ${selected === i ? "bg-accent" : "hover:bg-white/5"}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-primary">
              {r.template ? (
                <Shapes className="size-4" />
              ) : (
                <FilePlus className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                {r.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {r.desc}
              </span>
            </span>
            {selected === i && <ArrowRight className="size-4 text-primary" />}
          </button>
        ))}
        {results.length === 0 && (
          <div
            role="status"
            className="px-4 py-8 text-center text-sm text-muted-foreground"
          >
            No matches. Try UML, ER, or a chart type.
          </div>
        )}
      </div>
      <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
        ↑ ↓ navigate · Enter open · Esc close
      </div>
    </dialog>
  );
}
