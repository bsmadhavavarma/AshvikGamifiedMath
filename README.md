# Ashvik's Gamified Math 🎮

A gamified math practice application for Ashvik — CBSE Class 5 & 6 syllabus, starting with Percentages.

## Features

- 🎯 CBSE-aligned percentage problems (Class 5 & 6)
- 🏆 Coin rewards with speed & streak bonuses
- ⏱️ 15-second timer per question
- 📊 Leaderboard & session history
- 🎨 Kid-friendly animated UI
- 📱 Works on any device via hosted URL

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19 (Standalone, Signals) |
| Backend | Node.js 20 + Express 5 + TypeScript |
| Database | PostgreSQL 16 |
| Hosting | Railway |
| CI/CD | GitHub Actions |

## Project Structure

```
AshvikGamifiedMath/
├── backend/          # Node.js + Express API
├── frontend/         # Angular app
├── .github/workflows # CI/CD pipelines
└── railway.toml      # Railway deployment config
```

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
npm run migrate        # run DB migrations
npm run dev            # start dev server on :3000
npm test               # run unit tests
```

### Frontend

```bash
cd frontend
npm install
npm start              # start on http://localhost:4200
npm test               # run unit tests
```

## Deployment (Railway)

1. Push to `main` branch — GitHub Actions runs tests automatically
2. Railway auto-deploys backend + frontend on successful push
3. Set environment variables in Railway dashboard:
   - Backend: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
   - Frontend: update `environment.production.ts` with your Railway backend URL

## Adding New Math Modules

To add a new module (e.g., Algebra):

1. Add to DB enum: `ALTER TYPE math_module ADD VALUE 'algebra';`
2. Create generator: `backend/src/modules/questions/generators/algebra/class6.generator.ts`
3. Register in: `backend/src/modules/questions/generators/index.ts`
4. Add module card in: `frontend/src/app/features/home/home.component.html`

## Coin Scoring

| Component | Value |
|-----------|-------|
| Base (Class 5) | 10 coins |
| Base (Class 6) | 15 coins |
| Speed bonus (< 5s) | +5 coins |
| Speed bonus (5–10s) | +2 coins |
| Streak bonus (≥ 3) | +1 coin |
| Streak bonus (≥ 5) | +3 coins |
