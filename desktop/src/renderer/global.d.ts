import type { MohioApi } from "@shared/mohio-types";

declare global {
  interface Window {
    mohio: MohioApi;
  }
}

export {};
