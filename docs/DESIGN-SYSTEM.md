# DiagramAtlas design system

Tailwind CSS v4 owns semantic tokens in `src/index.css`. Locally owned shadcn/ui components, installed from the official registry, live in `src/components/primitives`. `components.json` and `jsconfig.json` configure JavaScript and the Vite alias. Radix primitives provide keyboard navigation, focus trapping, accessible menu semantics, and dialog dismissal. Shared Button and Badge variants use CVA; `cn` uses clsx plus tailwind-merge.

- Neutral background, card, popover, border, and muted colors; one blue primary accent.
- Status colors communicate validation: green success, amber limitations, rose failures.
- Compact 32–40px controls, 6–10px corner radii, 4px spacing scale.
- Inter for UI and JetBrains Mono for source. Clear headings without marketing gradients.
- Native HTML buttons and links, labels on icon actions, explicit focus outlines.
- Workspace panels shrink and scroll internally. Mobile uses a single active panel with accessible explorer and tool dialogs.
- Project state is local, so never display invented online-user counts or cloud synchronization status.
