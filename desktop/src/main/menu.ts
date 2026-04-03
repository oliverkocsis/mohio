import type { BaseWindow, MenuItemConstructorOptions } from "electron";

interface BuildAppMenuTemplateOptions {
  appName: string;
  isMac: boolean;
  onOpenWorkspace: (browserWindow?: BaseWindow) => void | Promise<unknown>;
}

export function buildAppMenuTemplate({
  appName,
  isMac,
  onOpenWorkspace,
}: BuildAppMenuTemplateOptions): MenuItemConstructorOptions[] {
  const fileMenu: MenuItemConstructorOptions = {
    label: "File",
    submenu: [
      {
        accelerator: "CmdOrCtrl+O",
        click: (_menuItem, browserWindow) => {
          void onOpenWorkspace(browserWindow ?? undefined);
        },
        label: "Open Folder...",
      },
      { type: "separator" },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  };

  const template: MenuItemConstructorOptions[] = [
    fileMenu,
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: isMac ? "zoom" : "close" },
      ],
    },
  ];

  if (isMac) {
    template.unshift({
      label: appName,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  return template;
}
