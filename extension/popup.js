const API_BASE = 'http://localhost:5000';

const stateIntro = document.getElementById('stateIntro');
const stateEmail = document.getElementById('stateEmail');
const stateActive = document.getElementById('stateActive');

const startBtn = document.getElementById('startBtn');
const activateBtn = document.getElementById('activateBtn');
const emailInput = document.getElementById('emailInput');
const emailError = document.getElementById('emailError');

const statusPill = document.getElementById('statusPill');
const pagesScannedEl = document.getElementById('pagesScanned');
const blockedCountEl = document.getElementById('blockedCount');
const suspiciousCountEl = document.getElementById('suspiciousCount');

const currentUrlEl = document.getElementById('currentUrl');
const riskLevelEl = document.getElementById('riskLevel');
const mlProbabilityEl = document.getElementById('mlProbability');
const heuristicScoreEl = document.getElementById('heuristicScore');
const reasonsListEl = document.getElementById('reasonsList');

const toggleRecentEl = document.getElementById('toggleRecent');
const recentListEl = document.getElementById('recentList');
const logoutBtn = document.getElementById('logoutBtn');

let recentOpen = false;

function showState(state) {
  stateIntro.classList.remove('active');
  stateEmail.classList.remove('active');
  stateActive.classList.remove('active');

  if (state === 'intro') stateIntro.classList.add('active');
  if (state === 'email') stateEmail.classList.add('active');
  if (state === 'active') stateActive.classList.add('active');
}

function setStatusPill(verdict) {
  statusPill.className = 'risk-pill';
  if (!verdict) {
    statusPill.textContent = 'Checking…';
    return;
  }

  if (verdict === 'safe') {
    statusPill.textContent = 'Protection Active';
    statusPill.classList.add('risk-safe');
  } else if (verdict === 'suspicious') {
    statusPill.textContent = 'Suspicious Site';
    statusPill.classList.add('risk-suspicious');
  } else if (verdict === 'blocked') {
    statusPill.textContent = 'Blocked Site';
    statusPill.classList.add('risk-blocked');
  } else {
    statusPill.textContent = 'Protection Active';
  }
}

function renderReasons(reasons) {
  reasonsListEl.innerHTML = '';
  if (!reasons || reasons.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No risk factors detected.';
    reasonsListEl.appendChild(li);
    return;
  }

  reasons.forEach((reason) => {
    const li = document.createElement('li');
    li.textContent = reason;
    reasonsListEl.appendChild(li);
  });
}

function renderRecentActivity(items) {
  recentListEl.innerHTML = '';
  if (!items || items.length === 0) {
    recentListEl.textContent = 'No recent activity.';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'recent-item';
    row.innerHTML = `
      <span title="${item.url}">${item.url}</span>
      <span>${item.verdict}</span>
    `;
    recentListEl.appendChild(row);
  });
}

async function fetchStats(token) {
  try {
    const resp = await fetch(`${API_BASE}/api/user/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!resp.ok) throw new Error('Failed to load stats');
    const data = await resp.json();

    pagesScannedEl.textContent = data.pages_scanned ?? 0;
    blockedCountEl.textContent = data.blocked_count ?? 0;
    suspiciousCountEl.textContent = data.suspicious_count ?? 0;
  } catch {
    pagesScannedEl.textContent = '—';
    blockedCountEl.textContent = '—';
    suspiciousCountEl.textContent = '—';
  }
}

function updateCurrentSite(result) {
  if (!result) {
    setStatusPill();
    currentUrlEl.textContent = 'No scan data yet';
    riskLevelEl.textContent = '—';
    mlProbabilityEl.textContent = '—';
    heuristicScoreEl.textContent = '—';
    renderReasons([]);
    return;
  }

  setStatusPill(result.verdict);
  currentUrlEl.textContent = result.url || 'Unknown';
  riskLevelEl.textContent = result.verdict || '—';
  mlProbabilityEl.textContent = result.ml_probability ?? '—';
  heuristicScoreEl.textContent = result.heuristic_score ?? '—';
  renderReasons(result.reasons || []);
}

async function requestCheckNow(tabId, url) {
  chrome.runtime.sendMessage({ type: 'CHECK_NOW', tabId, url });
}

async function initActive(token) {
  await fetchStats(token);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab?.url) {
      currentUrlEl.textContent = 'No active tab';
      return;
    }

    requestCheckNow(tab.id, tab.url);

    chrome.storage.local.get(['lastResult', 'recentActivity'], (data) => {
      updateCurrentSite(data.lastResult);
      renderRecentActivity(data.recentActivity || []);
    });
  });
}

startBtn.addEventListener('click', () => {
  showState('email');
  emailInput.focus();
});

activateBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!email) {
    emailError.style.display = 'block';
    emailError.textContent = 'Email is required.';
    return;
  }

  emailError.style.display = 'none';

  try {
    const resp = await fetch(`${API_BASE}/api/auth/extension-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await resp.json();
    if (!resp.ok || !data.token) {
      throw new Error(data.error || 'Activation failed');
    }

    await chrome.storage.local.set({ token: data.token });
    showState('active');
    initActive(data.token);
  } catch (err) {
    emailError.style.display = 'block';
    emailError.textContent = err.message || 'Activation failed';
  }
});

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['token']);
  showState('intro');
});

toggleRecentEl.addEventListener('click', () => {
  recentOpen = !recentOpen;
  recentListEl.style.display = recentOpen ? 'block' : 'none';
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.lastResult) {
    updateCurrentSite(changes.lastResult.newValue);
  }
  if (changes.recentActivity) {
    renderRecentActivity(changes.recentActivity.newValue || []);
  }
});

chrome.storage.local.get(['token'], (data) => {
  if (data.token) {
    showState('active');
    initActive(data.token);
  } else {
    showState('intro');
  }
});