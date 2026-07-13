import React, { useState, useEffect, useRef } from 'react';

interface Props {
  element: Element;
  onSave: (instruction: string) => Promise<void>;
  onCancel: () => void;
}

/** Modal dialog for entering annotation instruction */
const AnnotationDialog: React.FC<Props> = ({ element, onSave, onCancel }) => {
  const [instruction, setInstruction] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const tag = element.tagName.toLowerCase();
  const classes = Array.from(element.classList)
    .filter((c) => !c.startsWith('vfb-'))
    .slice(0, 3)
    .join(' ');
  const id = (element as HTMLElement).id;

  const targetLabel = [tag, id ? `#${id}` : '', classes ? `.${classes.replace(/\s+/g, '.')}` : '']
    .filter(Boolean)
    .join('');

  async function handleSave() {
    if (!instruction.trim()) return;
    setSaving(true);
    try {
      await onSave(instruction.trim());
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave();
    }
  }

  return (
    <div className="vfb-dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="vfb-dialog">
        <div className="vfb-dialog-header">
          <span className="vfb-dialog-title">Add Annotation</span>
          <button className="vfb-btn vfb-btn-secondary" onClick={onCancel} style={{ padding: '2px 8px' }}>
            ✕
          </button>
        </div>
        <div className="vfb-dialog-target" title={targetLabel}>
          {targetLabel || 'Unknown element'}
        </div>
        <textarea
          ref={textareaRef}
          className="vfb-textarea"
          placeholder="Describe the change needed…  (Ctrl+Enter to save)"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
        />
        <div className="vfb-dialog-actions">
          <button className="vfb-btn vfb-btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            className="vfb-btn vfb-btn-primary"
            onClick={handleSave}
            disabled={saving || !instruction.trim()}
          >
            {saving ? 'Saving…' : 'Save annotation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationDialog;
