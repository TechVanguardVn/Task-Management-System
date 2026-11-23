#!/bin/sh
set -e

echo "> Applying database migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  echo "> Seeding demo data..."
  npx prisma db seed
fi

echo "> Starting API server..."
exec node dist/server.js
