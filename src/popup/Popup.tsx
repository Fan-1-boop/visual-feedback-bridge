import React, { useEffect, useState } from 'react';
import type { ExtensionMessage } from '../shared/types';
import { isInjectableUrl } from '../shared/utils';
import { loadAnnotations } from '../content/annotation-store';
import { getPageId } from '../shared/utils';

type Status =
  | { state: 'loading' }
  | { state: 'unsupported'; reason: string }
  | { state: 'ready'; url: string; title: string; annotationCount: number; isActive: boolean }
  | { state: 'error'; message: string };

function sendToContent(msg: ExtensionMessage): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response ?? { success: false, error: 'No response' });
      }
    });
  });
}

const Popup: React.FC = () => {
  const [status, setStatus] = useState<Status>({ state: 'loading' });

  useEffect(() => {
    initStatus();
  }, []);

  async function initStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url ?? '';
      const title = tab?.title ?? '';

      if (!isInjectableUrl(url)) {
        setStatus({ state: 'unsupported', reason: 'This page cannot be annotated.' });
        return;
      }

      const pageId = getPageId(url);
      const annotations = await loadAnnotations(pageId);

      // Try to ping content script to check if it's active
      const ping = await sendToContent({ type: 'PING' });
      const isActive = ping.success && (ping.data as { mounted?: boolean })?.mounted === true;

      setStatus({
        state: 'ready',
        url,
        title,
        annotationCount: annotations.length,
        isActive,
      });
    } catch (err) {
      setStatus({ state: 'error', message: String(err) });
    }
  }

  async function handleEnable() {
    const res = await sendToContent({ type: 'ENABLE_ANNOTATION_MODE' });
    if (res.success) {
      window.close();
    } else {
      setStatus({ state: 'error', message: res.error ?? 'Failed to enable annotation mode' });
    }
  }

  async function handleDisable() {
    await sendToContent({ type: 'DISABLE_ANNOTATION_MODE' });
    await initStatus();
  }

  async function handleExportJSON() {
    await sendToContent({ type: 'EXPORT_JSON' });
    window.close();
  }

  async function handleExportMarkdown() {
    await sendToContent({ type: 'EXPORT_MARKDOWN' });
    window.close();
  }

  async function handleClear() {
    if (!confirm('Clear all annotations for this page?')) return;
    if (status.state !== 'ready') return;
    const pageId = getPageId(status.url);
    await sendToContent({ type: 'CLEAR_PAGE_ANNOTATIONS', pageId });
    await initStatus();
  }

  const s = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .popup { padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
    .header-icon { font-size: 20px; }
    .header-title { font-size: 13px; font-weight: 700; color: #0f172a; }
    .header-sub { font-size: 11px; color: #94a3b8; }
    .status-row { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; font-size: 12px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.active { background: #22c55e; }
    .dot.inactive { background: #94a3b8; }
    .page-url { font-size: 11px; color: #64748b; margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: #f8fafc; padding: 4px 8px; border-radius: 4px; }
    .count-row { font-size: 12px; color: #475569; margin-bottom: 14px; }
    .count-num { font-weight: 700; color: #0f172a; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 9px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; margin-bottom: 6px; transition: opacity 0.15s; }
    .btn:last-child { margin-bottom: 0; }
    .btn-primary { background: #1e293b; color: #fff; }
    .btn-primary:hover { background: #0f172a; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-danger { background: #fff; color: #ef4444; border: 1px solid #fecaca; }
    .btn-danger:hover { background: #fef2f2; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .divider { height: 1px; background: #f1f5f9; margin: 10px 0; }
    .error { color: #ef4444; font-size: 12px; padding: 8px; background: #fef2f2; border-radius: 6px; margin-bottom: 10px; }
  `;

  return (
    <>
      <style>{s}</style>
      <div className="popup">
        <div className="header">
          <span className="header-icon">🔍</span>
          <div>
            <div className="header-title">Visual Feedback Bridge</div>
            <div className="header-sub">Annotate → Export → Fix</div>
          </div>
        </div>

        {status.state === 'loading' && (
          <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
            Loading…
          </div>
        )}

        {status.state === 'unsupported' && (
          <div className="error">{status.reason}</div>
        )}

        {status.state === 'error' && (
          <div className="error">Error: {status.message}</div>
        )}

        {status.state === 'ready' && (
          <>
            <div className="status-row">
              <div className={`dot ${status.isActive ? 'active' : 'inactive'}`} />
              <span>{status.isActive ? 'Annotation mode active' : 'Annotation mode inactive'}</span>
            </div>

            <div className="page-url" title={status.url}>{status.url}</div>

            <div className="count-row">
              Annotations on this page: <span className="count-num">{status.annotationCount}</span>
            </div>

            {!status.isActive ? (
              <button className="btn btn-primary" onClick={handleEnable}>
                ▶ Enable Annotation Mode
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={handleDisable}>
                ⏸ Disable Annotation Mode
              </button>
            )}

            <div className="divider" />

            <button
              className="btn btn-secondary"
              onClick={handleExportJSON}
              disabled={status.annotationCount === 0}
            >
              📄 Export JSON
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleExportMarkdown}
              disabled={status.annotationCount === 0}
            >
              📝 Export Markdown
            </button>

            <div className="divider" />

            <button
              className="btn btn-danger"
              onClick={handleClear}
              disabled={status.annotationCount === 0}
            >
              🗑 Clear Annotations
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default Popup;
