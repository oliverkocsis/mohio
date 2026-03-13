# Mohio v9 Electron Prototype

`v9-electron` is a standalone Electron desktop mock inspired by Obsidian's three-pane layout, simplified into a lighter workspace browser, document surface, and assistant chat panel.

## Run

```bash
cd v9-electron
npm install
npm run dev
```

## Test

```bash
cd v9-electron
npm test
```

## Build

```bash
cd v9-electron
npm run build
```

## Structure

- `electron/` contains the Electron main and preload entrypoints
- `src/components/` contains the three-pane UI building blocks
- `src/data/workspaces.ts` seeds the file tree, document blocks, chat history, and fake assistant replies
- `src/types.ts` defines the renderer-side mock workspace interfaces
