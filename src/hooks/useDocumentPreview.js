import { useEffect, useRef, useState } from "react";
import { compileDocument } from "../lib/formats.js";
import { initMermaid, renderMermaid } from "../utils/mermaid-renderer.js";
export function useDocumentPreview(document, theme, view) {
  const containerRef = useRef(null);
  const seq = useRef(0),
    cache = useRef(new Map());
  const [result, setResult] = useState({
    code: "",
    warnings: [],
    error: "",
    status: { state: "idle", message: "Ready", ms: 0 },
  });
  useEffect(() => {
    const my = ++seq.current;
    const previous = cache.current.get(document?.id);
    if (containerRef.current)
      containerRef.current.innerHTML = previous?.svg || "";
    setResult((r) => ({
      ...r,
      error: "",
      status: { state: "rendering", message: "Building preview…", ms: 0 },
    }));
    const timer = setTimeout(async () => {
      if (!document || !document.source.trim()) {
        setResult({
          code: "",
          warnings: [],
          error: "",
          status: { state: "idle", message: "Empty file", ms: 0 },
        });
        return;
      }
      const start = performance.now();
      try {
        const compiled = await compileDocument(document);
        if (my !== seq.current) return;
        if (view === "code") {
          setResult({
            ...compiled,
            error: "",
            status: { state: "ok", message: "Source ready", ms: 0 },
          });
          return;
        }
        initMermaid(theme);
        const stage = globalThis.document.createElement("div");
        const rendered = await renderMermaid(stage, compiled.code);
        if (my !== seq.current || rendered.aborted) return;
        if (!rendered.success)
          throw new Error(rendered.error || "Preview could not be rendered.");
        cache.current.set(document.id, {
          svg: stage.innerHTML,
          code: compiled.code,
        });
        if (containerRef.current)
          containerRef.current.innerHTML = stage.innerHTML;
        const ms = Math.round(performance.now() - start);
        setResult({
          ...compiled,
          error: "",
          status: { state: "ok", message: `Preview ready · ${ms}ms`, ms },
        });
      } catch (e) {
        if (my !== seq.current) return;
        setResult({
          code: previous?.code || "",
          warnings: [],
          error: e.message,
          status: { state: "error", message: "Check source", ms: 0 },
        });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      seq.current++;
    };
  }, [document?.id, document?.source, document?.format, theme, view]);
  return { ...result, containerRef };
}
