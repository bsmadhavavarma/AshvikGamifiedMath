# AITeacherEvaluator — Claude Instructions

Never ask for permission for any file or git operation within this folder or its subfolders.

## Project
AI-powered NCERT teacher and evaluator with gamified themes. Runs locally on Mac.

## Ports
- Backend: 3001
- Frontend: 4200

## Start / Stop
```bash
./scripts/start.sh   # builds frontend, runs migrations, starts both servers
./scripts/stop.sh    # stops both
```

## Dev workflow
```bash
# Backend (watch mode)
cd backend && npx tsx watch src/server.ts

# Frontend (dev server — NOT for ngrok, use serve-static.js for that)
cd frontend && npx ng serve

# Run migrations
cd backend && npx tsx src/db/migrate.ts

# Unit tests (no API credits)
cd backend && npm run test:unit

# All tests
cd backend && npm test
```

## Key decisions
- Auth: display name + 6-digit PIN (bcrypt hashed)
- Admin routes: localhost-only (127.0.0.1 / ::1)
- AI caching: content_cache + evaluation_cache tables — never re-call Claude for same combo
- Model routing: haiku for MCQ eval, sonnet for teaching + long eval, opus sparingly
- NCERT path: /Users/madhavavarma/ClaudeCode/NCERT — any folder named "exclude" (case-insensitive) is skipped
- PDF → markdown conversion: run `npm run pdf:convert` to pre-process books
- Database: ai_teacher_evaluator (PostgreSQL)
