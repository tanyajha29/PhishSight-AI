# PhishSight AI

PhishSight AI is a product-style phishing protection extension with automatic background scanning and blocking. It uses a Node.js backend, a Python ML API, and MongoDB for storage.

## Architecture
**High-level flow**
1. Extension runs in the background and monitors active tabs.
2. The extension sends URLs to the backend `/api/check-url` with a JWT.
3. Backend calls the ML API `/predict`, combines ML + heuristic scoring, and stores results in MongoDB.
4. Extension updates its UI, badge, and blocks unsafe pages.

## Repository Structure
```
root/
  extension/
  backend/
  ml-service/
```

## Local Setup
**Prerequisites**
- Node.js 18+ (or 20+)
- Python 3.10+
- Docker (MongoDB) or a local MongoDB instance

**MongoDB (Docker)**
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

**ML API**
```bash
cd ml-service
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python train.py --data data/sample_urls.csv --output model.pkl
python app.py
```

**Backend**
```bash
cd backend
npm install
npm run dev
```

**Extension**
1. Open `chrome://extensions`
2. Enable Developer Mode
3. Load unpacked ? select `extension/`

## Environment Variables
**Backend** (`backend/.env`)
| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/phishsight` |
| `JWT_SECRET` | JWT signing key | `change_this_secret` |
| `ML_API_URL` | ML API predict endpoint | `http://127.0.0.1:8000/predict` |
| `CORS_ORIGIN` | Allowed origins (optional) | `http://localhost:5174` |

## Extension API Endpoints
**Email-only onboarding**
- `POST /api/auth/extension-login`

Body:
```json
{ "email": "user@example.com" }
```

Response:
```json
{ "token": "<jwt>", "user": { ... } }
```

**URL check**
- `POST /api/check-url` (protected)

Response:
```json
{
  "ml_probability": 0.91,
  "heuristic_score": 78,
  "verdict": "blocked",
  "reasons": ["..."]
}
```

**User stats**
- `GET /api/user/stats` (protected)

Response:
```json
{
  "pages_scanned": 6241,
  "blocked_count": 3,
  "suspicious_count": 12
}
```

## Usage Workflow
1. Install extension.
2. Enter email once to activate protection.
3. Extension stores JWT in `chrome.storage.local`.
4. Background scanning runs automatically on tab updates.
5. Unsafe sites are blocked with a warning page and reasons.
6. Stats + current site details are visible in the popup.

## Security Notes
- JWT is stored only in `chrome.storage.local`.
- Token is never shown in the UI.
- Logout clears all local token data.

## Testing
- Open the extension popup and activate with email.
- Visit a safe site to see `Safe` status.
- Visit a suspicious URL to see `Suspicious` status.
- Visit a phishing-style URL to trigger `Blocked` and the warning page.

## License
Proprietary. All rights reserved.