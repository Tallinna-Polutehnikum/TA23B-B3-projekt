# Absolute Cinema

Cinema platform project with a public website, an admin panel, and a local API backed by SQLite.

---

## 1. Project Overview

This repository contains two actively used web applications and one API server:

- Main Site: customer-facing cinema website (movies, sessions, checkout flow, events, cinemas, gifts).
- Admin Worker Site: internal dashboard for managing movies and sessions.
- API Server: Express server that reads and writes data in SQLite.

The backend and both frontends are developed in JavaScript.

---

## 2. What This Project Includes

### Main Site Features

- Home page with hero content, top movies, genres, gifts, and coming soon movies.
- Showtime page with filtering and seat selection flow.
- Movie catalog and movie details views.
- Events, cinemas, family screening, birthday, and themed landing pages.
- Cart and checkout flow for gifts and selected seats.

### Admin Features

- Dashboard overview.
- Movie management: create, update, delete.
- Session management: create, update, delete.
- Bulk deletion of sessions by date range.

### Backend and Data

- REST API for movies, genres, sessions, halls, cinemas, gifts, and seat booking.
- SQLite database located in database/db.sqlite.
- Booking logic that prevents double-booking of already reserved seats.

---

## 3. Technology Stack and Tools

- Frontend: React 19, React Router, Vite 7.
- Backend: Node.js, Express 5.
- Database: SQLite with better-sqlite3.
- Tooling: ESLint, npm.
- Helper scripts: database checks, endpoint tests, and data sync scripts.

---

## 4. Repository Structure

- main-site/: public frontend and backend server.
- admin-worker-site/: admin frontend.
- database/: SQLite database file.
- queries/: SQL query examples.
- Root scripts: helper checks and API test scripts.

---

## 5. Prerequisites

1. Node.js LTS (recommended current LTS).
2. npm (installed with Node.js).
3. Local SQLite file present at database/db.sqlite.

---

## 6. Installation

Run these commands from repository root:

```powershell
cd main-site
npm install

cd ..\admin-worker-site
npm install

cd ..
npm install
```

Note: root npm install is needed if you want to run root helper scripts such as test_endpoints.js.

---

## 7. How to Run the Project

Open 3 terminals.

### Terminal 1: Backend API

```powershell
cd main-site
npm.cmd run server
```

Backend runs on:
- http://localhost:4000

### Terminal 2: Main Site

```powershell
cd main-site
npm.cmd run dev
```

Main site default URL:
- http://localhost:5173

### Terminal 3: Admin Worker Site

```powershell
cd admin-worker-site
npm.cmd run dev
```

Admin site URL:
- http://localhost:5156

---

## 8. Production Build Commands

```powershell
cd main-site
npm.cmd run build

cd ..\admin-worker-site
npm.cmd run build
```

Both build commands were verified successfully.

---

## 9. API Overview

Examples of available endpoints:

- GET /api/movies
- GET /api/movies/top
- GET /api/movies/coming-soon
- GET /api/genres
- GET /api/sessions
- GET /api/sessions/:id/seats
- POST /api/sessions/:id/book
- POST /api/movies
- PUT /api/movies/:id
- DELETE /api/movies/:id
- POST /api/sessions
- PUT /api/sessions/:id
- DELETE /api/sessions/:id
- POST /api/sessions/bulk-delete

Base URL for API:
- http://localhost:4000

---

## 10. Useful Helper Commands

From repository root:

```powershell
node test_endpoints.js
node test_api.js
node check_db.js
node check_coming_table.js
```

From main-site:

```powershell
npm.cmd run sync:movies
```

---

## 11. Recent Development Highlights (from commits)

- Genre filtering added and improved.
- Seat map behavior fixed and refined.
- Events and cinemas pages added and connected in navigation.
- Payment-related flow updates.
- Admin panel functionality implemented and expanded.
- Session bulk deletion by date range added in admin.
- Database connection logic improved for session handling.

---

## 12. Known Notes

- If PowerShell blocks npm script execution, use npm.cmd instead of npm.
- Backend must run before both frontends if you want live data.
- The project currently relies on local SQLite data, so keep database/db.sqlite available.

---

## 13. Automatic Deployment (GitHub Actions -> Zone)

This repository includes a production deployment workflow that runs on every push to `main`.

Workflow file:

- `.github/workflows/deploy-zone.yml`

### 13.1 What the workflow does

1. Connects to your Zone server over SSH.
2. Synchronizes `main-site/` to `/data02/virt137396/domeenid/www.spjo.eu/htdocs/main-site`.
3. Runs `npm ci` (or `npm install`) and `npm run build` on server.
4. Restarts PM2 process `absolute-cinema-main` with:
	- `HOST=127.2.63.196`
	- `PORT=8080`
	- `DB_PATH=/data02/virt137396/domeenid/www.spjo.eu/htdocs/database/db.sqlite`
5. Verifies API health on local loopback and public domain.

Note: The workflow does not overwrite `database/db.sqlite`.

### 13.2 Required GitHub Secret

Add this repository secret in GitHub:

- `ZONE_SSH_PRIVATE_KEY`

Value should be the full private key content from your local key file:

- `C:\Users\USER\.ssh\zone_ed25519`

Include the full block:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### 13.3 Triggering deployment

- Automatic: push or merge to `main`.
- Manual: run `Deploy Zone Production` from the Actions tab.
