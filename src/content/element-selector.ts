/**
 * Element Selector
 * Handles hover highlight, element info tooltip, and click-to-lock
 */

import { IGNORED_TAGS, MIN_ELEMENT_AREA, SHADOW_HOST_ID } from '../shared/constants';

export type SelectionCallback = (element: Element) => void;
export type CancelCallback = () => void;

interface ElementSelectorOptions {
  onSelect: SelectionCallback;
  onCancel: CancelCallback;
  shadowRoot: ShadowRoot;
}

/** Manages the hover-and-click element selection state */
export class ElementSelector {
  private active = false;
  private hoveredElement: Element | null = null;
  private highlightBox: HTMLElement;
  private infoTooltip: HTMLElement;
  private onSelect: SelectionCallback;
  private onCancel: CancelCallback;

  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(options: ElementSelectorOptions) {
    this.onSelect = options.onSelect;
    this.onCancel = options.onCancel;

    // Highlight overlay — lives inside Shadow DOM
    this.highlightBox = this.createHighlightBox(options.shadowRoot);
    this.infoTooltip = this.createInfoTooltip(options.shadowRoot);

    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  /** Start selection mode */
  start(): void {
    if (this.active) return;
    this.active = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', this.boundMouseMove, true);
    document.addEventListener('click', this.boundClick, true);
    document.addEventListener('keydown', this.boundKeyDown, true);
  }

  /** Stop selection mode */
  stop(): void {
    if (!this.active) return;
    this.active = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundMouseMove, true);
    document.removeEventListener('click', this.boundClick, true);
    document.removeEventListener('keydown', this.boundKeyDown, true);
    this.hideHighlight();
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.stop();
    this.highlightBox.remove();
    this.infoTooltip.remove();
  }

  private handleMouseMove(e: MouseEvent): void {
    const target = this.resolveTarget(e);
    if (!target) {
      this.hideHighlight();
      return;
    }
    if (target !== this.hoveredElement) {
      this.hoveredElement = target;
      this.updateHighlight(target);
    }
  }

