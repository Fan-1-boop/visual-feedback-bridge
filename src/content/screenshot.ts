/**
 * Screenshot Module
 * Captures the current viewport using html2canvas with graceful degradation
 */

import type { Annotation } from '../shared/types';
import { SCREENSHOT_QUALITY, SCREENSHOT_SCALE } from '../shared/constants';

export type ScreenshotResult = Required<Pick<Annotation, 'screenshot'>>['screenshot'];

let html2canvasLoaded = false;
let html2canvasFailed = false;

/** Lazy-load html2canvas only when needed */
async function getHtml2Canvas(): Promise<typeof import('html2canvas').default | null> {
  if (html2canvasFailed) return null;
  if (html2canvasLoaded) {
    // Already loaded in global scope
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).html2canvas ?? null;
  }
  try {
    const mod = await import('html2canvas');
    html2canvasLoaded = true;
    return mod.default;
  } catch (err) {
    console.error('[VFB] html2canvas load failed:', err);
    html2canvasFailed = true;
    return null;
  }
}

/** Capture the current viewport and return a screenshot result */
export async function captureViewport(annotationId: string): Promise<ScreenshotResult> {
  const filename = `screenshot-${annotationId}.png`;

  try {
    const h2c = await getHtml2Canvas();
    if (!h2c) {
      return {
        type: 'viewport',
        filename,
        error: 'html2canvas unavailable',
      };
    }

    const canvas = await h2c(document.body, {
      scale: SCREENSHOT_SCALE,
      useCORS: true,
      logging: false,
      allowTaint: true,
      width: window.innerWidth,
      height: window.innerHeight,
      x: window.scrollX,
      y: window.scrollY,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    const dataUrl = canvas.toDataURL('image/png', SCREENSHOT_QUALITY);
    return {
      type: 'viewport',
      dataUrl,
      filename,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown screenshot error';
    console.error('[VFB] Screenshot failed:', msg);
    return {
      type: 'viewport',
      filename,
      error: msg,
    };
  }
}

/** Check if screenshot capture is likely to succeed */
export function isScreenshotSupported(): boolean {
  // html2canvas doesn't work well on chrome:// pages (but we block those anyway)
  return typeof document !== 'undefined' && !html2canvasFailed;
}
