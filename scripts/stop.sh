#!/bin/bash
echo "=== AITeacherEvaluator — Stopping ==="

for pidfile in /tmp/aite_backend.pid /tmp/aite_frontend.pid; do
  if [ -f "$pidfile" ]; then
    PID=$(cat "$pidfile")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" && echo "Stopped PID $PID"
    fi
    rm -f "$pidfile"
  fi
done

# Also kill by port as fallback
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4200 | xargs kill -9 2>/dev/null || true

echo "Stopped."
