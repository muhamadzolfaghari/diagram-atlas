import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Upload,
  FolderOpen,
  MoreHorizontal,
  Download,
  Pencil,
  Trash2,
  ArrowUpRight,
  FileCode2,
  History,
  HardDrive,
} from "lucide-react";
import {
  SectionHeader,
  Button,
  Input,
  Badge,
  EmptyState,
  Stat,
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
} from "../components/ui.jsx";
import { useWorkspace } from "../hooks/useWorkspace.jsx";
import {
  createProject,
  parseProject,
  serializeProject,
  uid,
} from "../lib/workspace.js";
import { StorageManager } from "../components/storage.js";
import { Exporter } from "../components/exporter.js";
export default function Saved() {
  const { workspace, setWorkspace, addProject } = useWorkspace(),
    nav = useNavigate(),
    importRef = useRef(null);
  const [q, setQ] = useState(""),
    [dialog, setDialog] = useState(null),
    [selected, setSelected] = useState(null),
    [name, setName] = useState(""),
    [message, setMessage] = useState("");
  const list = workspace.projects
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const legacy = StorageManager.getSavedDiagrams();
  const backup = (project) =>
    Exporter.downloadBlob(
      new Blob([serializeProject(project)], { type: "application/json" }),
      `${Exporter.sanitizeFilename(project.name)}.atlas`,
    );
  const edit = (project, action) => {
    setSelected(project);
    setName(project.name);
    setDialog(action);
  };
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <SectionHeader
        eyebrow="Your local workspace"
        title="Projects"
        desc="Source files, diagrams, and checkpoints organized by project. Stored in this browser; download backups to move your work between devices."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => importRef.current?.click()}
            >
              <Upload />
              Import project
            </Button>
            <Button
              onClick={() => {
                setName("Untitled project");
                setDialog("create");
              }}
            >
              <Plus />
              New project
            </Button>
          </div>
        }
      />
      <input
        ref={importRef}
        type="file"
        accept=".atlas"
        className="hidden"
        onChange={async (e) => {
          try {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 30 * 1024 * 1024)
              throw new Error("Project backup exceeds 30 MB.");
            const project = parseProject(await file.text());
            addProject({ ...project, id: uid() });
            setMessage(`Imported ${project.name}`);
          } catch (error) {
            setMessage(error.message);
          } finally {
            e.target.value = "";
          }
        }}
      />
      <div className="mt-7 grid grid-cols-3 gap-3">
        <Stat label="Projects" value={workspace.projects.length} />
        <Stat
          label="Source files"
          value={workspace.projects.reduce((n, p) => n + p.documents.length, 0)}
        />
        <Stat
          label="Checkpoints"
          value={workspace.projects.reduce((n, p) => n + p.snapshots.length, 0)}
        />
      </div>
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search projects"
            className="pl-9"
            placeholder="Find a project…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <HardDrive className="size-3.5" />
          Browser storage
        </span>
      </div>
      {message && (
        <div
          role="status"
          className="mt-4 flex items-center justify-between gap-4 rounded-md border bg-card p-3 text-xs"
        >
          <span>{message}</span>
          <button onClick={() => setMessage("")}>Dismiss</button>
        </div>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <article key={p.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between">
              <FolderOpen className="size-6 text-blue-300" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${p.name}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => edit(p, "rename")}>
                    <Pencil />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => backup(p)}>
                    <Download />
                    Download backup
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={workspace.projects.length === 1}
                    onSelect={() => edit(p, "delete")}
                  >
                    <Trash2 />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Link
              to={`/studio?project=${p.id}`}
              className="mt-4 block truncate text-base font-medium hover:text-primary"
            >
              {p.name}
            </Link>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Updated {new Date(p.updatedAt).toLocaleString()}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...new Set(p.documents.map((d) => d.format))]
                .slice(0, 4)
                .map((f) => (
                  <Badge key={f}>{f}</Badge>
                ))}
            </div>
            <div className="mt-5 flex items-center gap-4 border-t pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileCode2 className="size-3.5" />
                {p.documents.length} files
              </span>
              <span className="flex items-center gap-1.5">
                <History className="size-3.5" />
                {p.snapshots.length} versions
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                asChild
              >
                <Link
                  aria-label={`Open ${p.name}`}
                  to={`/studio?project=${p.id}`}
                >
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="mt-5">
          <EmptyState
            icon={<Search />}
            title="No matching projects"
            desc="Try a different name, or create a new project."
          />
        </div>
      )}
      {legacy.length > 0 && (
        <section className="mt-10 border-t pt-7">
          <h2 className="text-lg font-medium">
            Saved diagrams from your previous studio
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Your existing diagrams remain available. Open one to add it to the
            current project.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {legacy.map((d) => (
              <button
                key={d.id}
                className="flex items-center justify-between rounded-md border bg-card p-4 text-left text-sm hover:border-primary"
                onClick={() => nav("/studio", { state: { diagram: d } })}
              >
                <span>{d.title}</span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      )}
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "create"
                ? "Create a project"
                : dialog === "rename"
                  ? "Rename project"
                  : "Delete project?"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "delete"
                ? `This removes ${selected?.name} and its files from this browser. Download a backup first if you need to keep it.`
                : "Give this collection of source files a clear, recognizable name."}
            </DialogDescription>
          </DialogHeader>
          {dialog === "delete" ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => backup(selected)}>
                Download backup
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setWorkspace((w) => {
                    const projects = w.projects.filter(
                      (p) => p.id !== selected.id,
                    );
                    return {
                      ...w,
                      projects,
                      activeProjectId:
                        w.activeProjectId === selected.id
                          ? projects[0].id
                          : w.activeProjectId,
                    };
                  });
                  setDialog(null);
                }}
              >
                Delete project
              </Button>
            </DialogFooter>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                if (dialog === "create") {
                  const p = createProject(name.trim());
                  addProject(p);
                  nav(`/studio?project=${p.id}`);
                } else
                  setWorkspace((w) => ({
                    ...w,
                    projects: w.projects.map((p) =>
                      p.id === selected.id
                        ? {
                            ...p,
                            name: name.trim(),
                            updatedAt: new Date().toISOString(),
                          }
                        : p,
                    ),
                  }));
                setDialog(null);
              }}
            >
              <label
                htmlFor="project-name"
                className="mb-2 block text-xs text-muted-foreground"
              >
                Project name
              </label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <DialogFooter className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {dialog === "create" ? "Create and open" : "Rename"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
