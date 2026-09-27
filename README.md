# NodeFlow — Universal Visual Diagram & Mindmap Studio ⚡✨

> **Live Application**: [https://muhamadzolfaghari.github.io/mermaid-studio/](https://muhamadzolfaghari.github.io/mermaid-studio/)  
> *(Hosted on GitHub Pages • 100% Free, Client-Side, and Zero-Telemetry)*

A free, universal, browser-based visual diagramming and mindmapping studio. Built as a high-performance, privacy-first alternative to expensive SaaS platforms ($60–$240+/year), **NodeFlow** brings CAD-grade canvas controls, local in-browser AI generation (WebGPU Qwen2.5-Coder), and universal importers for **XMind**, **Draw.io**, **PlantUML**, **D2 Lang**, **SQL DDL**, **OpenAPI**, and **Mermaid**.

![NodeFlow Preview](./public/favicon.svg)

---

## 💰 Expensive Formats & Paid Software Breakdown

Many industry diagram tools lock essential export capabilities, format conversions, and advanced editors behind high annual paywalls. **NodeFlow eliminates these paywalls entirely** by providing 100% client-side, zero-cost support:

| Format & Extension | Expensive Industry Tool | SaaS Subscription Cost | Features Locked Behind Paywall | ⚡ NodeFlow Free Engine (100% Free / MIT) |
| :--- | :--- | :--- | :--- | :--- |
| **`.xmind`** | **XMind Pro / MindManager** | **$59.99 – $179 / yr** | Pitch presentation mode, vector PDF export, theme customization, multi-sheet workbooks | **✓ 100% Free**: Bi-directional `.xmind` parser & exporter (XMind ZEN JSON & XMind 8 XML) with zero paywall. |
| **`.drawio` / `mxGraph`** | **Lucidchart / Visio Plan 2** | **$95.40 – $240 / yr** | Shape caps (60 max), high-res export, revision history, team permission paywalls | **✓ 100% Free**: Direct Draw.io XML conversion to Mermaid flowcharts, 4K Retina PNG, and Vector PDF. |
| **`.puml` / `.plantuml`** | **PlantText Cloud / Confluence Plugin** | **$36 – $120 / yr** | Cloud render rate limits, server hosting fees, commercial team licenses | **✓ 100% Free**: Client-side sequence, class, and state diagram conversion with zero external server calls. |
| **`.d2`** | **Terrastruct D2 Studio** | **$144 – $240 / yr** | TALA layout engine, cloud collaboration, visual editing suite | **✓ 100% Free**: Built-in D2 architecture syntax to Mermaid converter running instantly in your browser. |
| **`.sql` (DDL)** | **dbdiagram.io Pro / DataGrip** | **$108 – $229 / yr** | Unlimited ER schemas, PDF/SVG vector export, relationship visualizer | **✓ 100% Free**: Direct SQL `CREATE TABLE` DDL parser to Mermaid `erDiagram` with foreign-key relationships. |
| **`.json` (OpenAPI/Swagger)**| **SwaggerHub / Postman Pro** | **$168 – $360 / yr** | Visual interactive sequences, API architecture diagrams, endpoint mockups | **✓ 100% Free**: Automatic OpenAPI REST JSON endpoint parser to interactive sequence flows. |
| **`.dot` / `.gv`** | **Graphviz Commercial Tools** | **$49 – $99 / yr** | Modern interactive UI, CAD pan/zoom canvas, responsive web embedding | **✓ 100% Free**: Graphviz DOT digraph to Mermaid flowchart converter with CAD canvas navigation. |
| **Markdown / Outlines** | **Whimsical / Miro Pro** | **$96 – $120 / yr** | Board caps, AI diagramming credits, high-resolution vector exports | **✓ 100% Free**: Indented outline to Mindmap/Flowchart converter + Dual WebGPU local AI generator. |

---

## 🌟 Key Features

- **Universal Multi-Format Importer (100% Free & Offline)**:
  - **XMind (.xmind) Bi-Directional**: Reads and generates native `.xmind` files in-browser. Converts XMind ZEN and legacy XMind 8 into Mermaid Mindmaps, and exports mindmaps back to native `.xmind` workbooks.
  - **Draw.io (.drawio / XML)**: Converts `mxGraphModel` XML cells, vertices, and edges into Mermaid flowcharts.
  - **PlantUML (.puml)**: Converts `@startuml` sequence, class, and state diagrams into Mermaid syntax in 1 click.
  - **D2 Lang (.d2)**: Translates declarative D2 architecture code into clean Mermaid flowcharts.
  - **SQL DDL to ER Diagram**: Parses SQL `CREATE TABLE` statements and foreign keys into Mermaid `erDiagram`.
  - **OpenAPI / Swagger JSON**: Generates clean architectural sequence diagrams from REST API endpoints.
  - **Markdown Outlines & OPML**: Transforms indented bullet lists into hierarchical Mindmaps or Flowcharts.
  - **CSV / Tabular Data**: Converts CSV data rows into Flowchart relationship graphs or ER schemas.
  - **Drag-and-Drop Everywhere**: Drop `.xmind`, `.drawio`, `.puml`, `.d2`, `.sql`, or `.mmd` files directly onto the editor or canvas.
- **Dual In-Browser AI Diagram Assistant**:
  - **Instant Heuristic Engine**: 0 MB download, runs instantly anywhere with natural language prompts.
  - **Local Qwen2.5-Coder (0.5B) LLM**: 100% private, executes in your browser via WebGPU and WebAssembly. No API keys or paid subscriptions required!
- **CAD / Figma-Style Interactive Canvas**:
  - Smooth panning with velocity tracking and kinetic momentum release.
  - Cursor-centered wheel zooming and 2-finger trackpad panning / pinch-to-zoom.
  - 1-click **Fit to View** (`F`), **Recenter** (`C`), and **100% Reset** (`0`).
  - Interactive live **Minimap navigation** and laser pointer for presentations.
  - Wheel mode toggle: switch mouse wheel between **Zoom** and **Pan**.
  - Immersive **Full Screen** mode (`Shift + F` or `F11`).
  - Radial dot grid, line grid, or clean blank canvas backgrounds.
- **Pro Export Studio & Embeds**:
  - **Clean Vector SVG**: Scalable vector graphics with accurate bounding boxes.
  - **High-DPI PNG (2x & 4x Retina)**: Crisp, high-resolution rasterization.
  - **Vector PDF Export**: Single-click PDF export with sharp typography and zero blur.
  - **XMind (.xmind) Export**: Download diagrams as true native XMind workbooks for XMind 2024 / mobile.
  - **Standalone Interactive HTML**: Self-contained single-file HTML bundle with embedded pan/zoom controls.
  - **Presentation Mode**: Distraction-free meeting mode with laser pointer (`L`).
- **Resilient Live Code Editor**:
  - Split-view editor with draggable splitter and responsive mobile tabs.
  - Monospaced editor with synchronized line numbers and 2-space tab indentation.
  - **Non-destructive syntax error handling**: When diagram code has an error, a floating banner details the error while **keeping the previous valid diagram on canvas** (no blank screens or flashing).
  - Revision snapshots and version history (`v0.1`, `v0.2`, etc.).
- **100% Free & Private**:
  - No account, login, backend server, or paid APIs required.
  - All diagram parsing, AI generation, and exports happen 100% client-side inside your browser.

---

## 📊 Platform Capabilities Matrix

| Feature / Capability | ⚡ **NodeFlow** | **Mermaid Live Editor** | **XMind Pro** | **Lucidchart / Visio** | **Eraser.io / Miro** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pricing Model** | **100% Free / MIT** | Free / Open Source | $59.99 / yr | $95 – $240 / yr | Freemium ($120/yr) |
| **Account Required** | **None (Instant Access)** | None | Yes | Yes | Yes |
| **XMind (.xmind) Bi-directional** | **✓ Full Import & Export** | ✗ No | Native app only | ✗ No | ✗ No |
| **Draw.io (.drawio XML) Import** | **✓ Built-in** | ✗ No | ✗ No | Import only | ✗ No |
| **PlantUML & D2 Converters** | **✓ Built-in** | ✗ No | ✗ No | ✗ No | ✗ No |
| **SQL DDL to ER Diagram** | **✓ Built-in** | ✗ No | ✗ No | Paid Add-on | Paid Tier |
| **Local In-Browser AI** | **✓ Dual (Instant + Qwen LLM)** | ✗ None | Cloud AI (Paid) | Cloud AI (Paid) | Cloud AI (Paid) |
| **CAD Canvas Controls** | **✓ Kinetic Pan, Minimap, Pinch** | ✗ Basic CSS zoom | Proprietary map | Good | Good |
| **Vector PDF & 4K PNG Export** | **✓ Yes (Print-Ready)** | ✗ No | Paid Tier Only | Paid Tier Only | Paid Tier Only |
| **Interactive Standalone HTML** | **✓ Yes (Self-Contained)** | ✗ No | ✗ No | ✗ No | ✗ No |
| **Presentation Mode + Laser** | **✓ Yes** | ✗ No | Pitch Mode (Paid) | Paid Presenter | Good |
| **Data Privacy** | **100% Client-Side / Offline** | Client-Side | Local app | Hosted Cloud | Hosted Cloud |

---

## ⌨️ Keyboard Shortcuts & Canvas Controls

| Action | Shortcut / Control | Description |
| :--- | :--- | :--- |
| **Pan Canvas** | **Drag** or **Arrow Keys** | Smooth panning with kinetic momentum physics |
| **Fast Pan** | `Shift` + **Arrow Keys** | Large step panning across expansive diagrams |
| **Trackpad Pan** | **2-Finger Scroll** | Multi-directional trackpad pan |
| **Zoom In / Out** | `+` / `−` keys or HUD buttons | Step zoom centered on canvas |
| **Cursor Zoom** | **Mouse Wheel** or **Pinch** | Zoom centered precisely at the cursor location |
| **Fit to View** | `F` key or **Fit** button | Scale and center the diagram within the viewport |
| **Recenter** | `C` key or **Center** button | Center canvas without changing current zoom level |
| **Reset 100%** | `0` key or **100%** button | Reset zoom scale to 1:1 |
| **Wheel Mode** | **Wheel: Zoom / Pan** button | Toggle mouse wheel behavior between zooming and panning |
| **Full Screen** | `Shift + F` or `F11` | Expand workspace to full screen |
| **Save Diagram** | `Ctrl + S` / `Cmd + S` | Save current diagram to browser library |
| **Open File / Importer** | `Ctrl + O` / `Cmd + O` or `Ctrl + I` | Open universal importer or local file |
| **Indent / Dedent** | `Tab` / `Shift + Tab` | Indent or unindent 2 spaces in the editor |
| **Shortcuts Help** | `?` key or ⌨️ button | Open keyboard shortcuts dialog |

---

## 🛠️ Local Development & Build

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/muhamadzolfaghari/mermaid-studio.git
cd mermaid-studio

# Install dependencies
npm install
```

### Run Locally (Dev Server)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Verification Suite (42 Unit Tests)
```bash
npm test
```

### Build for Production
```bash
npm run build
```
The compiled static assets are generated in `dist/` with base path `/mermaid-studio/`.

---

## 📄 License
MIT License. Free to use, adapt, and share.
