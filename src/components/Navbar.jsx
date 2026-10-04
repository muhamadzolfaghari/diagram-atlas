import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Network, Menu, X, Code2, Search, ArrowUpRight } from "lucide-react";
import CommandPalette from "./CommandPalette.jsx";

const links = [
  { to: "/studio", label: "Studio" },
  { to: "/templates", label: "Templates" },
  { to: "/saved", label: "Projects" },
  { to: "/formats", label: "Formats & features" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const loc = useLocation();
  const isStudio = loc.pathname.startsWith("/studio");

  useEffect(() => {
    setOpen(false);
    setPalette(false);
  }, [loc]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((value) => !value);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
        className="skip-link"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background ">
        <div className="mx-auto flex h-14 max-w-none items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            aria-label="DiagramAtlas home"
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="brand-mark">
              <Network className="size-5" />
            </span>
            <span className="leading-none">
              <span className="block text-base font-bold tracking-tight text-white">
                Diagram<span className="text-blue-300">Atlas</span>
              </span>
              <span className="mt-1.5 block text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Diagram workspace
              </span>
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="ml-6 hidden items-center gap-1 lg:flex"
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-[13px] font-medium transition ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPalette(true)}
              className="btn-ghost !px-2.5 !py-2"
              aria-label="Search diagrams and commands"
              title="Search (⌘K / Ctrl+K)"
            >
              <Search className="size-4" />
              <span className="hidden xl:inline text-xs">Search</span>
              <kbd className="hidden sm:inline text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <a
              href="https://github.com/muhamadzolfaghari/diagram-atlas"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-md p-2 text-muted-foreground hover:text-white sm:block"
              aria-label="View GitHub repository"
            >
              <Code2 className="size-4" />
            </a>
            {!isStudio && (
              <div className="hidden sm:block">
                <Link to="/studio" className="btn-primary !py-2 !text-xs">
                  Open studio <ArrowUpRight className="size-4" />
                </Link>
              </div>
            )}
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="grid size-10 place-items-center rounded-md border border-border bg-white/5 lg:hidden"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-border px-4 py-3 lg:hidden"
          >
            <div className="grid gap-1">
              {[{ to: "/", label: "Home" }, ...links].map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end
                  className={({ isActive }) =>
                    `rounded-md px-3 py-3 text-sm ${isActive ? "bg-accent text-accent-foreground" : "text-slate-300 hover:bg-white/5"}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}
