const blockedUrlEl = document.getElementById('blockedUrl');
const blockedReasonsEl = document.getElementById('blockedReasons');
const goBackBtn = document.getElementById('goBack');
const proceedBtn = document.getElementById('proceedAnyway');

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function renderReasons(reasons) {
  blockedReasonsEl.innerHTML = '';
  if (!reasons || reasons.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No additional details available.';
    blockedReasonsEl.appendChild(li);
    return;
  }
  reasons.forEach((reason) => {
    const li = document.createElement('li');
    li.textContent = reason;
    blockedReasonsEl.appendChild(li);
  });
}

function getUrlParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get('url');
}

chrome.storage.local.get(['blockedContext', 'whitelist'], (data) => {
  const context = data.blockedContext || {};
  const url = getUrlParam() || context.url || 'Unknown URL';

  blockedUrlEl.textContent = url;
  renderReasons(context.reasons || []);

  goBackBtn.addEventListener('click', () => {
    window.history.back();
  });

  proceedBtn.addEventListener('click', () => {
    const origin = getOrigin(url);
    if (!origin) {
      window.location.href = url;
      return;
    }

    const whitelist = data.whitelist || [];
    if (!whitelist.includes(origin)) {
      whitelist.push(origin);
      chrome.storage.local.set({ whitelist }, () => {
        window.location.href = url;
      });
    } else {
      window.location.href = url;
    }
  });
});