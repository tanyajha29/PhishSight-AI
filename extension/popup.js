const urlEl = document.getElementById('url');
const heuristicEl = document.getElementById('heuristicScore');
const mlEl = document.getElementById('mlProbability');
const verdictEl = document.getElementById('finalVerdict');
const statusEl = document.getElementById('status');
const warningEl = document.getElementById('warning');

const backendInput = document.getElementById('backendUrl');
const tokenInput = document.getElementById('token');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');

const DEFAULT_ENDPOINT = 'http://localhost:5000/api/check-url';

function setWarning(show) {
  if (show) warningEl.classList.add('show');
  else warningEl.classList.remove('show');
}

function setStatus(items) {
  statusEl.innerHTML = '';
  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'OK';
    statusEl.appendChild(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    statusEl.appendChild(li);
  }
}

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['backendUrl', 'authToken'], (data) => {
      resolve({
        backendUrl: data.backendUrl || DEFAULT_ENDPOINT,
        authToken: data.authToken || ''
      });
    });
  });
}

async function saveSettings() {
  const backendUrl = backendInput.value.trim() || DEFAULT_ENDPOINT;
  const authToken = tokenInput.value.trim();

  return new Promise((resolve) => {
    chrome.storage.local.set({ backendUrl, authToken }, () => resolve());
  });
}

async function sendOverlay(verdict) {
  const isPhishing = String(verdict).toLowerCase() === 'phishing';
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs?.[0]?.id;
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, {
      type: 'PHISHING_ALERT',
      verdict: isPhishing ? 'phishing' : 'benign',
      text: isPhishing ? 'This page was flagged as suspicious. Proceed with caution.' : ''
    });
  });
}

async function checkUrl(currentUrl, backendUrl, token) {
  try {
    const resp = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ url: currentUrl })
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data.error || `Request failed (${resp.status})`);
    }

    const heuristicScore = data.heuristicScore ?? '—';
    const mlProbability = data.mlProbability ?? data.probability ?? '—';
    const finalVerdict = data.finalVerdict ?? data.prediction ?? 'unknown';

    heuristicEl.textContent = String(heuristicScore);
    mlEl.textContent = String(mlProbability);
    verdictEl.textContent = String(finalVerdict);

    const isPhishing = String(finalVerdict).toLowerCase() === 'phishing';
    setWarning(isPhishing);
    setStatus([]);
    await sendOverlay(finalVerdict);
  } catch (err) {
    heuristicEl.textContent = '—';
    mlEl.textContent = '—';
    verdictEl.textContent = 'error';
    setWarning(false);
    setStatus([String(err.message || err)]);
    await sendOverlay('benign');
  }
}

saveBtn.addEventListener('click', async () => {
  await saveSettings();
  saveStatus.textContent = 'Saved';
  setTimeout(() => { saveStatus.textContent = ''; }, 1500);
});

(async function init() {
  const settings = await loadSettings();
  backendInput.value = settings.backendUrl;
  tokenInput.value = settings.authToken;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    const url = tab?.url;

    if (!url) {
      urlEl.textContent = 'Unavailable (no active tab URL)';
      setStatus(['Unable to read URL.']);
      return;
    }

    urlEl.textContent = url;
    checkUrl(url, settings.backendUrl, settings.authToken);
  });
})();