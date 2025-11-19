(The file `c:\Users\50706044213\desktop\TA23B-B3-projekt\Documentation.md` exists, but is empty)
**Project Overview**
- **Name:**: Cinema Project
- **Purpose:**: A small cinema management web platform consisting of three separate React frontends and a simple Express + SQLite API. The apps are split into:
	- `main-site` — public-facing site (movies, showtimes, gifts) and a lightweight API server.
	- `admin-worker-site` — admin / staff interface.
	- `user-profile-site` — user account/profile UI.

**Repository Layout**
- **Root:**: project-wide files and shared resources.
- **`main-site/`**: Frontend (Vite + React) for the main public site. Contains a small Express API in `main-site/server` and scripts in `main-site/scripts`.
- **`admin-worker-site/`**: Admin/staff frontend (Vite + React).
- **`user-profile-site/`**: User-profile frontend (Vite + React).
- **`database/`**: SQLite database file `db.sqlite` used by the API and sync scripts.

**Quick prerequisites**
- **Node.js (LTS)**: Install Node.js (16+ or current LTS recommended).
- **npm**: Comes with Node.js.
- **Optional**: A SQLite GUI (DB Browser for SQLite, DataGrip) for inspecting `database/db.sqlite`.

**Environment / .env**
- **Location**: `main-site/scripts/syncMovies.js` uses `dotenv`, so place `.env` in the `main-site/` directory when running that script. Typical variables:
	- `MOVIE_API_KEY` — required for `sync:movies` to fetch movie data
	- `MOVIE_API_URL` — optional, defaults to TheMovieDB popular endpoint

**Running locally — per site**
Note: commands below are PowerShell examples. Run them from the repository root unless otherwise noted.

- **Main site (frontend + local API)**:

	1. Install dependencies:

```powershell
cd main-site
npm install
```

	2. Start the Vite dev server (frontend):

```powershell
npm run dev
```

	3. Start the lightweight API (serves movie/gift endpoints):

```powershell
# from the `main-site` folder
npm run server
# or directly: node server/index.js
```

	4. Sync movies into the local SQLite DB (optional, requires `MOVIE_API_KEY` in `main-site/.env`):

```powershell
npm run sync:movies
```

	- The API listens on `http://localhost:4000` (see `main-site/server/index.js`).
	- The server reads the DB at `../database/db.sqlite` (relative to `main-site/`).

- **Admin site (admin-worker-site)**:

```powershell
cd admin-worker-site
npm install
npm run dev
```

	- Build for production: `npm run build`.
	- Preview built build: `npm run preview`.

- **User profile site (user-profile-site)**:

```powershell
cd user-profile-site
npm install
npm run dev
```

	- Build for production: `npm run build`.
	- Preview built build: `npm run preview`.

**API Endpoints (provided by `main-site/server/index.js`)**
- **GET** `/api/movies/top` : Returns top (recent) movies — selects id, title, overview, poster (limit 20 ordered by updated_at).
- **GET** `/api/movies/:id` : Returns details for a single movie (id, title, overview, poster, duration, genre, directors).
- **GET** `/api/gifts` : Returns list of gifts with id, name, type, price.

Example: open `http://localhost:4000/api/movies/top` after starting the server.

**Database**
- **File**: `database/db.sqlite` — SQLite database used by server and scripts.
- **Inspecting**: Use DB Browser for SQLite or DataGrip to open and inspect tables.
- **Seeding / Sync**: Use `main-site/scripts/syncMovies.js` to fetch data from an external API and upsert into `database/db.sqlite`. Ensure `MOVIE_API_KEY` is set.

**Scripts of note**
- `main-site/scripts/syncMovies.js` : Fetches popular movies from a movie API and upserts them into the local DB. Requires `MOVIE_API_KEY` in `main-site/.env`.
- `main-site` `package.json` scripts:
	- `dev` — start Vite dev server for `main-site` frontend
	- `build` — build frontend
	- `preview` — preview built assets
	- `sync:movies` — run the sync script
	- `server` — start the Express API (`node server/index.js`)

**Building & Deploying**
- Each frontend built with Vite; produce static assets with `npm run build` in the appropriate site folder.
- Serve the built `dist/` with any static hosting (Netlify, Vercel, Surge) or a static file server. If you need the API, deploy the `main-site/server` node app separately (or containerize it).

**Testing / Linting**
- Some projects include `eslint` configs. To lint:

```powershell
cd admin-worker-site
npm run lint

cd user-profile-site
npm run lint
```

**Troubleshooting**
- If the API cannot find the DB, ensure `database/db.sqlite` exists and that you start the server from the `main-site` directory (the server resolves `../database/db.sqlite`).
- If `sync:movies` returns HTTP/auth errors, verify `MOVIE_API_KEY` and optionally `MOVIE_API_URL` in `main-site/.env`.

**Notes & Recommendations**
- Keep secrets (API keys) out of the repository. Add `main-site/.env` to `.gitignore` if not already ignored.
- For production, consider using a proper RDBMS if concurrency or durability becomes important; `better-sqlite3` and SQLite work well for lightweight local deployments and demos.

**Contributors**
- Elnar Käst
- Sofja Portnova
- Artur Genno

**Contact / Next steps**
- If you want, I can:
	- Add example `.env.example` in `main-site/` with required keys.
	- Add a small NPM script at repository root to start all services with one command.

---
Generated: automated update to `Documentation.md` to capture current project structure and run instructions.
