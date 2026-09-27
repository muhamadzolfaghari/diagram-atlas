# Mermaid Studio 🧜‍♀️✨

> **Live Application**: [https://muhamadzolfaghari.github.io/mermaid-studio/](https://muhamadzolfaghari.github.io/mermaid-studio/)

A free, responsive, browser-based [Mermaid](https://mermaid.js.org/) diagram editor inspired by CAD and Figma canvas workflows. Built with modern web standards, featuring kinetic panning, pinch-to-zoom, starter templates, resilient live rendering, and high-DPI export capabilities.

![Mermaid Studio Preview](./public/favicon.svg)

---

## 🌟 Key Features

- **High-Converting SEO Landing Page**:
  - Live interactive diagram playground right on the homepage.
  - Comprehensive feature deep-dives and developer workflow guides.
  - Interactive FAQ accordion indexed with Google JSON-LD schema for rich search snippets.
  - Complete competitive comparison matrix against legacy and cloud diagramming tools.
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
  - **Standalone Interactive HTML**: Self-contained single-file HTML bundle with embedded pan/zoom controls.
  - **Presentation Mode**: Distraction-free meeting mode with laser pointer (`L`).
  - **Direct .mmd Import / Export**: Open local `.mmd` or `.txt` files via file picker or drag-and-drop.
- **Resilient Live Code Editor**:
  - Split-view editor with draggable splitter and responsive mobile tabs.
  - Monospaced editor with synchronized line numbers and 2-space tab indentation.
  - **Non-destructive syntax error handling**: When Mermaid code has an error, a floating banner details the error while **keeping the previous valid diagram on canvas** (no blank screens or flashing).
  - Revision snapshots and version history (`v0.1`, `v0.2`, etc.).
- **100% Free & Private**:
  - No account, login, backend server, or paid APIs required.
  - All diagram parsing, AI generation, and exports happen 100% client-side inside your browser.

---

## 📊 Competitive Comparison

| Feature / Capability | 🧜‍♀️ **Mermaid Studio** | **Mermaid Live Editor** | **Mermaid Chart** | **Eraser.io** |
| :--- | :--- | :--- | :--- | :--- |
| **Pricing** | **100% Free / MIT** | Free / Open Source | $8 - $12 / mo | Freemium ($10/mo) |
| **Account Required** | **None (Instant Access)** | None | Yes | Yes |
| **Local In-Browser AI** | **✓ Dual (Instant + Qwen LLM)** | ✗ None | Cloud AI (Paid) | Cloud AI (Paid) |
| **CAD Canvas Controls** | **✓ Kinetic Pan, Minimap, Pinch** | ✗ Basic CSS zoom | Limited | ✓ Good |
| **Vector PDF Export** | **✓ Yes (Built-in)** | ✗ No | Paid Tier Only | Paid Tier Only |
| **Interactive Standalone HTML** | **✓ Yes (Self-Contained)** | ✗ No | ✗ No | ✗ No |
| **Presentation Mode + Laser** | **✓ Yes** | ✗ No | Limited | ✓ Good |
| **Data Privacy** | **100% Client-Side / Offline** | Client-Side | Cloud Hosted | Cloud Hosted |

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
| **Open .mmd File**| `Ctrl + O` / `Cmd + O` | Import local `.mmd` or `.txt` diagram |
| **Indent / Dedent** | `Tab` / `Shift + Tab` | Indent or unindent 2 spaces in the editor |
| **Shortcuts Help** | `?` key or ⌨️ button | Open keyboard shortcuts dialog |

---

## 🌐 External Dependencies & Privacy

- **Mermaid.js**: Bundled directly into the application build from the official `mermaid` NPM package. Runs completely offline in the browser without pinging external APIs.
- **Typography (Optional Online)**: Google Fonts (`Inter` and `JetBrains Mono`) are loaded via standard stylesheet link. If offline, system fallback fonts (`ui-sans-serif`, `system-ui`, `SFMono-Regular`, `Menlo`) render cleanly.
- **Zero Telemetry**: No tracking scripts, analytics, cookies, or backend servers are used.

---

## 🚀 GitHub Pages Deployment

This repository is configured to automatically build and deploy the application to GitHub Pages on every push to the `main` branch via GitHub Actions (`.github/workflows/deploy.yml`).

### Enabling GitHub Pages in this Repository:
1. Navigate to your repository on GitHub: `https://github.com/muhamadzolfaghari/mermaid-studio`.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Once pushed to `main`, the workflow will automatically deploy the site to:
   👉 **`https://muhamadzolfaghari.github.io/mermaid-studio/`**

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

### Build for Production
```bash
npm run build
```
The compiled static assets are generated in `dist/` with base path `/mermaid-studio/`.

### Preview Production Build
```bash
npm run preview
```
Open [http://localhost:4173/mermaid-studio/](http://localhost:4173/mermaid-studio/) to verify the production bundle.

---

## 📄 License
MIT License. Free to use, adapt, and share.
