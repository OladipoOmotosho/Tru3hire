// CSS modules (regular and module variants)
declare module "*.css" {
  const content: { [className: string]: string } | string;
  export default content;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const content: { [className: string]: string } | string;
  export default content;
}

declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

// Images and media
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.webp";
declare module "*.avif";
declare module "*.ico";
declare module "*.bmp";

// SVG: allow importing as React component and as URL
declare module "*.svg" {
  // Avoid importing 'react' here so this declaration doesn't require the 'react' types.
  // If you add React and its types to the project, you can restore the stronger typing.
  export const ReactComponent: (props: any) => any;
  const src: string;
  export default src;
}

// Fonts
declare module "*.woff";
declare module "*.woff2";
declare module "*.eot";
declare module "*.ttf";
declare module "*.otf";

// Other assets
declare module "*.mp4";
declare module "*.webm";
declare module "*.wav";
declare module "*.mp3";
declare module "*.m4a";
declare module "*.aac";

// Markdown
declare module "*.md" {
  const content: string;
  export default content;
}

// WebAssembly
declare module "*.wasm" {
  const value: ArrayBuffer;
  export default value;
}

// JSON is handled by TS by default, but allow generic import typing if needed
declare module "*.json" {
  const value: any;
  export default value;
}

// Vite environment typing
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ANALYTICS_DISABLED?: string;
  // Add more VITE_* variables here as needed
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};

// NOTE: Removed local augmentation for "react-dom/client" because it resolves to an untyped JS module
// and cannot be safely augmented here; install appropriate types (e.g. `@types/react-dom` or ensure
// your React/React-DOM package provides its own TypeScript declarations) if stronger typing is needed.

// Allow importing plain CSS files (removes need for // @ts-ignore in imports)
declare module "*.css";

// Minimal fallback for react-dom/client so TypeScript stops complaining
// If you install @types/react-dom this can be removed or strengthened.
// Minimal placeholder so TypeScript doesn't complain when types are missing.
declare module "react-dom/client" {
  // Minimal local fallback for ReactNode to avoid requiring @types/react
  type ReactNode = any;

  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
  export function hydrateRoot(
    container: Element | Document,
    children: ReactNode
  ): Root;
}

// Minimal module declarations to quiet editor errors for Vite and the React SWC plugin.
// These are placeholders — installing proper types (or relying on the package's own types)
// is preferable for accurate typings.
declare module "vite" {
  /** Basic helpers exported by Vite used in configs */
  export function defineConfig(config: any): any;
  export type Plugin = any;
  const _default: any;
  export default _default;
}

declare module "@vitejs/plugin-react-swc" {
  /** Plugin factory signature */
  export default function pluginReactSWC(options?: any): any;
}
