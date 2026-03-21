import type { MohioApi } from "@shared/mohio-types";

declare global {
  interface Window {
    mohio: MohioApi;
  }
}

declare module "turndown-plugin-gfm" {
  export const gfm: (service: unknown) => void;
}

export {};
