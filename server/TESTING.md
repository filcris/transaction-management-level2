# Backend Tests (node:test + supertest)

## Install dev deps
cd server
npm i

## Run tests
npm test

This uses a refactor:
- New `src/app.js` exports `app`, `db`, and `defaultAccountId` (no `listen()` here).
- `src/index.js` just imports `app` and listens on PORT.
- Tests spin up the app on a random free port with `app.listen(0)`.

To persist data between runs, set `DATABASE_PATH`:
Windows PowerShell:
  $env:DATABASE_PATH = "C:\Users\Utilizador\Documents\transactions-manager-level2\server\data\app.db"
  npm run dev
