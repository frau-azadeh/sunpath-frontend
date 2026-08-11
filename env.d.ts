// env.d.ts
export {};

declare global {
  interface Window {
    CONFIG: {
      NEXT_PUBLIC_API_BASE: string;
    };
  }
}
