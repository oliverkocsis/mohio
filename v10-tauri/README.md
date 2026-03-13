# Mohio v10 Tauri Desktop Prototype

`v10-tauri` is a standalone desktop-first prototype built with `Tauri v2`, `React 19`, `TypeScript`, `Vite`, and `Vitest`.

It models a lighter Obsidian-style knowledge workspace with:

- a nested workspace tree in the left sidebar
- a read-only mock document surface in the center
- a mock assistant chat panel in the right sidebar

Everything is mock data. There is no real filesystem access, editor engine, or AI backend.

## Project structure

- `src/`
  - `components/` contains the three-pane UI and shared icons
  - `data/workspaces.ts` contains typed mock workspace, document, and chat seed data
  - `lib/` contains Markdown rendering and mock assistant reply utilities
  - `App.tsx` wires local app state together
- `src-tauri/`
  - minimal Tauri v2 Rust shell
  - desktop capability config for the main window
  - placeholder icon assets required by the default Tauri app context

## Prerequisites

Install these before running the desktop shell:

- Node.js 20+ and npm
- Rust toolchain and Cargo
- Tauri desktop prerequisites for your platform

Platform notes:

- macOS: Xcode Command Line Tools
- Linux: WebKitGTK and build essentials required by Tauri
- Windows: Microsoft C++ Build Tools and WebView2

Refer to the official Tauri v2 prerequisites guide for the exact packages for your OS.

## Install

```bash
cd v10-tauri
npm install
```

## Run in the browser

```bash
cd v10-tauri
npm run dev
```

## Run as a desktop app

```bash
cd v10-tauri
npm run tauri:dev
```

If this fails with `failed to run 'cargo metadata'` or `No such file or directory (os error 2)`, your Rust toolchain is not installed or not on `PATH`.

On macOS, install Rust with:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup default stable
cargo --version
```

Then rerun:

```bash
cd v10-tauri
npm run tauri:dev
```

## Test

```bash
cd v10-tauri
npm test
```

## Build

Frontend build:

```bash
cd v10-tauri
npm run build
```

Desktop build:

```bash
cd v10-tauri
npm run tauri:build
```

## Notes

- The frontend is organized so mock data can later be replaced with real Tauri commands.
- The document surface is intentionally read-only.
- Assistant replies are generated locally from placeholder text.
- `src-tauri/icons/` currently contains prototype placeholder icons so `tauri dev` can compile. Replace them with branded assets later.
