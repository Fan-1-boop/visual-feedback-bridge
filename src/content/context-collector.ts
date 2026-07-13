/**
 * Context Collector
 * Collects DOM context, computed styles, bounding box, CSS selector and XPath
 */

import type { Annotation } from '../shared/types';
import { KEY_COMPUTED_STYLES } from '../shared/constants';
import { truncateText, truncateHTML, truncateSelector, nowISO } from '../shared/utils';
import { generateCssSelector, generateXPath } from './element-selector';
import { nanoid } from 'nanoid';

export interface CollectedContext {
  target: Annotation['target'];
  viewport: Annotation['viewport'];
  page: Annotation['page'];
}

/** Collect all context for the clicked element */
export function collectContext(el: Element): CollectedContext {
  const rect = el.getBoundingClientRect();

  // Bounding box relative to document
  const boundingBox: Annotation['target']['boundingBox'] = {
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
    width: rect.width,
    height: rect.height,
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
  };

  // Computed styles — key properties only
  const computed = window.getComputedStyle(el);
  const computedStyles: Record<string, string> = {};
  for (const prop of KEY_COMPUTED_STYLES) {
    const val = computed.getPropertyValue(prop).trim();
    if (val && val !== 'none' && val !== 'normal' && val !== 'auto') {
      computedStyles[prop] = val;
    }
  }

  // Attributes
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    attributes[attr.name] = attr.value;
  }

  // Text content
  const rawText = (el as HTMLElement).innerText ?? el.textContent ?? '';
  const text = truncateText(rawText.replace(/\s+/g, ' '));

  // outerHTML
  const outerHTML = truncateHTML(el.outerHTML);

  // CSS selector
  const rawSelector = generateCssSelector(el);
  const cssSelector = truncateSelector(rawSelector);

  // XPath
  const xpath = generateXPath(el);

  const target: Annotation['target'] = {
    tagName: el.tagName.toLowerCase(),
    text,
    id: (el as HTMLElement).id || undefined,
    classNames: Array.from(el.classList).filter((c) => !c.startsWith('vfb-')),
    cssSelector,
    xpath,
    outerHTML,
    boundingBox,
    computedStyles,
    attributes,
  };

  const viewport: Annotation['viewport'] = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };

  const page: Annotation['page'] = {
    url: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    title: document.title,
  };

  return { target, viewport, page };
}

/** Build a new Annotation object (without instruction — filled later) */
export function buildAnnotation(
  el: Element,
  instruction: string,
  existingCount: number,
  pageId: string
): Annotation {
  const ctx = collectContext(el);
  const now = nowISO();
  return {
    id: nanoid(),
    pageId,
    index: existingCount + 1,
    instruction,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    ...ctx,
  };
}
