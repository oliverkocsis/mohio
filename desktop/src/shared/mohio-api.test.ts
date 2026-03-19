import { describe, expect, it } from "vitest";
import { createMohioApi } from "./mohio-api";

describe("createMohioApi", () => {
  it("returns a stable app info contract", () => {
    const api = createMohioApi({
      name: "Mohio",
      version: "0.1.0",
      platform: "darwin",
    });

    expect(api.getAppInfo()).toEqual({
      name: "Mohio",
      version: "0.1.0",
      platform: "darwin",
    });
  });
});
