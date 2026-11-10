#!/bin/sh
set -e

echo "==> [Entrypoint] Checking database readiness..."
python -m app.db.pre_start

echo "==> [Entrypoint] Running database migrations (alembic upgrade head)..."
alembic upgrade head

if [ "$SEED_DATABASE" = "true" ] || [ "$SEED_DATABASE" = "1" ]; then
    echo "==> [Entrypoint] SEED_DATABASE is enabled. Seeding demo data..."
    python -m app.db.seed
else
    echo "==> [Entrypoint] SEED_DATABASE is disabled or not set. Skipping seeder."
fi

echo "==> [Entrypoint] Starting application process: $@"
exec "$@"
