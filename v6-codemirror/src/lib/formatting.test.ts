import { describe, expect, it } from "vitest";
import { applyToolbarAction } from "./formatting";

describe("applyToolbarAction", () => {
  it("wraps a collapsed selection for bold", () => {
    const result = applyToolbarAction("bold", "Hello", { from: 0, to: 0 });

    expect(result.text).toBe("**Bold text**Hello");
    expect(result.selection).toEqual({ from: 2, to: 11 });
  });

  it("selects the inserted URL for collapsed link formatting", () => {
    const result = applyToolbarAction("link", "Hello", { from: 0, to: 0 });

    expect(result.text).toBe("[Link text](https://example.com)Hello");
    expect(result.selection).toEqual({ from: 12, to: 31 });
  });

  it("normalizes heading markers for heading actions", () => {
    const result = applyToolbarAction("heading2", "# Launch", {
      from: 0,
      to: "# Launch".length,
    });

    expect(result.text).toBe("## Launch");
  });

  it("prefixes all selected lines for numbered lists", () => {
    const result = applyToolbarAction("numberedList", "Alpha\nBeta\nGamma", {
      from: 0,
      to: "Alpha\nBeta\nGamma".length,
    });

    expect(result.text).toBe("1. Alpha\n2. Beta\n3. Gamma");
  });

  it("wraps multiline selections in fenced code blocks", () => {
    const result = applyToolbarAction("code", "Alpha\nBeta", {
      from: 0,
      to: "Alpha\nBeta".length,
    });

    expect(result.text).toBe("```\nAlpha\nBeta\n```");
    expect(result.selection).toEqual({ from: 4, to: 14 });
  });
});
