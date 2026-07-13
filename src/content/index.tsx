/**
 * Content Script Entry Point
 * Mounts the React app into a Shadow DOM host
 */

import { createRoot } from 'react-dom/client';
import App from './App';
import cssText from './styles.css?inline';
import { SHADOW_HOST_ID, EXTENSION_Z_INDEX } from '../shared/constants';

let mounted = false;
let shadowHost: HTMLElement | null = null;

function mount() {
  if (mounted) return;
  if (document.getElementById(SHADOW_HOST_ID)) return;

  // Create shadow host
  shadowHost = document.createElement('div');
  shadowHost.id = SHADOW_HOST_ID;
  shadowHost.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: ${EXTENSION_Z_INDEX};
    pointer-events: none;
  `;

  try {
    document.documentElement.appendChild(shadowHost);
  } catch (err) {
    console.error('[VFB] Failed to mount shadow host:', err);
    return;
  }

  // Attach shadow root
  let shadowRoot: ShadowRoot;
  try {
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  } catch (err) {
    console.error('[VFB] Failed to attach shadow DOM:', err);
    shadowHost.remove();
    shadowHost = null;
    return;
  }

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = cssText;
  shadowRoot.appendChild(styleEl);

  // Create a container that enables pointer events
  const container = document.createElement('div');
  container.style.cssText = 'pointer-events: auto;';
  shadowRoot.appendChild(container);

  // Mount React
  const root = createRoot(container);
  root.render(<App shadowRoot={shadowRoot} />);

  mounted = true;

  // Listen for exit event
  window.addEventListener(
    'vfb:exit',
    () => {
      root.unmount();
      shadowHost?.remove();
      shadowHost = null;
      mounted = false;
    },
    { once: true }
  );
}

function unmount() {
  window.dispatchEvent(new CustomEvent('vfb:exit'));
}

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ENABLE_ANNOTATION_MODE') {
    mount();
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'DISABLE_ANNOTATION_MODE') {
    unmount();
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'PING') {
    sendResponse({ success: true, data: { mounted } });
    return false;
  }
  // Let other messages propagate to App component listener
  return false;
});

// Auto-mount if previously active (page reload)
chrome.storage.local.get('vfb_active_tab', (_result) => {
  if (chrome.runtime.lastError) return;
  // Do not auto-mount on reload — user must click the button
});
