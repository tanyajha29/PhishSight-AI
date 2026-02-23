# PhishSight AI

A multi-service phishing detection platform composed of a Chrome Extension, Node.js backend, Python ML API, React dashboard, and MongoDB.

**Current modules**
- Chrome Extension (Manifest V3)
- Node.js + Express backend
- Python ML service (Flask)
- React dashboard (Vite)
- MongoDB

## Architecture
**High-level flow**
1. Extension collects the active URL and sends it to the backend.
2. Backend forwards the URL to the ML service and receives a probability + verdict.
3. Backend stores results in MongoDB and returns a response to the extension/dashboard.
4. Dashboard reads aggregate metrics and user history via the backend API.

## Repository Structure
```
root/
  extension/
  backend/
  ml-service/
  dashboard/
```

## Local Setup
**Prerequisites**
- Node.js 18+ (or 20+)
- Python 3.10+
- Docker (for MongoDB)

**MongoDB (Docker)**
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

**Backend**
```bash
cd backend
npm install
npm run dev
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

**Dashboard**
```bash
cd dashboard
npm install
npm run dev
```

## Environment Variables
**Backend** (`backend/.env`)
| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/phishsight` |
| `JWT_SECRET` | JWT signing key | `change_this_secret` |
| `ML_API_URL` | ML API predict endpoint | `http://localhost:8000/predict` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |

**ML API** (`ml-service/.env` optional)
| Variable | Description | Example |
| --- | --- | --- |
| `MODEL_PATH` | Path to model pickle | `model.pkl` |

**Dashboard** (`dashboard/.env`)
| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_URL` | Backend base URL | `http://localhost:5000` |

## API Notes
**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`

**URL checks**
- `POST /api/check-url` (protected)

**Dashboard data (expected)**
- `GET /api/admin/dashboard`
- `GET /api/user/history`

## Chrome Extension
Load the `extension/` folder via `chrome://extensions` in Developer Mode. Configure the backend endpoint and JWT token in the extension popup.

## Testing
- Use Postman or curl to register/login and validate `/api/check-url` responses.
- Ensure ML API is running and returns a `probability` and `prediction`.
- Verify the dashboard can log in and fetch admin/user data.
- Verify the extension sends the current URL and displays overlay for phishing verdicts.

## Deployment
See the deployment guide in the project documentation for Render (backend), Railway (ML API), and Vercel (dashboard).

## License
Proprietary. All rights reserved.