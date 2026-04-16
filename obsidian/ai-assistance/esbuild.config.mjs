import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prod = process.argv[2] === "production";

// Setup symlink to .obsidian/plugins for dev mode
const setupSymlink = () => {
  if (prod) return;
  
  try {
    const pluginDir = __dirname;
    const obsidianDir = path.resolve(__dirname, "../../.obsidian/plugins");
    const linkPath = path.join(obsidianDir, "mohio-ai-assistance");
    
    // Create plugins directory if it doesn't exist
    if (!fs.existsSync(obsidianDir)) {
      fs.mkdirSync(obsidianDir, { recursive: true });
    }
    
    // Remove existing symlink/directory
    if (fs.existsSync(linkPath)) {
      const stat = fs.lstatSync(linkPath);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(linkPath);
      } else if (stat.isDirectory()) {
        // For dev, convert directory to symlink
        fs.rmSync(linkPath, { recursive: true, force: true });
      }
    }
    
    // Create symlink
    fs.symlinkSync(pluginDir, linkPath, "dir");
    console.log(`✓ Symlink created: ${linkPath} → ${pluginDir}`);
  } catch (error) {
    if (error.code !== "EEXIST") {
      console.warn("⚠ Could not setup plugin symlink:", error.message);
    }
  }
};

const context = await esbuild.context({
  entryPoints: ["main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  setupSymlink();
  await context.watch();
}
