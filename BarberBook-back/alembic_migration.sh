#!/bin/bash

# Stop on any error
set -e

# Run Alembic inside Docker api service
# Assumes docker-compose.yml has service named 'api'

# 1️⃣ Initialize Alembic environment (only first time)
docker-compose run --rm api sh -c '
if [ ! -d "migrations/versions" ]; then
    echo "Initializing Alembic..."
    alembic init migrations
fi
'

# 2️⃣ Generate a new migration
echo "Generating new migration..."
docker-compose run --rm api alembic revision --autogenerate -m "auto migration"

# 3️⃣ Apply migrations
echo "Applying migrations..."
docker-compose run --rm api alembic upgrade head

echo "✅ Alembic migrations applied successfully!"