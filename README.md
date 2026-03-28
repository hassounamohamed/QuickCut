# QuickCut

QuickCut is a barber booking platform with:
- A FastAPI + PostgreSQL backend (`BarberBook-back`)
- A React Native mobile app built with Expo (`BarberBookingApp`)

## Project Structure

```text
QuickCut/
├─ BarberBook-back/      # FastAPI backend
└─ BarberBookingApp/     # Expo mobile app
```

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy (async)
- PostgreSQL
- Alembic
- Uvicorn

### Mobile
- Expo (React Native + TypeScript)
- Expo Router
- Axios
- i18n (French, English, Arabic)

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 16+ (or Docker)
- Docker + Docker Compose (optional but recommended)

## 1) Backend Setup (`BarberBook-back`)

### Option A: Run with Docker (recommended)

1. Go to backend folder:

```bash
cd BarberBook-back
```

2. Create `.env` file:

```env
DB_NAME=QuickCut
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_EXTERNAL_PORT=5433

SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080
APP_SCHEME=trimtime
```

3. Start services:

```bash
docker compose up --build
```

Backend will be available at:
- http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### Option B: Run locally (without Docker)

1. Go to backend folder:

```bash
cd BarberBook-back
```

2. Create and activate virtual environment:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create `.env` with at least:

```env
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=QuickCut
DB_USER=postgres
SECRET_KEY=change-me-in-production
```

5. Run API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 2) Mobile App Setup (`BarberBookingApp`)

1. Go to mobile folder:

```bash
cd BarberBookingApp
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Set backend URL for development by creating `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:8000
```

Notes:
- If this variable is not set, the app tries to auto-detect host from Expo runtime.
- For real devices, use your machine LAN IP (not `localhost`).

4. Start app:

```bash
npm run start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

Language support:
- Mobile app supports `fr`, `en`, and `ar`.
- Language can be changed from auth/profile UI and is persisted locally.

## API Notes

- Root health endpoint: `GET /`
- API docs: `/docs`
- Static uploads are served from `/uploads`

## Environment Variables Summary

### Backend (`BarberBook-back/.env`)

- `DB_USER`
- `DB_PASSWORD` (required)
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_MINUTES`
- `APP_SCHEME`

### Mobile (`BarberBookingApp/.env`)

- `EXPO_PUBLIC_API_BASE_URL`

## Troubleshooting

- Database connection error:
  - Verify PostgreSQL is running and credentials in `.env` are correct.
- Mobile app cannot reach backend:
  - Ensure phone/emulator and backend are on reachable network.
  - Set `EXPO_PUBLIC_API_BASE_URL` explicitly to your machine IP.
- Port conflict:
  - Change backend port or stop conflicting process.

## Security

- Never commit real secrets.
- Keep `.env` files local only.
- Use production-grade `SECRET_KEY` and database credentials in deployment.
