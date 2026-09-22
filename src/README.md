# Book Writer

A local-first desktop "IDE for writing a book" — manuscript, chapters, scenes,
characters, locations, timeline, story events, relationships, and a story
mindmap, all in one place. No account, no server, no cloud required.

## Features

- **Manuscript** — chapters and scenes with a rich text editor (Tiptap),
  autosave, and word counts.
- **Characters** — full wiki-style pages: basic info, custom fields, arc
  (beginning/middle/end), computed appearances/events/locations.
- **Relationships** — directed, freely-typed relationships between
  characters (friend, rival, lover, or anything custom).
- **Locations** — with computed "used in" backlinks (scenes, events,
  characters).
- **Timeline & Story Map** — story events with a linear timeline view and
  an interactive node graph (drag, connect, zoom/pan) built on React Flow.
- **Roadmap** — chapter-level outline with status, target word count, and
  progress.
- **Notes & Search** — free-form notes, and search across the whole book
  (Cyrillic-aware).
- **Export & Backup** — export the manuscript to plain text; one-click
  SQLite backup.
- **Russian / English UI** — fully localized interface, Russian by default.

## Tech stack

- [Tauri 2](https://tauri.app) — desktop shell (Rust)
- React 19 + TypeScript + Vite
- Tailwind CSS 4
- [Tiptap](https://tiptap.dev) — rich text editor
- Zustand — UI state
- SQLite via [`@tauri-apps/plugin-sql`](https://github.com/tauri-apps/plugins-workspace)
- [React Flow](https://reactflow.dev) (`@xyflow/react`) — story mindmap
- Zod — validation
- Vitest — testing (backed by Node's built-in `node:sqlite` for real
  in-memory database tests)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 24+
- [Rust](https://rustup.rs) (stable toolchain)
- [pnpm](https://pnpm.io)
- On Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  ("Desktop development with C++" workload)

### Development

```bash
pnpm install
pnpm tauri dev
```

### Testing

```bash
pnpm exec vitest run
```

### Production build

```bash
pnpm tauri build
```

Installers are produced under `src-tauri/target/release/bundle/`.

## Project structure
src/
app/ # (reserved)
db/ # SQLite client + one repository per entity
features/ # UI, grouped by section (manuscript, characters, ...)
i18n/ # translation dictionary + hook
lib/ # pure helper functions
stores/ # Zustand stores
types/ # Zod schemas / shared types
src-tauri/
migrations/ # SQL migrations, applied in order at startup
src/ # Rust entry point + Tauri plugin registration


## License

No license has been chosen yet — all rights reserved by default until one
is added.