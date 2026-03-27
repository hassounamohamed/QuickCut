# BarberBook Backend

FastAPI backend for QuickCut Barber Booking.

## Requirements
- Python 3.11+
- PostgreSQL 15+

## Local setup
1. Create `.env` in this folder.
2. Required variables:
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `SECRET_KEY`
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Run:
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## Production env recommendations
- `APP_ENV=production`
- `SECRET_KEY` must be a long random value.
- `CORS_ORIGINS` should list your frontend domains (comma-separated).
- `SQL_ECHO=false`
- Use HTTPS at reverse proxy level (Nginx/Caddy).

## Docker Compose
- `docker-compose up -d --build`
- Ensure `.env` includes `DB_PASSWORD` and `SECRET_KEY`.

### Nginx Reverse Proxy (Enabled)
- Docker Compose now includes an `nginx` service in front of the API.
- Public traffic goes to Nginx on `${NGINX_HTTP_PORT:-80}`.
- API container is internal-only (not exposed directly).
- Auth endpoints `/auth/login` and `/auth/register` have basic rate limiting at proxy level.

To run with Nginx:
```bash
docker compose up -d --build
```

To change external port:
```bash
NGINX_HTTP_PORT=8080 docker compose up -d --build
```

## Testing
Run the test suite with pytest:
```bash
pip install -r requirements.txt
pytest
```

Key features:
- In-memory SQLite for fast, isolated tests
- ~20+ test cases covering auth, bookings, and favorites
- Fixtures for database, auth tokens, and test client

See `TESTING_GUIDE.md` for detailed testing docs.

## Monitoring & Health Checks
The app includes built-in monitoring:
- **Health endpoint:** `GET /health` returns uptime, request count, and error rate
- **Sentry integration:** Optional error tracking (set `SENTRY_DSN` env var)
- **Structured logging:** Set `LOG_LEVEL` env var (DEBUG, INFO, WARNING, ERROR)

See `MONITORING_GUIDE.md` for Sentry setup and alert configuration.

## Production Checklist
1. ✅ Security hardened (JWT secrets, HTTPS, rate limiting)
2. ✅ Database migrations (Alembic)
3. ✅ Test coverage (20+ tests)
4. ✅ Error tracking (Sentry optional)
5. ✅ Health checks (ready for load balancers)

See `PRODUCTION_READINESS_AUDIT.md` and `PRODUCTION_HARDENING.md` for full details.

## Notes
- API serves uploaded images from `/uploads`.
- Startup keeps compatibility for `slot_minutes` and removes legacy `confirme_password` column if present.
