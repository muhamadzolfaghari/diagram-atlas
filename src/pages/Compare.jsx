import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Code2,
  Shield,
  Files,
} from "lucide-react";
import {
  SectionHeader,
  Badge,
  Button,
  Input,
  Card,
  CardContent,
} from "../components/ui.jsx";
import { FORMATS } from "../lib/formats.js";
export default function Compare() {
  const [q, setQ] = useState(""),
    [family, setFamily] = useState("All");
  const list = useMemo(
    () =>
      FORMATS.filter(
        (f) =>
          (family === "All" || f.family === family) &&
          `${f.name} ${f.description} ${f.extensions.join(" ")}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [q, family],
  );
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <SectionHeader
        eyebrow="Format capabilities"
        title="One workspace. Many source languages."
        desc="Every supported source remains editable. Native renderers and derived previews have different capabilities; choose the format that fits your model."
        action={
          <Button asChild>
            <Link to="/studio">
              Open workspace <ArrowUpRight />
            </Link>
          </Button>
        }
      />
      <div className="mt-7 grid gap-3 md:grid-cols-3">
        {[
          {
            icon: Code2,
            title: "Native rendering",
            body: "Mermaid and Graphviz render directly. Their source is the model.",
          },
          {
            icon: Files,
            title: "Source-backed previews",
            body: "Other languages derive a Mermaid view while retaining the original source for editing and download.",
          },
          {
            icon: Shield,
            title: "Honest format support",
            body: "Conversions are intentionally limited. Vendor layout, macros, styling, and semantics may not survive the preview.",
          },
        ].map((f) => (
          <Card key={f.title} className="py-0 shadow-none">
            <CardContent className="p-5">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-sm font-medium">{f.title}</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {f.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search formats"
            className="pl-9"
            placeholder="Search format, extension, or capability…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          aria-label="Format family"
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          {["All", ...new Set(FORMATS.map((f) => f.family))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <caption className="sr-only">
              Supported formats and conversion limits
            </caption>
            <thead className="border-b bg-card text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Format</th>
                <th className="px-4 py-3 font-medium">Editing & preview</th>
                <th className="px-4 py-3 font-medium">Supported scope</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr
                  key={f.id}
                  className="border-b last:border-0 hover:bg-card/70"
                >
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium">{f.name}</p>
                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                      {f.extensions.length
                        ? f.extensions.map((ext) => `.${ext}`).join(" · ")
                        : ".json · .yaml · .yml"}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge tone={f.mode === "Native" ? "green" : "indigo"}>
                      {f.mode === "Native"
                        ? "Native"
                        : f.mode === "Mindmap"
                          ? "Editable mindmap"
                          : "Derived preview"}
                    </Badge>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {f.family}
                    </p>
                  </td>
                  <td className="max-w-md px-4 py-4 align-top leading-5 text-muted-foreground">
                    {f.description}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="size-3.5" />
                      Preserved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No matching formats.
          </p>
        )}
      </div>
      <div className="mt-6 flex gap-3 rounded-lg border bg-card p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <h2 className="text-sm font-medium">
            Import, edit, model, and export
          </h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Open multiple files, folders, ZIP archives, or DiagramAtlas project
            backups. Edit source with a live preview, keep version snapshots,
            and export source, SVG, PNG, PDF, interactive HTML, or XMind
            mindmaps. PDF export currently embeds a raster image. The studio is
            a local modeling environment; it does not execute imported code or
            provide shared cloud editing.
          </p>
        </div>
      </div>
    </div>
  );
}
