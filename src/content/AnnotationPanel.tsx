import React, { useState } from 'react';
import type { Annotation } from '../shared/types';

type FilterType = 'all' | 'open' | 'resolved';

interface Props {
  annotations: Annotation[];
  onClose: () => void;
  onUpdate: (ann: Annotation) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLocate: (ann: Annotation) => void;
}

interface ItemProps {
  ann: Annotation;
  index: number;
  onUpdate: (ann: Annotation) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLocate: (ann: Annotation) => void;
}

const AnnotationItem: React.FC<ItemProps> = ({ ann, index, onUpdate, onDelete, onLocate }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ann.instruction);
  const [busy, setBusy] = useState(false);

  async function saveEdit() {
    if (!draft.trim()) return;
    setBusy(true);
    await onUpdate({ ...ann, instruction: draft.trim(), updatedAt: new Date().toISOString() });
    setBusy(false);
    setEditing(false);
  }

  async function toggleStatus() {
    setBusy(true);
    await onUpdate({
      ...ann,
      status: ann.status === 'open' ? 'resolved' : 'open',
      updatedAt: new Date().toISOString(),
    });
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this annotation?')) return;
    setBusy(true);
    await onDelete(ann.id);
    setBusy(false);
  }

  return (
    <div className={`vfb-ann-item ${ann.status}`}>
      <div className="vfb-ann-item-header">
        <div className={`vfb-ann-num ${ann.status}`}>{index}</div>
        <div className="vfb-ann-meta">
          <div className="vfb-ann-tag">{`<${ann.target.tagName}>`}</div>
          {ann.target.text && (
            <div className="vfb-ann-text" title={ann.target.text}>
              {ann.target.text.slice(0, 40)}{ann.target.text.length > 40 ? '…' : ''}
            </div>
          )}
        </div>
        <span className={`vfb-status-chip ${ann.status}`}>
          {ann.status === 'resolved' ? '✓ Done' : 'Open'}
        </span>
      </div>

      {editing ? (
        <div className="vfb-ann-edit">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="vfb-ann-actions">
            <button className="vfb-ann-btn" onClick={saveEdit} disabled={busy}>
              Save
            </button>
            <button
              className="vfb-ann-btn"
              onClick={() => { setEditing(false); setDraft(ann.instruction); }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="vfb-ann-instruction">{ann.instruction}</div>
          <div className="vfb-ann-actions">
            <button className="vfb-ann-btn" onClick={() => onLocate(ann)}>
              📍 Locate
            </button>
            <button className="vfb-ann-btn" onClick={() => setEditing(true)} disabled={busy}>
              ✏️ Edit
            </button>
            <button className={`vfb-ann-btn success`} onClick={toggleStatus} disabled={busy}>
              {ann.status === 'open' ? '✓ Resolve' : '↩ Reopen'}
            </button>
            <button className="vfb-ann-btn danger" onClick={handleDelete} disabled={busy}>
              🗑 Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/** Side panel showing all annotations for the current page */
const AnnotationPanel: React.FC<Props> = ({
  annotations,
  onClose,
  onUpdate,
  onDelete,
  onLocate,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = annotations.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div className="vfb-panel">
      <div className="vfb-panel-header">
        <div className="vfb-panel-title">
          <span>🗒</span>
          <span>Annotations ({annotations.length})</span>
        </div>
        <button className="vfb-panel-close" onClick={onClose} title="Close panel">
          ✕
        </button>
      </div>

      <div className="vfb-panel-filters">
        {(['all', 'open', 'resolved'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`vfb-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${annotations.length})` : f === 'open' ? `Open (${annotations.filter(a => a.status === 'open').length})` : `Done (${annotations.filter(a => a.status === 'resolved').length})`}
          </button>
        ))}
      </div>

      <div className="vfb-panel-list">
        {filtered.length === 0 ? (
          <div className="vfb-panel-empty">
            {annotations.length === 0
              ? 'No annotations yet.\nUse the selector tool to add one.'
              : 'No annotations match this filter.'}
          </div>
        ) : (
          filtered.map((ann, idx) => (
            <AnnotationItem
              key={ann.id}
              ann={ann}
              index={idx + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onLocate={onLocate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AnnotationPanel;
