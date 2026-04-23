#!/bin/bash
# Deployment script for Railway / Render

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting deployment process..."

# Navigate to the backend directory where main.py lives
cd backend

# Railway dynamically assigns a port via the $PORT environment variable.
# We fallback to 8000 if $PORT is not set (e.g., for local testing).
PORT=${PORT:-8000}

echo "Starting FastAPI server on port $PORT..."

# Run the production ASGI server
exec uvicorn main:app --host 0.0.0.0 --port $PORT