  private handleClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const target = this.resolveTarget(e);
    if (!target) return;
    this.stop();
    this.onSelect(target);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.stop();
      this.onCancel();
    }
  }

  /** Resolve the event target, filtering out extension and ignored elements */
  private resolveTarget(e: MouseEvent): Element | null {
    const el = e.target as Element;
    if (!el || !el.tagName) return null;

    // Ignore our own Shadow DOM host
    if (el.closest(`#${SHADOW_HOST_ID}`)) return null;

    const tag = el.tagName.toUpperCase();
    if (IGNORED_TAGS.has(tag)) return null;

    // Check visibility and minimum area
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    if (rect.width * rect.height < MIN_ELEMENT_AREA) return null;

    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return null;

    return el;
  }

  private updateHighlight(el: Element): void {
    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Position highlight box
    Object.assign(this.highlightBox.style, {
      display: 'block',
      top: `${rect.top + scrollY}px`,
      left: `${rect.left + scrollX}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });

    // Update info tooltip content
    const tag = el.tagName.toLowerCase();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const classes = Array.from(el.classList)
      .filter((c) => !c.startsWith('vfb-'))
      .slice(0, 3)
      .map((c) => `.${c}`)
      .join('');
    const id = el.id ? `#${el.id}` : '';

    this.infoTooltip.innerHTML = `
      <span class="vfb-tip-tag">${tag}${id}</span>
      <span class="vfb-tip-size">${w} × ${h}</span>
      ${classes ? `<span class="vfb-tip-class">${classes}</span>` : ''}
    `;

    // Position tooltip near top-right of element, but keep in viewport
    let tipTop = rect.top + scrollY - 36;
    let tipLeft = rect.left + scrollX;
    if (tipTop < scrollY + 4) tipTop = rect.bottom + scrollY + 4;
    if (tipLeft + 220 > window.innerWidth) tipLeft = Math.max(4, window.innerWidth + scrollX - 224);

    Object.assign(this.infoTooltip.style, {
      display: 'block',
      top: `${tipTop}px`,
      left: `${tipLeft}px`,
    });
  }

  private hideHighlight(): void {
    this.hoveredElement = null;
    this.highlightBox.style.display = 'none';
    this.infoTooltip.style.display = 'none';
  }

  private createHighlightBox(shadowRoot: ShadowRoot): HTMLElement {
    const el = document.createElement('div');
    el.className = 'vfb-highlight-box';
    el.style.cssText = `
      display: none;
      position: absolute;
      pointer-events: none;
      box-sizing: border-box;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 3px;
      transition: top 0.05s, left 0.05s, width 0.05s, height 0.05s;
      z-index: 2147483646;
    `;
    shadowRoot.appendChild(el);
    return el;
  }

  private createInfoTooltip(shadowRoot: ShadowRoot): HTMLElement {
    const el = document.createElement('div');
    el.className = 'vfb-element-tooltip';
    el.style.cssText = `
      display: none;
      position: absolute;
      pointer-events: none;
      background: #1e293b;
      color: #e2e8f0;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      z-index: 2147483647;
      display: flex;
      gap: 8px;
      align-items: center;
    `;
    shadowRoot.appendChild(el);
    return el;
  }
}

// ── CSS Selector Generator ──────────────────────────────────────────────────

/** Generate a stable, unique CSS selector for the given element */
export function generateCssSelector(el: Element): string {
  // Strategy 1: unique id
  if (el.id && /^[a-zA-Z_-]/.test(el.id) && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
    return `#${CSS.escape(el.id)}`;
  }

  // Strategy 2: data attributes
  for (const attr of ['data-testid', 'data-test', 'data-cy']) {
    const val = el.getAttribute(attr);
    if (val) {
      const sel = `[${attr}="${CSS.escape(val)}"]`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }
  }

  // Strategy 3: build path from root
  return buildSelectorPath(el);
}

function buildSelectorPath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
    const part = getSelectorPart(current);
    parts.unshift(part);
    const selector = parts.join(' > ');
    if (selector.length > 500) break;
    // Check if selector is unique
    try {
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    } catch {
      // Invalid selector — continue up
    }
    current = current.parentElement;
  }

  return parts.join(' > ').slice(0, 500);
}

function getSelectorPart(el: Element): string {
  const tag = el.tagName.toLowerCase();

  // Use stable classes (skip dynamic-looking ones)
  const stableClasses = Array.from(el.classList)
    .filter((c) => isStableClassName(c))
    .slice(0, 2);

  if (stableClasses.length > 0) {
    const part = `${tag}.${stableClasses.map(CSS.escape).join('.')}`;
    // Add nth-of-type if not unique among siblings
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.querySelectorAll(`:scope > ${part}`));
      if (siblings.length > 1) {
        const idx = siblings.indexOf(el) + 1;
        return `${tag}:nth-of-type(${idx})`;
      }
    }
    return part;
  }

  // Fallback: nth-of-type
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.querySelectorAll(`:scope > ${tag}`));
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el) + 1;
      return `${tag}:nth-of-type(${idx})`;
    }
  }
  return tag;
}

/** Heuristic: stable class names don't contain hashes/numbers that change */
function isStableClassName(className: string): boolean {
  if (className.startsWith('vfb-')) return false;
  // Skip classes with long hex-like segments (CSS modules hashes)
  if (/[a-f0-9]{5,}/.test(className)) return false;
  // Skip classes that are only numbers
  if (/^\d+$/.test(className)) return false;
  return true;
}

// ── XPath Generator ─────────────────────────────────────────────────────────

/** Generate an absolute XPath for the given element */
export function generateXPath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const tag = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    let index = 1;

    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (s): s is Element => s.tagName.toLowerCase() === tag
      );
      if (siblings.length > 1) {
        index = siblings.indexOf(current) + 1;
        parts.unshift(`${tag}[${index}]`);
      } else {
        parts.unshift(tag);
      }
    } else {
      parts.unshift(tag);
    }
    current = parent;
  }

  return '/' + parts.join('/');
}
