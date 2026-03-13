import { describe, expect, it } from "vitest";
import { applyToolbarAction } from "./formatting";

describe("applyToolbarAction", () => {
  it("wraps a collapsed selection for strikethrough", () => {
    const result = applyToolbarAction("strikethrough", "Hello", { from: 0, to: 0 });

    expect(result.text).toBe("~~Strikethrough~~Hello");
    expect(result.selection).toEqual({ from: 2, to: 15 });
  });

  it("normalizes selected lines back to paragraph text", () => {
    const result = applyToolbarAction("paragraph", "> 1. Launch plan", {
      from: 0,
      to: "> 1. Launch plan".length,
    });

    expect(result.text).toBe("Launch plan");
  });

  it("wraps selected content as inline code", () => {
    const result = applyToolbarAction("inlineCode", "Ship fast", {
      from: 0,
      to: "Ship".length,
    });

    expect(result.text).toBe("`Ship` fast");
    expect(result.selection).toEqual({ from: 1, to: 5 });
  });

  it("wraps multiline selections in fenced code blocks", () => {
    const result = applyToolbarAction("codeBlock", "Alpha\nBeta", {
      from: 0,
      to: "Alpha\nBeta".length,
    });

    expect(result.text).toBe("```\nAlpha\nBeta\n```");
    expect(result.selection).toEqual({ from: 4, to: 14 });
  });

  it("selects the inserted URL for collapsed link formatting", () => {
    const result = applyToolbarAction("link", "Hello", { from: 0, to: 0 });

    expect(result.text).toBe("[Link text](https://example.com)Hello");
    expect(result.selection).toEqual({ from: 12, to: 31 });
  });
});
