/** Chrome storage key prefix */
export const STORAGE_PREFIX = 'vfb_page_';

/** Max characters for outerHTML capture */
export const MAX_OUTER_HTML_LENGTH = 3000;

/** Max characters for text capture */
export const MAX_TEXT_LENGTH = 500;

/** Max characters for CSS selector */
export const MAX_SELECTOR_LENGTH = 500;

/** Key computed styles to capture */
export const KEY_COMPUTED_STYLES: readonly string[] = [
  'display',
  'position',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-align',
  'border',
  'border-radius',
  'box-sizing',
  'overflow',
  'overflow-x',
  'overflow-y',
  'flex-direction',
  'justify-content',
  'align-items',
  'gap',
  'grid-template-columns',
  'grid-template-rows',
  'opacity',
  'visibility',
  'z-index',
];

/** Tags to ignore during element selection */
export const IGNORED_TAGS = new Set(['HTML', 'BODY', 'SCRIPT', 'STYLE', 'HEAD', 'META', 'LINK']);

/** Minimum element dimension to allow selection */
export const MIN_ELEMENT_AREA = 100; // px²

/** Keyboard shortcuts */
export const SHORTCUTS = {
  TOGGLE_MODE: 'Alt+A',
  SELECT_ELEMENT: 'Alt+S',
  CANCEL: 'Escape',
  TOGGLE_LIST: 'Alt+L',
} as const;

/** Shadow DOM host element id */
export const SHADOW_HOST_ID = 'vfb-shadow-host';

/** Z-index for extension UI */
export const EXTENSION_Z_INDEX = 2147483647;

/** Screenshot settings */
export const SCREENSHOT_QUALITY = 0.85;
export const SCREENSHOT_SCALE = 1;
