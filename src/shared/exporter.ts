import type { Annotation } from './types';
import { formatDateForFilename, sanitizeFilename, nowISO } from './utils';

export interface ExportOptions {
  includeScreenshots?: boolean;
}

/** Build export JSON structure */
export function buildExportJSON(
  annotations: Annotation[],
  pageUrl: string,
  pageTitle: string,
  options: ExportOptions = {}
): string {
  const exportAnnotations = options.includeScreenshots
    ? annotations
    : annotations.map((a) => {
        const { screenshot, ...rest } = a;
        return screenshot
          ? {
              ...rest,
              screenshot: {
                type: screenshot.type,
                filename: screenshot.filename,
                note: 'screenshot data excluded from this export',
              },
            }
          : rest;
      });

  const payload = {
    project: {
      name: 'Visual Feedback Bridge Export',
      exportedAt: nowISO(),
    },
    page: {
      url: pageUrl,
      title: pageTitle,
    },
    annotations: exportAnnotations,
  };
  return JSON.stringify(payload, null, 2);
}

/** Build export Markdown for Code Agents */
export function buildExportMarkdown(
  annotations: Annotation[],
  pageUrl: string,
  pageTitle: string
): string {
  const now = nowISO();
  const viewport = annotations[0]?.viewport;
  const vpStr = viewport ? `${viewport.width} × ${viewport.height}` : 'unknown';

  const lines: string[] = [
    '# Frontend Visual Feedback',
    '',
    `Page: ${pageUrl}`,
    `Title: ${pageTitle}`,
    `Viewport: ${vpStr}`,
    `Exported at: ${now}`,
    '',
    '## General instructions',
    '',
    'Please process the following frontend annotations.',
    '',
    '- Make the smallest necessary code changes.',
    '- Do not modify unrelated business logic.',
    '- Preserve the current design system.',
    '- Inspect the referenced DOM and page context before editing.',
    '- After modification, verify the page at the recorded viewport size.',
    '',
    '---',
    '',
  ];

  annotations.forEach((ann, i) => {
    const idx = i + 1;
    const t = ann.target;
    const bb = t.boundingBox;

    lines.push(`## Annotation ${idx}`);
    lines.push('');
    lines.push(`Status: ${ann.status === 'resolved' ? 'Resolved' : 'Open'}`);
    lines.push('');
    lines.push('### User request');
    lines.push('');
    lines.push(ann.instruction);
    lines.push('');
    lines.push('### Target element');
    lines.push('');
    lines.push(`- Tag: \`${t.tagName.toLowerCase()}\``);
    if (t.text) lines.push(`- Text: \`${t.text}\``);
    lines.push(`- CSS selector: \`${t.cssSelector}\``);
    lines.push(`- XPath: \`${t.xpath}\``);
    lines.push(`- Bounding box: \`x=${Math.round(bb.x)}, y=${Math.round(bb.y)}, width=${Math.round(bb.width)}, height=${Math.round(bb.height)}\``);
    lines.push('');

    if (t.classNames.length > 0) {
      lines.push('### Classes');
      lines.push('');
      lines.push('`' + t.classNames.join(' ') + '`');
      lines.push('');
    }

    const styleEntries = Object.entries(t.computedStyles);
    if (styleEntries.length > 0) {
      lines.push('### Key computed styles');
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(t.computedStyles, null, 2));
      lines.push('```');
      lines.push('');
    }

    if (t.outerHTML) {
      lines.push('### HTML excerpt');
      lines.push('');
      lines.push('```html');
      lines.push(t.outerHTML);
      lines.push('```');
      lines.push('');
    }

    if (ann.screenshot) {
      lines.push('### Screenshot');
      lines.push('');
      if (ann.screenshot.error) {
        lines.push(`Screenshot capture failed: ${ann.screenshot.error}`);
      } else if (ann.screenshot.filename) {
        lines.push(`Screenshot captured: \`${ann.screenshot.filename}\``);
        lines.push('(Full screenshot data available in JSON export)');
      } else {
        lines.push('Screenshot captured in the exported annotation data.');
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  lines.push('## Expected workflow for the Code Agent');
  lines.push('');
  lines.push('1. Inspect each annotation.');
  lines.push('2. Search the codebase for the corresponding component.');
  lines.push('3. Make the smallest possible change.');
  lines.push('4. Avoid unrelated refactoring.');
  lines.push('5. Run lint and type checking.');
  lines.push('6. Verify the affected page.');
  lines.push('7. Summarize modified files and resolved annotations.');
  lines.push('');

  return lines.join('\n');
}

/** Generate export filename */
export function getExportFilename(pageUrl: string, ext: 'json' | 'md'): string {
  const date = formatDateForFilename(new Date());
  let slug = '';
  try {
    const u = new URL(pageUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    slug = sanitizeFilename(parts[parts.length - 1] || u.hostname);
  } catch {
    slug = 'export';
  }
  return `visual-feedback-${slug}-${date}.${ext}`;
}
