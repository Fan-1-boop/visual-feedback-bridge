import { MAX_TEXT_LENGTH, MAX_OUTER_HTML_LENGTH, MAX_SELECTOR_LENGTH } from './constants';

/** Derive stable page ID from URL origin + pathname */
export function getPageId(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
}

/** Truncate a string to max length */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

/** Truncate element text */
export function truncateText(text: string): string {
  return truncate(text.trim(), MAX_TEXT_LENGTH);
}

/** Truncate outerHTML */
export function truncateHTML(html: string): string {
  return truncate(html, MAX_OUTER_HTML_LENGTH);
}

/** Truncate CSS selector */
export function truncateSelector(sel: string): string {
  return truncate(sel, MAX_SELECTOR_LENGTH);
}

/** Format date for filenames: YYYY-MM-DD */
export function formatDateForFilename(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Format ISO timestamp */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Sanitize string for filename use */
export function sanitizeFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/** Check if a URL is injectable (not a browser internal page) */
export function isInjectableUrl(url: string): boolean {
  if (!url) return false;
  const blocked = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'data:', 'javascript:'];
  const blockedHosts = ['chrome.google.com/webstore', 'microsoftedge.microsoft.com/addons'];
  if (blocked.some((prefix) => url.startsWith(prefix))) return false;
  if (blockedHosts.some((host) => url.includes(host))) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/** Download a file in the browser */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
