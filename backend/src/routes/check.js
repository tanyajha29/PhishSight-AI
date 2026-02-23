const express = require('express');
const axios = require('axios');

const UrlLog = require('../models/UrlLog');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/check-url', auth, async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    const mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000/predict';
    const mlResp = await axios.post(mlApiUrl, { url }, { timeout: 5000 });

    const { probability, prediction } = mlResp.data || {};
    if (probability === undefined || !prediction) {
      return res.status(502).json({ error: 'Invalid response from ML API' });
    }

    const log = await UrlLog.create({
      user: req.user.id,
      url,
      prediction,
      probability
    });

    return res.json({
      id: log._id,
      url: log.url,
      prediction: log.prediction,
      probability: log.probability
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'ML API timeout' });
    }
    return next(err);
  }
});

module.exports = router;