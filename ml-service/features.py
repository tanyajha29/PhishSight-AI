import numpy as np
from urllib.parse import urlparse

FEATURE_NAMES = [
  "url_length",
  "num_dots",
  "num_digits",
  "has_at",
  "has_https"
]


def extract_features(url: str) -> list:
  if not isinstance(url, str):
    url = str(url)

  parsed = urlparse(url)
  hostname = parsed.netloc or ""

  url_length = len(url)
  num_dots = url.count(".")
  num_digits = sum(ch.isdigit() for ch in url)
  has_at = 1 if "@" in url else 0
  has_https = 1 if url.lower().startswith("https://") else 0

  return [url_length, num_dots, num_digits, has_at, has_https]


def vectorize(urls):
  return np.array([extract_features(u) for u in urls], dtype=float)