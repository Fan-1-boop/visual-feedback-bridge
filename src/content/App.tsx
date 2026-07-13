/**
 * Content Script Root App
 * Manages the annotation lifecycle inside Shadow DOM
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Annotation } from '../shared/types';
import {
  loadAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  currentPageId,
} from './annotation-store';
import { ElementSelector } from './element-selector';
import { buildAnnotation } from './context-collector';
import { captureViewport } from './screenshot';
import { buildExportJSON, buildExportMarkdown, getExportFilename } from '../shared/exporter';
import { downloadFile } from '../shared/utils';
import FloatingToolbar from './FloatingToolbar';
import AnnotationDialog from './AnnotationDialog';
import AnnotationMarkers from './AnnotationMarkers';
import AnnotationPanel from './AnnotationPanel';

interface Props {
  shadowRoot: ShadowRoot;
}

const App: React.FC<Props> = ({ shadowRoot }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const selectorRef = useRef<ElementSelector | null>(null);
  const pageId = currentPageId();

  // Load saved annotations on mount
  useEffect(() => {
    loadAnnotations(pageId).then(setAnnotations).catch(console.error);
  }, [pageId]);

  // Initialize element selector
  useEffect(() => {
    const sel = new ElementSelector({
      onSelect: (el) => {
        setSelectedElement(el);
        setSelecting(false);
      },
      onCancel: () => {
        setSelecting(false);
      },
      shadowRoot,
    });
    selectorRef.current = sel;
    return () => sel.destroy();
  }, [shadowRoot]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggleSelecting();
      }
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setPanelOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  // Listen for messages from popup/background
  useEffect(() => {
    const handler = (msg: { type: string }, _: chrome.runtime.MessageSender, reply: (r: unknown) => void) => {
      if (msg.type === 'GET_ANNOTATIONS') {
        reply({ success: true, data: annotations });
        return true;
      }
      if (msg.type === 'EXPORT_JSON') {
        handleExportJSON();
        reply({ success: true });
        return false;
      }
      if (msg.type === 'EXPORT_MARKDOWN') {
        handleExportMarkdown();
        reply({ success: true });
        return false;
      }
      if (msg.type === 'CLEAR_PAGE_ANNOTATIONS') {
        import('./annotation-store').then(({ clearAnnotations }) => {
          clearAnnotations(pageId).then(() => setAnnotations([]));
        });
        reply({ success: true });
        return false;
      }
      if (msg.type === 'GET_STATUS') {
        reply({
          success: true,
          data: {
            isAnnotationMode: true,
            annotationCount: annotations.length,
            pageId,
            pageTitle: document.title,
            pageUrl: window.location.href,
          },
        });
        return false;
      }
      return false;
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [annotations, pageId]);

  function toggleSelecting() {
    if (!selectorRef.current) return;
    if (selecting) {
      selectorRef.current.stop();
      setSelecting(false);
    } else {
      selectorRef.current.start();
      setSelecting(true);
    }
  }

  async function handleSaveAnnotation(instruction: string) {
    if (!selectedElement) return;
    const ann = buildAnnotation(selectedElement, instruction, annotations.length, pageId);

    // Capture screenshot (non-blocking)
    const screenshot = await captureViewport(ann.id);
    const finalAnn: Annotation = { ...ann, screenshot };

    await addAnnotation(finalAnn);
    setAnnotations((prev) => [...prev, finalAnn]);
    setSelectedElement(null);
  }

  async function handleUpdateAnnotation(updated: Annotation) {
    await updateAnnotation(updated);
    setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  async function handleDeleteAnnotation(id: string) {
    await deleteAnnotation(id, pageId);
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  function handleLocateAnnotation(ann: Annotation) {
    try {
      const el = document.querySelector(ann.target.cssSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('vfb-temp-highlight');
        setTimeout(() => el.classList.remove('vfb-temp-highlight'), 2000);
      } else {
        alert('Target element not found. The DOM may have changed since this annotation was created.');
      }
    } catch {
      alert('Could not locate element — the selector may be invalid.');
    }
  }

  function handleExportJSON() {
    if (annotations.length === 0) return;
    const json = buildExportJSON(annotations, window.location.href, document.title, {
      includeScreenshots: false,
    });
    const filename = getExportFilename(window.location.href, 'json');
    downloadFile(json, filename, 'application/json');
  }

  function handleExportMarkdown() {
    if (annotations.length === 0) return;
    const md = buildExportMarkdown(annotations, window.location.href, document.title);
    const filename = getExportFilename(window.location.href, 'md');
    downloadFile(md, filename, 'text/markdown');
  }

  function handleExit() {
    // Dispatch custom event that index.tsx listens to for unmounting
    window.dispatchEvent(new CustomEvent('vfb:exit'));
  }

  function handleMarkerClick(id: string) {
    setPanelOpen(true);
    // Scroll to item in panel if needed
    setTimeout(() => {
      const el = shadowRoot.querySelector(`[data-ann-id="${id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  return (
    <>
      {/* Annotation markers live in shadow DOM, positioned absolutely */}
      <AnnotationMarkers annotations={annotations} onMarkerClick={handleMarkerClick} />

      {/* Floating toolbar */}
      <FloatingToolbar
        annotationCount={annotations.length}
        selecting={selecting}
        panelOpen={panelOpen}
        onToggleSelect={toggleSelecting}
        onTogglePanel={() => setPanelOpen((v) => !v)}
        onExportJSON={handleExportJSON}
        onExportMarkdown={handleExportMarkdown}
        onExit={handleExit}
      />

      {/* Annotation input dialog */}
      {selectedElement && (
        <AnnotationDialog
          element={selectedElement}
          onSave={handleSaveAnnotation}
          onCancel={() => setSelectedElement(null)}
        />
      )}

      {/* Side panel */}
      {panelOpen && (
        <AnnotationPanel
          annotations={annotations}
          onClose={() => setPanelOpen(false)}
          onUpdate={handleUpdateAnnotation}
          onDelete={handleDeleteAnnotation}
          onLocate={handleLocateAnnotation}
        />
      )}
    </>
  );
};

export default App;
