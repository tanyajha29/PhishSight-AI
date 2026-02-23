import argparse
import joblib

from features import vectorize


def main():
  parser = argparse.ArgumentParser(description="Predict phishing label for a URL")
  parser.add_argument("--model", default="model.pkl", help="Path to model.pkl")
  parser.add_argument("--url", required=True, help="URL to evaluate")
  args = parser.parse_args()

  model = joblib.load(args.model)
  X = vectorize([args.url])
  pred = model.predict(X)[0]

  proba = None
  if hasattr(model, "predict_proba"):
    proba = model.predict_proba(X)[0][1]

  label = "phishing" if int(pred) == 1 else "benign"
  if proba is None:
    print(f"Prediction: {label}")
  else:
    print(f"Prediction: {label} (prob={proba:.4f})")


if __name__ == "__main__":
  main()