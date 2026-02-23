import { analyzeUrl } from './utils/urlAnalyzer.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('PhishSight AI extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'ANALYZE_URL') {
    try {
      const result = analyzeUrl(message.url);
      sendResponse({ ok: true, result });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
    return true;
  }
});