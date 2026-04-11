# Document Switch Performance Profiling Guide

## Overview

This guide explains how to profile document switching performance in Mohio. Performance timing markers have been added throughout the document switch flow to help identify bottlenecks.

## Timing Markers

When you switch between documents in the dev build, the browser console will show timing measurements:

### Phase 1: Save and Prepare
```
💾 Save current document: XXms
📝 Record risky commit: XXms
🔄 Refresh auto-sync status: XXms
🔀 Set active document path: <1ms
🎯 Total document switch: XXms
```

**What each measures:**
- **💾 Save current document**: Time to write the previous document to disk
- **📝 Record risky commit**: Time for Git commit operation (main bottleneck suspect)
- **🔄 Refresh auto-sync status**: Time to query Git status for sync information
- **🔀 Set active document path**: React state update (should be instant)
- **🎯 Total document switch**: Sum of all "prepare" operations above

### Phase 2: Load Document
```
📖 Load document: relative/path/to/doc.md: XXms
```

**What it measures:**
- Time to read the document content from the IPC bridge to the main process and back

### Phase 3: CodeMirror Rendering
```
🔧 Initialize CodeMirror editor: XXms
🗑️ Destroy CodeMirror editor: XXms
✏️ Update markdown in editor: XXms
```

**What each measures:**
- **🔧 Initialize CodeMirror editor**: Time to create new CodeMirror instance with all extensions
  - This is the MAIN bottleneck when switching documents
  - CodeMirror must be recreated because React unmounts/remounts the RichTextEditor component
- **🗑️ Destroy CodeMirror editor**: Time to clean up the old editor
- **✏️ Update markdown in editor**: Time to update editor content (should be rare, as we recreate editor)

## How to Profile

### 1. Open Developer Tools
- In Mohio desktop app: Right-click → Inspect (or Cmd+Shift+I)
- Go to **Console** tab

### 2. Switch Documents
- Click on different documents in the left sidebar
- Watch the "🎯 Total document switch" timer and the CodeMirror timers

### 3. Analyze Results

Look for:
- Which phase is the slowest?
- Is CodeMirror initialization taking >1000ms?
- Is Git commit/status taking >1000ms?

### Expected Baseline
- **Good**: < 1 second total (≤500ms for small docs)
- **OK**: 1-2 seconds
- **Slow**: > 2 seconds

## Common Bottlenecks

### 1. **CodeMirror Initialization (Most Likely)**
If `🔧 Initialize CodeMirror editor` is > 1000ms:
- CodeMirror is reinitializing for every document
- Solution: Reuse CodeMirror editor instead of recreating
- Files: `desktop/src/renderer/App.tsx` (EditorPane), `desktop/src/renderer/markdown-editor.tsx`

### 2. **Git Operations (Second Most Likely)**
If `📝 Record risky commit` or `🔄 Refresh auto-sync status` is > 500ms:
- Git operations are blocking
- Solution: Make them non-blocking or run async without awaiting
- Files: `desktop/src/main/git-collaboration.ts`, `desktop/src/renderer/App.tsx` (openDocument)

### 3. **Document Load (Unlikely)**
If `📖 Load document` is > 500ms:
- IPC communication is slow
- Solution: Optimize IPC payload or file I/O
- Files: `desktop/src/main/document-store.ts`

## Next Steps

1. **Run profiling** with `npm run dev` and watch browser console
2. **Identify bottleneck** using the timers above
3. **Create optimization** PR targeting that phase
4. **Verify improvement** with new timings

## Performance Optimization Ideas

### For CodeMirror (if confirmed bottleneck):
- Reuse single EditorView across document switches
- Lazy-load extensions instead of initializing all at once
- Use `EditorView.reconfigure()` instead of recreating

### For Git Operations (if confirmed bottleneck):
- Remove `recordRiskyCommit()` from document switch (defer to idle timer)
- Remove `refreshAutoSyncStatus()` from document switch (let background timer handle it)
- Batch these operations instead of awaiting sequentially

### For Document Load (if confirmed bottleneck):
- Add document content caching
- Use IPC batching for multiple reads
- Profile IPC communication overhead

## Cleanup

Remove these console.time() measurements before shipping by searching for:
- `console.time(`
- `console.timeEnd(`

These are development-only profiling aids.
