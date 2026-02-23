# Phishing Detection Platform

## Architecture Overview
This repository hosts a phishing detection platform composed of four main components and a database:

- **Chrome Extension (MV3)**: Captures URL and page signals (e.g., DOM features, SSL metadata) and sends them to the backend for scoring. It can also display real-time warnings to users.
- **Node.js + Express Backend**: Serves as the API gateway, handles authentication, rate limiting, telemetry ingestion, and orchestrates requests to the ML service.
- **Python ML Service**: Hosts the phishing detection model(s), feature extraction, and inference endpoints.
- **React Dashboard (Vite)**: Provides analytics, threat monitoring, model performance tracking, and administrative controls.
- **MongoDB**: Stores user accounts, detection events, feature snapshots, model metadata, and audit logs.

### High-Level Data Flow
1. Extension sends URL/page signals to the backend.
2. Backend normalizes signals and forwards to the ML service.
3. ML service returns a classification and confidence score.
4. Backend persists the event to MongoDB and returns a response to the extension.
5. Dashboard queries the backend for analytics and monitoring.

## Repository Layout
```
root/
  extension/
  backend/
  ml-service/
  dashboard/
```