const API_BASE = 'http://localhost:5000';
const BLOCKED_PAGE = chrome.runtime.getURL('blocked.html');

const lastChecked = new Map();

function isHttpUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function updateBadge(tabId, verdict) {
  let text = '';
  let color = '#22c55e';

  if (verdict === 'blocked') {
    text = 'X';
    color = '#ef4444';
  } else if (verdict === 'suspicious') {
    text = '!';
    color = '#f59e0b';
  } else if (verdict === 'safe') {
    text = 'OK';
    color = '#22c55e';
  }

  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

async function getStored(key, fallback) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (data) => resolve(data[key] ?? fallback));
  });
}

async function setStored(values) {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, () => resolve());
  });
}

async function appendRecentActivity(entry) {
  const recent = await getStored('recentActivity', []);
  recent.unshift(entry);
  const trimmed = recent.slice(0, 10);
  await setStored({ recentActivity: trimmed });
}

async function runCheck(tabId, url, force = false) {
  if (!url || !isHttpUrl(url)) {
    updateBadge(tabId, '');
    return;
  }

  if (url.startsWith(BLOCKED_PAGE)) {
    return;
  }

  const token = await getStored('token', '');
  if (!token) {
    updateBadge(tabId, '');
    return;
  }

  if (!force && lastChecked.get(tabId) === url) {
    return;
  }
  lastChecked.set(tabId, url);

  const whitelist = await getStored('whitelist', []);
  const origin = getOrigin(url);
  if (origin && whitelist.includes(origin)) {
    const result = {
      url,
      verdict: 'safe',
      ml_probability: 0,
      heuristic_score: 0,
      reasons: ['Whitelisted by user'],
      timestamp: new Date().toISOString()
    };
    await setStored({ lastResult: result });
    await appendRecentActivity(result);
    updateBadge(tabId, 'safe');
    return;
  }

  try {
    const resp = await fetch(`${API_BASE}/api/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    });

    if (!resp.ok) {
      throw new Error(`API error (${resp.status})`);
    }

    const data = await resp.json();
    const result = {
      url,
      verdict: data.verdict,
      ml_probability: data.ml_probability,
      heuristic_score: data.heuristic_score,
      reasons: data.reasons || [],
      timestamp: new Date().toISOString()
    };

    await setStored({ lastResult: result });
    await appendRecentActivity(result);
    updateBadge(tabId, data.verdict);

    if (data.verdict === 'blocked') {
      await setStored({ blockedContext: result });
      const blockedUrl = `${BLOCKED_PAGE}?url=${encodeURIComponent(url)}`;
      chrome.tabs.update(tabId, { url: blockedUrl });
    }
  } catch {
    updateBadge(tabId, '');
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    runCheck(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab?.url) {
      runCheck(tabId, tab.url);
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CHECK_NOW') {
    const tabId = message.tabId ?? sender.tab?.id;
    if (tabId && message.url) {
      runCheck(tabId, message.url, true);
    }
  }
});