import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Minus,
  Plus,
  Maximize,
  Crosshair,
  RotateCcw,
  Grid3X3,
  Map as MapIcon,
  MousePointer2,
} from "lucide-react";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "./ui.jsx";

const CanvasStage = forwardRef(function CanvasStage(
  {
    containerRef,
    grid = "dots",
    status,
    documentId,
    onSelect,
    presentation = false,
  },
  ref,
) {
  const stageRef = useRef(null),
    canvasRef = useRef(null),
    camera = useRef({ x: 30, y: 30, z: 1 }),
    shouldFit = useRef(true);
  const [position, setPosition] = useState(camera.current),
    [size, setSize] = useState({ w: 1000, h: 700 }),
    [thumbnail, setThumbnail] = useState(""),
    [minimap, setMinimap] = useState(true),
    [wheelMode, setWheelMode] = useState("zoom"),
    [laser, setLaser] = useState(null);
  const callbacks = useRef({ onSelect, presentation, wheelMode });
  callbacks.current = { onSelect, presentation, wheelMode };
  const dimensions = () => {
    const svg = containerRef.current?.querySelector("svg");
    const box = svg?.viewBox?.baseVal;
    return {
      w: box?.width || svg?.getBoundingClientRect().width || 1000,
      h: box?.height || svg?.getBoundingClientRect().height || 700,
    };
  };
  const apply = () => {
    if (canvasRef.current)
      canvasRef.current.style.transform = `translate3d(${camera.current.x}px,${camera.current.y}px,0) scale(${camera.current.z})`;
    setPosition({ ...camera.current });
  };
  const fit = () => {
    const s = stageRef.current;
    if (!s || !containerRef.current?.querySelector("svg")) return;
    const d = dimensions();
    setSize(d);
    const z = Math.max(
      0.04,
      Math.min(1.5, (s.clientWidth - 80) / d.w, (s.clientHeight - 100) / d.h),
    );
    camera.current = {
      x: (s.clientWidth - d.w * z) / 2,
      y: (s.clientHeight - d.h * z) / 2,
      z,
    };
    apply();
  };
  const center = () => {
    const s = stageRef.current;
    if (!s) return;
    const d = dimensions();
    camera.current.x = (s.clientWidth - d.w * camera.current.z) / 2;
    camera.current.y = (s.clientHeight - d.h * camera.current.z) / 2;
    apply();
  };
  const zoomBy = (factor, cx, cy) => {
    const s = stageRef.current;
    if (!s) return;
    const ax = cx ?? s.clientWidth / 2,
      ay = cy ?? s.clientHeight / 2;
    const old = camera.current;
    const z = Math.max(0.04, Math.min(6, old.z * factor));
    camera.current = {
      x: ax - ((ax - old.x) * z) / old.z,
      y: ay - ((ay - old.y) * z) / old.z,
      z,
    };
    apply();
  };
  const reset = () => {
    camera.current.z = 1;
    center();
  };
  useImperativeHandle(ref, () => ({
    fit,
    center,
    reset,
    zoomIn: () => zoomBy(1.25),
    zoomOut: () => zoomBy(0.8),
  }));
  useEffect(() => {
    shouldFit.current = true;
  }, [documentId]);
  useEffect(() => {
    if (status.state !== "ok") return;
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    setSize(dimensions());
    setThumbnail(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`,
    );
    if (shouldFit.current) {
      requestAnimationFrame(fit);
      shouldFit.current = false;
    }
  }, [status, documentId]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointers = new Map();
    let drag = null,
      pinch = null,
      moved = false;
    const down = (e) => {
      if (e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      stage.setPointerCapture(e.pointerId);
      moved = false;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) };
        drag = null;
      } else
        drag = {
          x: e.clientX,
          y: e.clientY,
          originX: camera.current.x,
          originY: camera.current.y,
        };
    };
    const move = (e) => {
      const rect = stage.getBoundingClientRect();
      if (callbacks.current.presentation)
        setLaser({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinch) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        zoomBy(
          distance / pinch.distance,
          (a.x + b.x) / 2 - rect.left,
          (a.y + b.y) / 2 - rect.top,
        );
        pinch.distance = distance;
        moved = true;
      } else if (drag) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4)
          moved = true;
        camera.current.x = drag.originX + e.clientX - drag.x;
        camera.current.y = drag.originY + e.clientY - drag.y;
        apply();
      }
    };
    const up = (e) => {
      if (!moved && !callbacks.current.presentation) {
        const node = globalThis.document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("g.node, g.entity, g.cluster, g.actor");
        if (node) {
          const label = node
            .querySelector(".nodeLabel, .label, text, title")
            ?.textContent?.trim();
          callbacks.current.onSelect?.({
            id: node.id,
            label: label || node.id,
          });
        }
      }
      pointers.delete(e.pointerId);
      drag = null;
      pinch = null;
    };
    const wheel = (e) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      if (
        e.ctrlKey ||
        e.metaKey ||
        (callbacks.current.wheelMode === "zoom" && Math.abs(e.deltaX) < 2)
      )
        zoomBy(
          Math.exp(-e.deltaY * 0.003),
          e.clientX - rect.left,
          e.clientY - rect.top,
        );
      else {
        camera.current.x -= e.shiftKey ? e.deltaY : e.deltaX;
        camera.current.y -= e.shiftKey ? 0 : e.deltaY;
        apply();
      }
    };
    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    stage.addEventListener("wheel", wheel, { passive: false });
    const keys = (e) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.target.closest(
          'input,textarea,select,button,[contenteditable], [role="dialog"]',
        )
      )
        return;
      const key = e.key.toLowerCase();
      if (
        [
          "f",
          "c",
          "0",
          "+",
          "=",
          "-",
          "arrowleft",
          "arrowright",
          "arrowup",
          "arrowdown",
        ].includes(key)
      )
        e.preventDefault();
      if (key === "f") fit();
      else if (key === "c") center();
      else if (key === "0") reset();
      else if (key === "+" || key === "=") zoomBy(1.25);
      else if (key === "-") zoomBy(0.8);
      else if (key.startsWith("arrow")) {
        const delta = e.shiftKey ? 100 : 30;
        camera.current.x +=
          key === "arrowleft" ? delta : key === "arrowright" ? -delta : 0;
        camera.current.y +=
          key === "arrowup" ? delta : key === "arrowdown" ? -delta : 0;
        apply();
      }
    };
    window.addEventListener("keydown", keys);
    const resize = new ResizeObserver(() => {
      if (shouldFit.current) fit();
    });
    resize.observe(stage);
    return () => {
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
      stage.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keys);
      resize.disconnect();
    };
  }, []);
  return (
    <div className="relative h-full min-h-[260px] w-full overflow-hidden bg-[#0c121c]">
      <div
        ref={stageRef}
        className={`studio-canvas absolute inset-0 ${grid === "dots" ? "dot-grid" : grid === "lines" ? "line-grid" : ""}`}
        style={{
          touchAction: "none",
          backgroundPosition: `${position.x}px ${position.y}px`,
        }}
        onPointerLeave={() => setLaser(null)}
      >
        <div
          ref={canvasRef}
          className="absolute left-0 top-0"
          style={{ transformOrigin: "0 0" }}
        >
          <div ref={containerRef} className="mermaid-stage" />
        </div>
      </div>
      {status.state === "rendering" && (
        <span className="absolute left-4 top-4 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          Building preview…
        </span>
      )}
      {presentation && laser && (
        <div
          className="pointer-events-none absolute z-20 size-3 rounded-full bg-rose-400 shadow-[0_0_15px_4px_#fb7185]"
          style={{ left: laser.x - 6, top: laser.y - 6 }}
        />
      )}
      {minimap && thumbnail && (
        <button
          aria-label="Minimap navigation"
          className="absolute bottom-16 right-3 hidden h-24 w-36 overflow-hidden rounded-md border bg-card p-2 md:block"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * size.w,
              y = ((e.clientY - r.top) / r.height) * size.h;
            camera.current.x =
              stageRef.current.clientWidth / 2 - x * camera.current.z;
            camera.current.y =
              stageRef.current.clientHeight / 2 - y * camera.current.z;
            apply();
          }}
        >
          <img
            src={thumbnail}
            alt="Diagram minimap"
            className="size-full object-contain opacity-80"
          />
          <span className="absolute bottom-1 right-1 rounded bg-background/80 px-1 text-[9px] text-muted-foreground">
            MINIMAP
          </span>
        </button>
      )}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-md border bg-card p-1 shadow-xl">
        <Tool title="Zoom out" onClick={() => zoomBy(0.8)}>
          <Minus />
        </Tool>
        <button
          aria-label="Reset zoom to 100%"
          onClick={reset}
          className="w-12 rounded px-1 py-2 text-[11px] text-muted-foreground"
        >
          {Math.round(position.z * 100)}%
        </button>
        <Tool title="Zoom in" onClick={() => zoomBy(1.25)}>
          <Plus />
        </Tool>
        <span className="mx-1 h-5 border-l" />
        <Tool title="Fit to view (F)" onClick={fit}>
          <Maximize />
        </Tool>
        <Tool title="Center (C)" onClick={center}>
          <Crosshair />
        </Tool>
        <Tool title="Reset view (0)" onClick={reset}>
          <RotateCcw />
        </Tool>
        <Tool title="Toggle minimap" onClick={() => setMinimap(!minimap)}>
          <MapIcon />
        </Tool>
        <Tool
          title={`Wheel mode: ${wheelMode}`}
          onClick={() => setWheelMode(wheelMode === "zoom" ? "pan" : "zoom")}
        >
          <MousePointer2 />
        </Tool>
      </div>
    </div>
  );
});
function Tool({ title, children, ...props }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={title} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}
export function GridToggle({ grid, onChange }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Grid: ${grid}`}
      onClick={() =>
        onChange(grid === "dots" ? "lines" : grid === "lines" ? "none" : "dots")
      }
    >
      <Grid3X3 className="size-4" />
      <span className="hidden lg:inline">{grid}</span>
    </Button>
  );
}
export default CanvasStage;
