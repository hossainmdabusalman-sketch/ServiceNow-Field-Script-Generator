#!/bin/bash

echo "======================================"
echo " ServiceNow Script Generator"
echo "======================================"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# -------------------------------
# Check Python
# -------------------------------
echo ""
echo "[0/2] Checking Python..."

PYTHON_CMD="python"

if ! command -v $PYTHON_CMD &> /dev/null
then
    echo "❌ Python not found. Please install Python 3.10+"
    exit 1
fi

echo "✔ Python found: $($PYTHON_CMD --version)"

# -------------------------------
# Start Backend
# -------------------------------
echo ""
echo "[1/2] Starting Python backend (FastAPI)..."

cd "$ROOT_DIR/backend" || { echo "❌ Backend folder not found"; exit 1; }

# Install dependencies safely
$PYTHON_CMD -m pip install --upgrade pip -q
$PYTHON_CMD -m pip install -r requirements.txt -q

# Check uvicorn
if ! $PYTHON_CMD -m uvicorn --version &> /dev/null
then
    echo "Installing uvicorn..."
    $PYTHON_CMD -m pip install uvicorn fastapi -q
fi

# Run backend
$PYTHON_CMD -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "  Backend PID: $BACKEND_PID"
echo "  API: http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"

echo "  Waiting for backend to be ready..."
MAX_RETRIES=10
RETRY_COUNT=0
until $(curl -sSf http://127.0.0.1:8000/api/health > /dev/null 2>&1) || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then echo "⚠️  Backend is taking a while to start..."; fi

# -------------------------------
# Start Frontend
# -------------------------------
echo ""
echo "[2/2] Starting React frontend..."

if [ ! -d "$ROOT_DIR/frontend" ]; then
    echo "❌ Frontend folder not found. Skipping frontend."
else
    cd "$ROOT_DIR/frontend" || { echo "❌ Failed to enter frontend directory"; exit 1; }

    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found in frontend"
    else
        echo "  Installing frontend dependencies..."
        npm install --no-audit --silent
        npm run dev -- --clearScreen false &
        FRONTEND_PID=$!

        echo "  Frontend PID: $FRONTEND_PID"
        echo "  UI: http://localhost:3000"
    fi
fi

echo ""
echo "======================================"
echo " Both services running."
echo " Press Ctrl+C to stop."
echo "======================================"

# Handle graceful shutdown
cleanup() {
    echo -e "\nStopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT
wait