// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { buildAppMenuTemplate } from "./menu";

describe("buildAppMenuTemplate", () => {
  it("adds Open Workspace to the File menu with a standard accelerator", () => {
    const onOpenWorkspace = vi.fn();
    const template = buildAppMenuTemplate({
      appName: "Mohio",
      isMac: false,
      onOpenWorkspace,
    });

    const fileMenu = template.find((item) => item.label === "File");
    const fileSubmenu = Array.isArray(fileMenu?.submenu) ? fileMenu.submenu : [];

    expect(fileMenu).toBeDefined();
    expect(fileSubmenu).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accelerator: "CmdOrCtrl+O",
          label: "Open Workspace...",
        }),
      ]),
    );

    const openWorkspaceItem = fileSubmenu.find(
      (item): item is Exclude<(typeof fileSubmenu)[number], { type: "separator" }> =>
        "label" in item && item.label === "Open Workspace...",
    );

    expect(openWorkspaceItem).toBeDefined();
    if (!openWorkspaceItem || !("click" in openWorkspaceItem) || !openWorkspaceItem.click) {
      throw new Error("Open Workspace menu item is missing its click handler.");
    }

    openWorkspaceItem.click({} as never, undefined, {} as never);

    expect(onOpenWorkspace).toHaveBeenCalledTimes(1);
  });
});
