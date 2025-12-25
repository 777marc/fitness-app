#!/bin/sh
set -e

# Construct DATABASE_URL from individual environment variables
if [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  echo "DATABASE_URL configured"
fi

# Wait for database to be ready (with timeout)
if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  timeout=30
  while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
      echo "Database connection timeout!"
      exit 1
    fi
    sleep 1
  done
  echo "Database is ready"
  
  # Run database migrations
  echo "Running database migrations..."
  npx prisma migrate deploy
  echo "Migrations complete"
fi

# Start the Next.js server
echo "Starting Next.js server..."
exec node server.js
