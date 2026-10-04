import { Link } from "react-router-dom";
import { ArrowRight, Network } from "lucide-react";
import { Button, Badge } from "../components/ui.jsx";
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      <div className="grid size-16 place-items-center rounded-xl border bg-card">
        <Network className="size-7 text-muted-foreground" />
      </div>
      <Badge className="mt-6">404 · Page not found</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        That page isn’t in this workspace.
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Return to your project or browse the template library to keep working.
      </p>
      <div className="mt-7 flex gap-3">
        <Button asChild>
          <Link to="/studio">
            Open workspace <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
