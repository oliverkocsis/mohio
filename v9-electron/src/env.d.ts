declare global {
  interface Window {
    mohioDesktop?: {
      appVersion: string;
      electronVersion: string;
      platform: string;
    };
  }
}

export {};
