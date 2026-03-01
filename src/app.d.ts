// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Platform {
      server: Bun.Server;
      request: Request;
    }
    interface Locals {
      sessionId: string;
      host: string;
      recordPath: string;
    }
  }
}

export {};
