# Transaction Management – Fullstack Level 2

> **Status**: ✅ Backend + Frontend + Cypress ready | 🧪 Unit tests included | 🐳 Docker optional

This repository implements the Transaction Management challenge (Level 2) with a minimal, clean stack and contracts aligned with the provided Cypress tests.

## 🌐 Stack
- **Backend**: Node.js, Express, better-sqlite3, Zod
- **Frontend**: Vite + React
- **Tests**: node:test + supertest (unit/integration) and Cypress E2E
- **Dev UX**: PowerShell helpers for Windows

## 📁 Project structure
```
/server
  └── src
      ├── app.js        # Express app (routes, DB, exports app/db/seed)
      └── index.js      # Boots the HTTP server (PORT)
  └── tests/            # node:test + supertest
/web
  ├── index.html
  └── src/main.jsx      # React app (form + history + data-type attrs for Cypress)
```

## ⚙️ Environment
- **Node.js**: 18+ recommended
- **Ports**: API `4000`, Web `5173` (configurable)
- **Env vars**:
  - `PORT` – backend port (default `4000`)
  - `DATABASE_PATH` – sqlite file path (e.g. `server/data/app.db`). If omitted, uses in‑memory DB.
  - `VITE_API_URL` – frontend API base (default `http://localhost:4000`)

## 🚀 Running locally (Windows PowerShell)
### Backend
```powershell
cd server
npm i
# optional persistence:
# $env:DATABASE_PATH = "C:\path\to\repo\server\data\app.db"
npm run dev
# healthcheck
Invoke-RestMethod -Uri "http://localhost:4000/ping"
```

### Frontend
```powershell
cd web
npm i
# optional: $env:VITE_API_URL = "http://localhost:4000"
# or create web/.env with: VITE_API_URL=http://localhost:4000
npm run dev
# open the URL Vite prints (e.g. http://localhost:5173)
```

## 🔌 API Endpoints
- `GET /ping` → `200` `"pong"` (healthcheck)
- `POST /transactions` → `201 { transaction_id, account_id, amount, created_at }`  
  **Body**: `{ account_id: UUIDv4, amount: integer }`  
  If `account_id` does not exist, it is **created automatically**.
- `GET /transactions/:id` → `200 { transaction_id, account_id, amount, created_at }`
- `GET /accounts/:id` → `200 { account_id, balance }`
- *(Optional)* `GET /transactions?account_id=UUID` → `{ items: [...] }`
- *(Helper)* `GET /seed-account` → `{ account_id }`

**Validation**: Zod returns `400 { error: "INVALID_INPUT", details: ... }` for bad payloads.

## 🧪 Tests
### Unit/Integration (node:test + supertest)
```powershell
cd server
npm test
```

### End-to-End (Cypress)
Place the provided `cypress/e2e/test.cy.js` in the **web** project (or repo root, as per your setup).  
Create `web/cypress.config.js` (or `cypress.config.js` in the root) with:
```js
const { defineConfig } = require("cypress");
module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    env: { apiUrl: "http://localhost:4000" },
  },
});
```
Run:
```powershell
cd web
npm i -D cypress
npx cypress open
# or headless:
npx cypress run
```

## 🎨 Frontend (mockup alignment)
- Left panel **Submit new transaction**: fields *Account ID* and *Amount*, button **Submit**.
- Right panel **Transaction history**: blocks with textual messages:
  - `Transferred 7$ from account …` *(withdrawal)*
  - `Transferred 8$ to account …` *(deposit)*
  - `The current account balance is X$`
- Cypress selectors kept:
  - `[data-type=account-id]`, `[data-type=amount]`, `[data-type=transaction-submit]`
  - `[data-type=transaction][data-account-id][data-amount][data-balance]`

## 🐳 Docker (optional)
Create a persistent volume for the DB if desired.

### Server Dockerfile (copy to `server/Dockerfile` or use the file provided below as server.Dockerfile)
```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
ENV PORT=4000
# ENV DATABASE_PATH=/app/data/app.db
EXPOSE 4000

CMD ["npm", "run", "start"]
```

### docker-compose.yml
```yaml
services:
  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      - PORT=4000
      # - DATABASE_PATH=/app/data/app.db
    ports:
      - "4000:4000"
    volumes:
      - ./server/data:/app/data
  web:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./web:/app
    environment:
      - VITE_API_URL=http://localhost:4000
    command: sh -c "npm ci && npm run dev -- --host --port 5173"
    ports:
      - "5173:5173"
    depends_on:
      - api
```

Run:
```powershell
docker compose up --build
```

## 🧰 Useful scripts (Windows)
- `run-api.ps1` – starts backend, frees port, installs deps if needed
- `run-web.ps1` – starts frontend, exports `VITE_API_URL`
- `start-all.ps1` – opens two windows (API + Web)

If PowerShell blocks unsigned scripts:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## 🐞 Troubleshooting
- **Cypress cannot verify baseUrl** → Start `npm run dev` in `web`, ensure port matches `baseUrl`.
- **Could not fetch seed account** → API not reachable. Check `VITE_API_URL` and that `/seed-account` returns JSON.
- **Invalid uuid** → Use *Generate UUID* or paste a valid `[guid]::NewGuid().ToString()`.
- **Port already in use (EADDRINUSE)** → Kill process using port or change `PORT`/Vite port.

---

Made with ❤️ for a smooth tech‑challenge experience.
