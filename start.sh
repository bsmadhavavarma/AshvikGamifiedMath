#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_DIR="/tmp/ashvik-logs"

export PATH="/usr/local/opt/postgresql@16/bin:/usr/local/bin:$PATH"

mkdir -p "$LOG_DIR"

echo "🚀 Starting Ashvik's Gamified Math..."
echo ""

# 1. Start PostgreSQL
echo "📦 Starting PostgreSQL..."
brew services start postgresql@16 2>/dev/null || true
sleep 2

# 2. Start Backend
echo "⚙️  Starting backend..."
cd "$BACKEND_DIR"
node --env-file=.env dist/server.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2

# Check backend is healthy
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
  echo "   ✅ Backend running (http://localhost:3000)"
else
  echo "   ❌ Backend failed to start. Check $LOG_DIR/backend.log"
  exit 1
fi

# 3. Start Frontend
echo "🎨 Starting frontend..."
cd "$FRONTEND_DIR"
npm start > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo "   ⏳ Building Angular app (takes ~15 seconds)..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null | grep -q "200"; then
    break
  fi
  sleep 1
done
echo "   ✅ Frontend running (http://localhost:4200)"

# 4. Start ngrok
echo "🌐 Starting ngrok tunnel..."
ngrok http 4200 --log=stdout > "$LOG_DIR/ngrok.log" 2>&1 &
NGROK_PID=$!
sleep 4

PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; t=json.load(sys.stdin)['tunnels']; print(t[0]['public_url'] if t else 'not ready')" 2>/dev/null || echo "not ready")

echo ""
echo "============================================"
echo "  🎮 Ashvik's Math Adventure is LIVE!"
echo "============================================"
echo ""
echo "  Local:   http://localhost:4200"
echo "  Public:  $PUBLIC_URL"
echo ""
echo "  Share the Public URL with Ashvik!"
echo ""
echo "  Logs: $LOG_DIR/"
echo "  PIDs: backend=$BACKEND_PID frontend=$FRONTEND_PID ngrok=$NGROK_PID"
echo ""
echo "  Press Ctrl+C to stop everything."
echo "============================================"

# Save PIDs for stop script
echo "$BACKEND_PID $FRONTEND_PID $NGROK_PID" > /tmp/ashvik-pids

# Wait and keep running
trap 'echo ""; echo "🛑 Stopping..."; kill $BACKEND_PID $FRONTEND_PID $NGROK_PID 2>/dev/null; brew services stop postgresql@16; echo "Done."; exit 0' INT TERM

wait
