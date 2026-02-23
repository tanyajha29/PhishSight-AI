from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

from features import vectorize

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.getenv("MODEL_PATH", "model.pkl")
_model = None


def load_model():
  global _model
  if _model is None:
    if not os.path.exists(MODEL_PATH):
      raise FileNotFoundError(
        f"Model not found at {MODEL_PATH}. Train a model first (python train.py)."
      )
    _model = joblib.load(MODEL_PATH)
  return _model


@app.route("/health", methods=["GET"])
def health():
  return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST"])
def predict():
  try:
    payload = request.get_json(silent=True) or {}
    url = payload.get("url")

    if not url or not isinstance(url, str):
      return jsonify({"error": "Invalid or missing 'url'"}), 400

    model = load_model()
    X = vectorize([url])

    if hasattr(model, "predict_proba"):
      proba = float(model.predict_proba(X)[0][1])
    else:
      return jsonify({"error": "Model does not support probability output"}), 500

    pred = int(model.predict(X)[0])
    label = "phishing" if pred == 1 else "benign"

    return jsonify({
      "probability": round(proba, 4),
      "prediction": label
    })

  except FileNotFoundError as exc:
    return jsonify({"error": str(exc)}), 500
  except Exception as exc:
    return jsonify({"error": "Prediction failed", "details": str(exc)}), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=8000, debug=False)