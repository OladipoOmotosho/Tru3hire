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
