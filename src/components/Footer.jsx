import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-7 sm:px-8">
        <div>
          <p className="text-sm font-medium">DiagramAtlas</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open source diagram IDE · MIT licensed
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-5 text-xs text-muted-foreground"
        >
          <Link className="hover:text-foreground" to="/studio">
            Workspace
          </Link>
          <Link className="hover:text-foreground" to="/templates">
            Templates
          </Link>
          <Link className="hover:text-foreground" to="/formats">
            Format support
          </Link>
          <a
            className="hover:text-foreground"
            href="https://github.com/muhamadzolfaghari/diagram-atlas"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="hover:text-foreground"
            href="https://mermaid.js.org/intro/syntax-reference.html"
            target="_blank"
            rel="noreferrer"
          >
            Mermaid docs ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
