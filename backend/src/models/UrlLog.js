const mongoose = require('mongoose');

const urlLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    prediction: { type: String, enum: ['phishing', 'benign'], required: true },
    probability: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UrlLog', urlLogSchema);