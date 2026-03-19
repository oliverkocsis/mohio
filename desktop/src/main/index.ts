import { app, BrowserWindow } from "electron";
import path from "node:path";

function createMainWindow(): BrowserWindow {
  const appPath = app.getAppPath();
  const preloadPath = path.join(appPath, "dist/preload/index.cjs");
  const rendererPath = path.join(appPath, "dist/renderer/index.html");
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: "#f3f4f6",
    title: "Mohio",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(rendererPath);
  }

  return mainWindow;
}

app.whenReady().then(() => {
  app.setName("Mohio");
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
