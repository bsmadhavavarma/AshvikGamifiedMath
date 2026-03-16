# AITeacherEvaluator — Claude Instructions

Never ask for permission for any file or git operation within this folder or its subfolders.

## Project
AI-powered NCERT teacher and evaluator. Runs locally on Mac.
- Backend: Express + TypeScript, port 3001
- Frontend: Angular 19 standalone, port 4200 (served from dist/ via serve-static.js — NOT ng serve)
- Database: PostgreSQL, db name: ai_teacher_evaluator
- NCERT content: /Users/madhavavarma/ClaudeCode/NCERT/

## Start / Stop
```bash
./scripts/start.sh   # runs migrations + builds frontend + starts both servers
./scripts/stop.sh    # stops both
```

## Dev workflow
```bash
cd backend && npx tsx watch src/server.ts   # backend watch mode
cd backend && npx tsx src/db/migrate.ts     # run migrations
cd backend && npm run test:unit             # unit tests (no API credits used)
cd backend && npm run content:preload       # generate static content for Class 6 & 9
npm run pdf:convert                        # PDF → markdown (run once)
```

## Key architecture decisions
- Auth: display name + 6-digit PIN (bcrypt hashed in DB; plaintext stored separately for admin visibility)
- Admin routes: localhost-only (127.0.0.1 / ::1)
- Class 6 and 9 content: served from static JSON files in backend/data/ — NEVER calls Claude API at runtime
- All other classes: DB cache first (content_cache, evaluation_cache tables), then Claude API
- Model routing: sonnet for teaching + long eval, haiku for MCQ eval
- Themes: removed from UI — 'quest' is hardcoded internally as DEFAULT_THEME
- NCERT path: any folder named "exclude" (case-insensitive) is skipped

## Database connection
- Host: localhost, Port: 5432
- DB: ai_teacher_evaluator, User: madhavavarma
- Connect: `psql ai_teacher_evaluator`

---

## Rules Claude must follow — learned from past mistakes

### After ANY frontend code change
1. Rebuild: `cd frontend && npx ng build --configuration=production`
2. Restart servers: `./scripts/stop.sh && ./scripts/start.sh`
3. Never tell the user a frontend change is done without completing both steps.

### After ANY set of code changes
- Commit to git before declaring done.
- If changes span frontend + backend, commit both together with a clear message.

### Before declaring a feature "done"
- Spot-check real output. For content features: call the actual API endpoint and verify the response looks correct, not just that the code compiles.
- For UI changes: verify the affected screen renders correctly (check the built HTML/component, not just the source).
- Run unit tests: `cd backend && npm run test:unit`

### When finishing any work session
Provide a summary that includes:
- What was done
- How to test/use it (URL, command, etc.)
- Anything left incomplete and why

### When removing a feature
Remove ALL traces: the component/logic, the HTML template references, the CSS classes, the table columns, the route params — everything. Do not leave dead code behind.

### For long-running background operations (preload, PDF conversion, etc.)
- Give a status update every meaningful milestone
- Ask the user before continuing past a natural stopping point
- Never run indefinitely without checking in

### Before launching parallel tasks
Check available CPU first:
```bash
python3 -c "import os; print(f'CPUs: {os.cpu_count()}, Load avg: {[round(x/os.cpu_count()*100,1) for x in os.getloadavg()]}')"
```
- Only launch parallel tasks if current CPU load is under 40% (leaving headroom to reach 60% under load)
- If load is already 40–60%: run tasks sequentially instead
- If load is above 60%: wait or ask the user before proceeding
- Never saturate all cores — the Mac must stay responsive for the user at all times
- It is fine to run multiple tasks in parallel, but always check capacity first

### Intent vs literal instruction
Read the spirit of what the user asks, not just the literal words. Examples of past mistakes:
- "store it so you don't need the API" → means static files committed to the repo, not a DB cache that still needs an API call on first use
- "I don't expect the user to type a subject name" → means a dropdown, not a text input

### After fixing a repeated mistake
Save the lesson to ~/.claude/projects/.../memory/ so it persists across sessions on this account.
