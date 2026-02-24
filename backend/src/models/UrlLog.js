const mongoose = require('mongoose');

const urlLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    verdict: { type: String, enum: ['safe', 'suspicious', 'blocked'], required: true },
    mlProbability: { type: Number, required: true },
    heuristicScore: { type: Number, required: true },
    reasons: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UrlLog', urlLogSchema);
