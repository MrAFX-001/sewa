/// <reference types="vite/client" />

// vite/client declares the common asset types (including *.pdf) but not
// Office formats, so the submission-format decks need their own declaration.
declare module "*.pptx" {
  const src: string;
  export default src;
}
