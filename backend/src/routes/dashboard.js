const express = require('express');
const UrlLog = require('../models/UrlLog');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function formatLog(log) {
  return {
    id: log._id,
    url: log.url,
    prediction: log.prediction,
    probability: log.probability,
    timestamp: log.createdAt ? log.createdAt.toISOString() : null
  };
}

router.get('/admin/dashboard', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const [totalUrlsScanned, phishingCount, low, medium, high, recentFlagged] = await Promise.all([
      UrlLog.countDocuments(),
      UrlLog.countDocuments({ prediction: 'phishing' }),
      UrlLog.countDocuments({ probability: { $lt: 0.4 } }),
      UrlLog.countDocuments({ probability: { $gte: 0.4, $lt: 0.7 } }),
      UrlLog.countDocuments({ probability: { $gte: 0.7 } }),
      UrlLog.find({ prediction: 'phishing' })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const riskDistribution = [
      { name: 'Low', value: low, color: '#22c55e' },
      { name: 'Medium', value: medium, color: '#f59e0b' },
      { name: 'High', value: high, color: '#ef4444' }
    ];

    res.json({
      totalUrlsScanned,
      phishingCount,
      riskDistribution,
      recentFlaggedUrls: recentFlagged.map(formatLog)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/user/history', auth, async (req, res, next) => {
  try {
    const history = await UrlLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      history: history.map(formatLog)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;