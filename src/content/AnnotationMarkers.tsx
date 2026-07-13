import React, { useEffect, useState, useCallback } from 'react';
import type { Annotation } from '../shared/types';

interface MarkerPosition {
  id: string;
  x: number;
  y: number;
  valid: boolean;
}

interface Props {
  annotations: Annotation[];
  onMarkerClick: (id: string) => void;
}

/** Computes marker positions by resolving CSS selectors */
function resolveMarkerPositions(annotations: Annotation[]): MarkerPosition[] {
  return annotations.map((ann) => {
    try {
      const el = document.querySelector(ann.target.cssSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          id: ann.id,
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          valid: true,
        };
      }
    } catch {
      // Invalid selector — use stored bounding box
    }
    // Fallback: use stored bounding box
    return {
      id: ann.id,
      x: ann.target.boundingBox.left,
      y: ann.target.boundingBox.top,
      valid: false,
    };
  });
}

/** Renders numbered annotation markers on the page */
const AnnotationMarkers: React.FC<Props> = ({ annotations, onMarkerClick }) => {
  const [positions, setPositions] = useState<MarkerPosition[]>([]);

  const update = useCallback(() => {
    setPositions(resolveMarkerPositions(annotations));
  }, [annotations]);

  useEffect(() => {
    update();

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    // ResizeObserver for DOM changes
    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(update);
      observer.observe(document.body, { childList: true, subtree: true, attributes: false });
    }

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [update]);

  return (
    <>
      {annotations.map((ann, idx) => {
        const pos = positions.find((p) => p.id === ann.id);
        if (!pos) return null;

        return (
          <div
            key={ann.id}
            className={`vfb-marker ${ann.status === 'resolved' ? 'resolved' : ''} ${!pos.valid ? 'invalid' : ''}`}
            style={{
              top: pos.y - 11,
              left: pos.x - 11,
            }}
            title={ann.instruction}
            onClick={() => onMarkerClick(ann.id)}
          >
            {idx + 1}
          </div>
        );
      })}
    </>
  );
};

export default AnnotationMarkers;
