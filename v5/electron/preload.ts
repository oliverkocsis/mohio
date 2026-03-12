import { contextBridge } from "electron";
import packageJson from "../package.json";

contextBridge.exposeInMainWorld("mohioDesktop", {
  appVersion: packageJson.version,
  electronVersion: process.versions.electron,
  platform: process.platform,
});
