import argparse
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from features import vectorize


def evaluate(model, X_test, y_test):
  y_pred = model.predict(X_test)
  metrics = {
    "accuracy": accuracy_score(y_test, y_pred),
    "precision": precision_score(y_test, y_pred, zero_division=0),
    "recall": recall_score(y_test, y_pred, zero_division=0),
    "f1": f1_score(y_test, y_pred, zero_division=0)
  }
  report = classification_report(y_test, y_pred, zero_division=0)
  return metrics, report


def main():
  parser = argparse.ArgumentParser(description="Train phishing URL detection models")
  parser.add_argument("--data", default="data/sample_urls.csv", help="CSV with columns: url,label")
  parser.add_argument("--output", default="model.pkl", help="Output model path")
  parser.add_argument("--test-size", type=float, default=0.2)
  parser.add_argument("--random-state", type=int, default=42)
  args = parser.parse_args()

  df = pd.read_csv(args.data)
  if "url" not in df.columns or "label" not in df.columns:
    raise ValueError("CSV must include 'url' and 'label' columns")

  X = vectorize(df["url"].tolist())
  y = df["label"].astype(int).values

  X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=args.test_size, random_state=args.random_state, stratify=y
  )

  models = {
    "logistic_regression": Pipeline([
      ("scaler", StandardScaler()),
      ("clf", LogisticRegression(max_iter=1000))
    ]),
    "random_forest": RandomForestClassifier(
      n_estimators=200,
      random_state=args.random_state,
      n_jobs=-1
    )
  }

  results = {}

  for name, model in models.items():
    model.fit(X_train, y_train)
    metrics, report = evaluate(model, X_test, y_test)
    results[name] = {
      "model": model,
      "metrics": metrics,
      "report": report
    }

    print(f"\n== {name} ==")
    print("Metrics:", metrics)
    print("Classification report:\n", report)

  best_name = max(results.keys(), key=lambda k: results[k]["metrics"]["f1"])
  best_model = results[best_name]["model"]

  joblib.dump(best_model, args.output)
  print(f"\nBest model: {best_name}")
  print(f"Saved model to: {args.output}")


if __name__ == "__main__":
  main()