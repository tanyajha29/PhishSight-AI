const urlEl = document.getElementById('url');
const scoreEl = document.getElementById('score');
const reasonsEl = document.getElementById('reasons');
const warningEl = document.getElementById('warning');

function setWarning(show) {
  if (show) warningEl.classList.add('show');
  else warningEl.classList.remove('show');
}

function setReasons(reasons) {
  reasonsEl.innerHTML = '';
  if (!reasons || reasons.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No suspicious signals detected.';
    reasonsEl.appendChild(li);
    return;
  }
  for (const reason of reasons) {
    const li = document.createElement('li');
    li.textContent = reason;
    reasonsEl.appendChild(li);
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  const url = tab?.url;

  if (!url) {
    urlEl.textContent = 'Unavailable (no active tab URL)';
    scoreEl.textContent = '—';
    setReasons(['Unable to read URL.']);
    setWarning(false);
    return;
  }

  urlEl.textContent = url;

  chrome.runtime.sendMessage({ type: 'ANALYZE_URL', url }, (response) => {
    if (chrome.runtime.lastError) {
      scoreEl.textContent = '—';
      setReasons([chrome.runtime.lastError.message]);
      setWarning(false);
      return;
    }

    if (!response?.ok) {
      scoreEl.textContent = '—';
      setReasons([response?.error || 'Unknown error']);
      setWarning(false);
      return;
    }

    const { score, reasons, thresholdExceeded } = response.result;
    scoreEl.textContent = String(score);
    setReasons(reasons);
    setWarning(thresholdExceeded);
  });
});