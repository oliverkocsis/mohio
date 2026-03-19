import { contextBridge } from "electron";
import packageJson from "../../package.json";
import { createMohioApi } from "@shared/mohio-api";

const mohioApi = createMohioApi({
  name: "Mohio",
  version: packageJson.version,
  platform: process.platform,
});

contextBridge.exposeInMainWorld("mohio", mohioApi);
