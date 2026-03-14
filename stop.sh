#!/bin/bash

echo "🛑 Stopping Ashvik's Gamified Math..."

if [ -f /tmp/ashvik-pids ]; then
  read -r BACKEND_PID FRONTEND_PID NGROK_PID < /tmp/ashvik-pids
  kill $BACKEND_PID $FRONTEND_PID $NGROK_PID 2>/dev/null && echo "   ✅ App processes stopped"
  rm /tmp/ashvik-pids
fi

# Kill any stragglers by port
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4200 | xargs kill -9 2>/dev/null || true
lsof -ti:4040 | xargs kill -9 2>/dev/null || true

brew services stop postgresql@16 2>/dev/null && echo "   ✅ PostgreSQL stopped"

echo "Done."
