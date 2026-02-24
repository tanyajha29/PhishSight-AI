const express = require('express');
const UrlLog = require('../models/UrlLog');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/user/stats', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [pagesScanned, blockedCount, suspiciousCount] = await Promise.all([
      UrlLog.countDocuments({ user: userId }),
      UrlLog.countDocuments({ user: userId, verdict: 'blocked' }),
      UrlLog.countDocuments({ user: userId, verdict: 'suspicious' })
    ]);

    res.json({
      pages_scanned: pagesScanned,
      blocked_count: blockedCount,
      suspicious_count: suspiciousCount
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;