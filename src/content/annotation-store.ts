/**
 * Annotation Store
 * CRUD operations backed by chrome.storage.local, keyed by pageId
 */

import type { Annotation, PageAnnotations } from '../shared/types';
import { STORAGE_PREFIX } from '../shared/constants';
import { getPageId } from '../shared/utils';

/** Get the storage key for a page */
function pageKey(pageId: string): string {
  return STORAGE_PREFIX + btoa(pageId).replace(/[=+/]/g, '_').slice(0, 60);
}

/** Load all annotations for a given page */
export async function loadAnnotations(pageId: string): Promise<Annotation[]> {
  const key = pageKey(pageId);
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        console.error('[VFB] Storage read error:', chrome.runtime.lastError.message);
        resolve([]);
        return;
      }
      const data: PageAnnotations | undefined = result[key];
      resolve(data?.annotations ?? []);
    });
  });
}

/** Save the full annotation list for a page */
async function saveAnnotations(pageId: string, annotations: Annotation[]): Promise<void> {
  const key = pageKey(pageId);
  const data: PageAnnotations = { pageId, annotations };
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) {
        console.error('[VFB] Storage write error:', chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/** Add a new annotation */
export async function addAnnotation(annotation: Annotation): Promise<void> {
  const annotations = await loadAnnotations(annotation.pageId);
  annotations.push(annotation);
  await saveAnnotations(annotation.pageId, annotations);
}

/** Update an existing annotation by id */
export async function updateAnnotation(updated: Annotation): Promise<void> {
  const annotations = await loadAnnotations(updated.pageId);
  const idx = annotations.findIndex((a) => a.id === updated.id);
  if (idx === -1) throw new Error(`Annotation ${updated.id} not found`);
  annotations[idx] = updated;
  await saveAnnotations(updated.pageId, annotations);
}

/** Delete an annotation by id */
export async function deleteAnnotation(id: string, pageId: string): Promise<void> {
  const annotations = await loadAnnotations(pageId);
  const filtered = annotations.filter((a) => a.id !== id);
  await saveAnnotations(pageId, filtered);
}

/** Clear all annotations for a page */
export async function clearAnnotations(pageId: string): Promise<void> {
  await saveAnnotations(pageId, []);
}

/** Get current page ID */
export function currentPageId(): string {
  return getPageId(window.location.href);
}
