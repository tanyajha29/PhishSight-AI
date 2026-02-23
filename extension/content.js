// Content script: shows a warning overlay on phishing verdicts
let overlayEl = null;

function showOverlay(message) {
  if (overlayEl) return;

  overlayEl = document.createElement('div');
  overlayEl.id = 'phishsight-overlay';
  overlayEl.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'right: 0',
    'bottom: 0',
    'background: rgba(127, 29, 29, 0.8)',
    'color: #fff',
    'z-index: 2147483647',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'text-align: center',
    'padding: 24px',
    'font-family: Arial, sans-serif'
  ].join(';');

  overlayEl.innerHTML = `
    <div style="max-width: 520px;">
      <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Potential Phishing Detected</div>
      <div style="font-size: 14px; line-height: 1.4;">${message}</div>
      <button id="phishsight-dismiss" style="margin-top: 16px; background: #fff; color: #7f1d1d; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer;">Dismiss</button>
    </div>
  `;

  document.body.appendChild(overlayEl);

  const dismissBtn = document.getElementById('phishsight-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      hideOverlay();
    });
  }
}

function hideOverlay() {
  if (!overlayEl) return;
  overlayEl.remove();
  overlayEl = null;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'PHISHING_ALERT') {
    if (message.verdict === 'phishing') {
      showOverlay(message.text || 'This page was flagged as suspicious. Proceed with caution.');
    } else {
      hideOverlay();
    }
  }
});