import { Crosshair, Brain, Rocket, Lock, Layers, ShieldCheck } from 'lucide-react'

export const FEATURES = [
  { icon: Crosshair, title: 'CAD & Figma-grade canvas', desc: 'Kinetic momentum panning, cursor-centered zoom, trackpad + pinch support, live minimap and laser pointer.' },
  { icon: Brain, title: 'Dual in-browser AI engine', desc: 'Instant 0 MB heuristic synthesis plus a real local Qwen2.5-Coder LLM via WebGPU. No API keys.' },
  { icon: Rocket, title: 'Pro export studio', desc: 'Clean vector SVG, 2x/4x PNG, vector PDF, standalone HTML and native .xmind — watermark-free.' },
  { icon: Lock, title: '100% private & offline', desc: 'Zero telemetry, no backend. Drafts and snapshots live only in your browser localStorage.' },
  { icon: Layers, title: 'Universal multi-format importer', desc: 'XMind, Draw.io, PlantUML, Graphviz DOT, D2, SQL DDL, OpenAPI, Markdown and CSV.' },
  { icon: ShieldCheck, title: 'Non-destructive error guard', desc: 'Typos never wipe your canvas. Errors isolate in a banner while the last good render stays.' },
]

export const FORMAT_ROWS = [
  ['.xmind', 'XMind Pro', '$59–$179/yr', 'Bi-directional import & export, zero paywall'],
  ['.drawio', 'Lucidchart / Visio', '$95–$240/yr', 'XML → flowchart, 4K PNG + vector PDF'],
  ['.puml', 'PlantText / Confluence', '$36–$120/yr', 'Client-side sequence / class / state'],
  ['.d2', 'Terrastruct Studio', '$144–$240/yr', 'Instant in-browser converter'],
  ['.sql', 'dbdiagram Pro', '$108–$229/yr', 'CREATE TABLE → erDiagram'],
  ['.json', 'SwaggerHub', '$168–$360/yr', 'OpenAPI → sequence flows'],
  ['.dot', 'Commercial Graphviz', '$49–$99/yr', 'DOT → flowchart with CAD canvas'],
  ['.md', 'Miro / Whimsical', '$96–$120/yr', 'Outline → mindmap + local AI'],
]

export const MATRIX = [
  ['Pricing', '100% Free / MIT', 'Free', '$59.99/yr', '$95–$240/yr'],
  ['Sign-up', 'No — instant', 'No', 'Yes', 'Yes'],
  ['XMind bi-directional', '✓ Full', '✗', 'Native only', '✗'],
  ['Draw.io import', '✓ Built-in', '✗', '✗', 'Import only'],
  ['PlantUML & D2', '✓ Built-in', '✗', '✗', '✗'],
  ['SQL → ER', '✓ Built-in', '✗', '✗', 'Paid add-on'],
  ['Local AI (no key)', '✓ Dual engine', '✗', 'Cloud paid', 'Cloud paid'],
  ['CAD canvas', '✓ Kinetic + dock', 'Basic zoom', 'Proprietary', 'Good'],
  ['Vector PDF + 4K PNG', '✓ Print-ready', '✗', 'Paid', 'Paid'],
  ['Privacy', '100% client-side', 'Client-side', 'Local app', 'Hosted cloud'],
]

export const FAQS = [
  { q: 'Is DiagramAtlas completely free?', a: 'Yes — MIT licensed, no subscriptions, paywalls, watermarks or required accounts. Personal, open-source and commercial use.' },
  { q: 'How does in-browser AI work without an API key?', a: 'Dual engine: instant heuristic synthesis (0 MB) plus a real Qwen2.5-Coder LLM running locally via WebGPU/Wasm. Fully private.' },
  { q: 'What can I import and export?', a: 'Import XMind, Draw.io, PlantUML, Graphviz DOT, D2, SQL DDL, OpenAPI, Markdown and CSV. Export SVG, 2x/4x PNG, vector PDF, standalone HTML and .xmind.' },
  { q: 'How is it different from Mermaid Live Editor?', a: 'CAD canvas, XMind bi-directional I/O, universal converters, non-destructive errors, local AI and vector PDF — with zero cloud paywall.' },
  { q: 'Can I use it offline?', a: 'Yes. Rendering, parsing and exports all run client-side after first load.' },
  { q: 'Is my data private?', a: 'Absolutely. Zero telemetry, no backend. Drafts and snapshots stay in your browser localStorage.' },
]
