export type IconName =
  | "open"
  | "download"
  | "undo"
  | "redo"
  | "search"
  | "close"
  | "grid"
  | "chevron"
  | "github"
  | "file"
  | "arrow"
  | "check";
const paths: Record<IconName, string> = {
  open: '<path d="M3 8h6l2 2h10l-3 10H3zM3 8V5h7l2 3h7v2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  undo: '<path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14"/>',
  redo: '<path d="m16 4 5 5-5 5m5-5h-10a7 7 0 0 0 0 14"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m6-18v18M3 9h18M3 15h18"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  file: '<path d="M13 3H5v18h14V9zM13 3v6h6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  github:
    '<path d="M9 19c-4 1-4-2-6-2m12 5v-4c0-1 .1-2-.5-2.5 3.5-.4 6.5-1.7 6.5-6a5 5 0 0 0-1.3-3.5c.2-1 .1-2-.2-3-1.8 0-3 1-3.5 1.3a12 12 0 0 0-8 0C7.5 4 6.3 3 4.5 3c-.3 1-.4 2-.2 3A5 5 0 0 0 3 9.5c0 4.3 3 5.6 6.5 6C9 16 9 17 9 18v4"/>',
};
export function icon(name: IconName) {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
