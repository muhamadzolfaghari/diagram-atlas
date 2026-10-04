# Enterprise studio verification

Verified locally on 4 October 2026 with the production build served under `/diagram-atlas/`.

## Automated checks

- `npm run build`: successful production build. Heavy diagram engines and the optional WebLLM runtime still produce large chunks; model downloads happen only when requested.
- `npm test`: 67 legacy checks pass, including all 30 starter templates, reference diagrams, import engines, XMind round trips, PDF generation, and Graphviz WebAssembly.
- `npm run test:unit`: 31 tests pass. Covers every format sample, source preservation, format detection, compressed Draw.io, binary XMind retention, project validation and migration, backups, and visual flowchart edits.
- `npm run test:browser`: verifies all 18 samples inside the actual workspace; original SQL source downloads; SVG, PNG, PDF, and HTML downloads; project and ZIP backup restoration; tabs and reload persistence; visual nodes and connections; snapshots; last valid preview retention; source search; React Router transitions and filters; keyboard commands; and phone layouts and panel dialogs.

The browser suite runs against development or production via `ATLAS_TEST_URL`. It uses a fresh browser profile and temporary downloads, and cleans them up afterward. GitHub Actions runs the build and all three test suites on the working branch and pull requests.

## Visual review

`screenshots/audit` preserves the original five-page design. `screenshots/enterprise` contains the reviewed home, templates, projects, formats, studio, and not-found pages at 1440×1000 desktop and 390×844 phone viewports. Marketing pages are captured in full; the studio uses a viewport capture to preserve its panel layout.

To refresh screenshots while a server is running:

```sh
ATLAS_TEST_URL=http://127.0.0.1:4176/diagram-atlas node scripts/capture-screenshots.mjs
```

## Known scope and unverified behavior

- Converted formats intentionally support documented subsets. Their vendor layout, styling, macros, and execution semantics are not fully reproduced. Original text remains editable and exportable.
- Visual source edits support simple Mermaid flowchart nodes and connections. Other models are edited through source.
- Storage is local to this browser; there is no shared cloud persistence or collaborative editing service.
- PDF export embeds a raster image. SVG remains the vector export.
- Optional Qwen model download and WebGPU inference have not been verified in the headless browser. The UI reports unavailable WebGPU and model-loading failures.
- Native mobile touch gestures, OS fullscreen behavior, every vendor syntax variation, and extreme-size real-world projects require further device and fixture testing.
