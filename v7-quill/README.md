# Mohio v7 Quill Prototype

`v7-quill` is a standalone full-screen Markdown editor prototype built with React, Vite, and Quill.

It is intentionally minimal:

- single document only
- in-memory state only
- no file system access
- no open/import
- no save/export
- no sidebar, tabs, or multi-document flows

## Run

```bash
cd v7-quill
npm install
npm run dev
```

## Test

```bash
cd v7-quill
npm test
```

## Build

```bash
cd v7-quill
npm run build
```

## Notes

- The editor starts with seeded example Markdown content.
- Document state lives only in local React memory and resets on refresh.
- The toolbar supports bold, italic, headings, lists, blockquote, code, and link formatting.
