# DiagramAtlas design and capability audit

## Baseline

The current React application is a single-document diagram editor. The README describes a larger legacy application, but most legacy import engines are not connected to the React UI. It is not yet a multi-file IDE. Existing screenshots in `screenshots/audit` record all five pages before this work.

## Observed problems

- One text area, one generated diagram, no project explorer or document tabs.
- Import action exposes three formats despite the README listing many more.
- Original imported source is replaced with Mermaid, preventing continued editing in the input language.
- Canvas tools and library management are disconnected from a project workflow.
- Dense marketing claims, rounded cards, and inconsistent page hierarchies dilute the professional tool presentation.
- Old README claims about AI, collaboration, offline behavior, and complete format fidelity need to be reconciled with the shipped UI.

## Target design

Use Tailwind v4 semantic tokens and locally owned shadcn/ui components with CVA variants. Favor neutral surfaces, one blue accent, clear focus states, compact toolbars, predictable spacing, and accessible dialogs and menus. Marketing pages explain the product; the workspace devotes screen area to files, code, diagrams, and diagnostics.

## Delivery steps

1. Preserve and publish the React Router and DiagramAtlas baseline with this audit.
2. Establish semantic tokens, shadcn/ui components, and CVA variants.
3. Connect every README format through one tested format registry, preserving original source and explaining conversion limits.
4. Build a project workspace, file explorer, tabbed code editor, diagnostics, canvas controls, snapshots, and native-source exports.
5. Redesign home, templates, projects, formats, and not-found pages using the shared design system.
6. Verify formats and browser workflows, capture final screenshots, and publish accurate documentation.

## Format policy

Mermaid and Graphviz render natively. Other formats keep their editable original source and derive a Mermaid preview through supported parsers. Adapted UML templates are identified as adaptations; no claim of lossless conversion or full vendor format support. XMind workbooks retain their imported binary as well as an editable Mermaid mindmap; exporting a mindmap creates a new workbook.

## Validation

Build and parser tests on each applicable step. Browser checks cover project persistence, multiple document tabs, source editing, imports, preview failures, export actions, keyboard menus, routing, and mobile layouts. Final screenshots at desktop and phone sizes.
