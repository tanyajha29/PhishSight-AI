const express = require('express');
const axios = require('axios');

const UrlLog = require('../models/UrlLog');
const auth = require('../middleware/auth');

const router = express.Router();

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

function computeHeuristic(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { score: 0, reasons: ['Invalid URL'] };
  }

  const hostname = parsed.hostname || '';
  const reasons = [];
  let score = 0;

  const hasIp = isIPv4(hostname) || isIPv6(hostname);
  if (hasIp) {
    score += 30;
    reasons.push('Uses an IP address instead of a domain');
  }

  if (url.length > 75) {
    score += 15;
    reasons.push('URL length greater than 75 characters');
  }

  if (url.includes('@')) {
    score += 15;
    reasons.push('Contains @ symbol');
  }

  if (hasMultipleSubdomains(hostname)) {
    score += 20;
    reasons.push('Multiple subdomains detected');
  }

  if (hasSuspiciousTld(hostname)) {
    score += 20;
    reasons.push('Suspicious top-level domain');
  }

  return { score: Math.min(score, 100), reasons };
}

router.post('/check-url', auth, async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    const mlApiUrl = process.env.ML_API_URL || 'http://127.0.0.1:8000/predict';
    const mlResp = await axios.post(mlApiUrl, { url }, { timeout: 5000 });

    const mlProbability = Number(mlResp.data?.probability ?? 0);
    if (Number.isNaN(mlProbability)) {
      return res.status(502).json({ error: 'Invalid response from ML API' });
    }

    const heuristic = computeHeuristic(url);
    const heuristicScore = heuristic.score;
    const reasons = [...heuristic.reasons];

    if (mlProbability >= 0.7) {
      reasons.push('High ML risk score');
    } else if (mlProbability >= 0.4) {
      reasons.push('Moderate ML risk score');
    }

    let verdict = 'safe';
    if (mlProbability >= 0.7 || heuristicScore >= 70) {
      verdict = 'blocked';
    } else if (mlProbability >= 0.4 || heuristicScore >= 40) {
      verdict = 'suspicious';
    }

    await UrlLog.create({
      user: req.user.id,
      url,
      verdict,
      mlProbability,
      heuristicScore,
      reasons
    });

    return res.json({
      ml_probability: mlProbability,
      heuristic_score: heuristicScore,
      verdict,
      reasons
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'ML API timeout' });
    }
    return next(err);
  }
});

module.exports = router;