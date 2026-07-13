/** Core annotation type — one per user-marked element */
export interface Annotation {
  id: string;
  /** Identifies which page this annotation belongs to (origin + pathname) */
  pageId: string;
  /** 1-based sequential number within the page */
  index: number;

  instruction: string;
  status: 'open' | 'resolved';

  createdAt: string;
  updatedAt: string;

  page: {
    url: string;
    origin: string;
    pathname: string;
    title: string;
  };

  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    scrollX: number;
    scrollY: number;
  };

  target: {
    tagName: string;
    /** Truncated to 500 chars */
    text: string;
    id?: string;
    classNames: string[];
    /** Stable CSS selector, max 500 chars */
    cssSelector: string;
    /** XPath string */
    xpath: string;
    /** Truncated to 3000 chars */
    outerHTML: string;

    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
      top: number;
      left: number;
      right: number;
      bottom: number;
    };

    /** Key computed styles only */
    computedStyles: Record<string, string>;
    /** Element attributes */
    attributes: Record<string, string>;
  };

  screenshot?: {
    type: 'page' | 'viewport' | 'element';
    dataUrl?: string;
    filename?: string;
    error?: string;
  };
}

/** Page-keyed storage bucket */
export interface PageAnnotations {
  pageId: string;
  annotations: Annotation[];
}

/** Messages between popup / background / content */
export type ExtensionMessage =
  | { type: 'ENABLE_ANNOTATION_MODE' }
  | { type: 'DISABLE_ANNOTATION_MODE' }
  | { type: 'GET_ANNOTATIONS'; pageId: string }
  | { type: 'SAVE_ANNOTATION'; annotation: Annotation }
  | { type: 'UPDATE_ANNOTATION'; annotation: Annotation }
  | { type: 'DELETE_ANNOTATION'; id: string; pageId: string }
  | { type: 'CLEAR_PAGE_ANNOTATIONS'; pageId: string }
  | { type: 'EXPORT_JSON' }
  | { type: 'EXPORT_MARKDOWN' }
  | { type: 'GET_STATUS' }
  | { type: 'PING' };

export type ExtensionResponse =
  | { success: true; data?: unknown }
  | { success: false; error: string };

export interface PopupStatus {
  isAnnotationMode: boolean;
  annotationCount: number;
  pageId: string;
  pageTitle: string;
  pageUrl: string;
  isSupported: boolean;
}
