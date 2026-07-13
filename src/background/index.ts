/**
 * Background Service Worker
 * Handles cross-tab messaging and coordinates between popup and content scripts
 */

import type { ExtensionMessage } from '../shared/types';
import { isInjectableUrl } from '../shared/utils';

/** Relay messages from popup to the active tab's content script */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  // Get active tab first (used by all message types)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    const tabUrl = tab.url ?? '';
    if (!isInjectableUrl(tabUrl)) {
      sendResponse({ success: false, error: 'This page cannot be annotated (browser internal page)' });
      return;
    }

    // Try sending message to content script first
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not yet loaded — try injecting it
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id! },
            files: ['content/index.js'],
          })
          .then(() => {
            // Injection only initializes the listener. Always retry the
            // original message so the response reflects actual page state.
            chrome.tabs.sendMessage(tab.id!, message, (retryResponse) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  success: false,
                  error: chrome.runtime.lastError.message || 'Failed to connect to page',
                });
              } else {
                sendResponse(retryResponse);
              }
            });
          })
          .catch((err: Error) => {
            sendResponse({ success: false, error: err.message || 'Script injection failed' });
          });
      } else {
        sendResponse(response);
      }
    });
  });

  // Return true to keep message channel open for async response
  return true;
});

/** Handle tab updates — notify content script when page navigates */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    // Content script re-initializes itself on page load
    chrome.tabs.sendMessage(tabId, { type: 'PAGE_READY' }).catch(() => {
      // Tab may not have content script — ignore
    });
  }
});
