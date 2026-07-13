import React from 'react';

interface Props {
  annotationCount: number;
  selecting: boolean;
  panelOpen: boolean;
  onToggleSelect: () => void;
  onTogglePanel: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onExit: () => void;
}

/** Floating toolbar pinned to the bottom-right of the page */
const FloatingToolbar: React.FC<Props> = ({
  annotationCount,
  selecting,
  panelOpen,
  onToggleSelect,
  onTogglePanel,
  onExportJSON,
  onExportMarkdown,
  onExit,
}) => {
  return (
    <div className="vfb-toolbar">
      <div className="vfb-toolbar-main">
        {/* Select mode toggle */}
        <button
          className={`vfb-toolbar-btn ${selecting ? 'active' : ''}`}
          onClick={onToggleSelect}
          title="Select element (Alt+S)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
        </button>

        {/* Panel toggle with badge */}
        <div style={{ position: 'relative' }}>
          <button
            className={`vfb-toolbar-btn ${panelOpen ? 'active' : ''}`}
            onClick={onTogglePanel}
            title="Annotation list (Alt+L)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="15" y2="16"/>
            </svg>
          </button>
          {annotationCount > 0 && (
            <span className="vfb-count-badge">{annotationCount}</span>
          )}
        </div>

        <div className="vfb-toolbar-divider" />

        {/* Export JSON */}
        <button
          className="vfb-toolbar-btn"
          onClick={onExportJSON}
          title="Export JSON"
          disabled={annotationCount === 0}
          style={{ opacity: annotationCount === 0 ? 0.4 : 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </button>

        {/* Export Markdown */}
        <button
          className="vfb-toolbar-btn"
          onClick={onExportMarkdown}
          title="Export Markdown"
          disabled={annotationCount === 0}
          style={{ opacity: annotationCount === 0 ? 0.4 : 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
        </button>

        <div className="vfb-toolbar-divider" />

        {/* Exit */}
        <button className="vfb-toolbar-btn danger" onClick={onExit} title="Exit annotation mode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Status line */}
      {selecting && (
        <div style={{
          background: '#1e293b',
          color: '#93c5fd',
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
        }}>
          Click an element to annotate · Esc to cancel
        </div>
      )}
    </div>
  );
};

export default FloatingToolbar;
