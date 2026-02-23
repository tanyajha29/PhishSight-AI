const SUSPICIOUS_TLDS = new Set(['xyz', 'top', 'info']);

function isIPv4(hostname) {
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return false;
  return hostname.split('.').every((octet) => Number(octet) <= 255);
}

function isIPv6(hostname) {
  return hostname.includes(':');
}

function hasMultipleSubdomains(hostname) {
  const parts = hostname.split('.').filter(Boolean);
  return parts.length >= 4;
}

function hasSuspiciousTld(hostname) {
  const parts = hostname.split('.').filter(Boolean);
  const tld = parts[parts.length - 1]?.toLowerCase();
  return SUSPICIOUS_TLDS.has(tld);
}

export function analyzeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      url: rawUrl,
      hostname: '',
      score: 0,
      reasons: ['Invalid URL'],
      thresholdExceeded: false,
      signals: {}
    };
  }

  const hostname = url.hostname;
  const reasons = [];
  let score = 0;

  const hasIp = isIPv4(hostname) || isIPv6(hostname);
  if (hasIp) {
    score += 3;
    reasons.push('Uses an IP address instead of a domain');
  }

  const longUrl = rawUrl.length > 75;
  if (longUrl) {
    score += 2;
    reasons.push('URL length greater than 75 characters');
  }

  const hasAtSymbol = rawUrl.includes('@');
  if (hasAtSymbol) {
    score += 2;
    reasons.push('Contains @ symbol');
  }

  const multiSub = hasMultipleSubdomains(hostname);
  if (multiSub) {
    score += 2;
    reasons.push('Multiple subdomains');
  }

  const suspiciousTld = hasSuspiciousTld(hostname);
  if (suspiciousTld) {
    score += 2;
    reasons.push('Suspicious TLD');
  }

  return {
    url: rawUrl,
    hostname,
    score,
    reasons,
    thresholdExceeded: score > 5,
    signals: {
      hasIp,
      longUrl,
      hasAtSymbol,
      multiSub,
      suspiciousTld
    }
  };
}