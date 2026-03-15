#!/bin/bash
set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== AITeacherEvaluator — Starting ==="

# 1. Run DB migrations
echo "[1/4] Running DB migrations..."
cd "$BASE/backend" && npx tsx src/db/migrate.ts

# 2. Build frontend
echo "[2/4] Building frontend..."
cd "$BASE/frontend" && npx ng build --configuration=production

# 3. Start backend
echo "[3/4] Starting backend..."
cd "$BASE/backend"
npx tsx src/server.ts >> /tmp/aite_backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/aite_backend.pid
echo "Backend PID: $BACKEND_PID  (logs: /tmp/aite_backend.log)"

# Wait for backend to be ready
sleep 2

# 4. Start frontend static server
echo "[4/4] Starting frontend..."
cd "$BASE/frontend"
node serve-static.js >> /tmp/aite_frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/aite_frontend.pid
echo "Frontend PID: $FRONTEND_PID  (logs: /tmp/aite_frontend.log)"

echo ""
echo "=== AITeacherEvaluator is running ==="
echo "  App:          http://localhost:4200"
echo "  Admin:        http://localhost:4200/admin"
echo "  Observability:http://localhost:4200/admin/observability"
echo "  Backend API:  http://localhost:3001/api/health"
echo ""
echo "Stop with: ./scripts/stop.sh"
