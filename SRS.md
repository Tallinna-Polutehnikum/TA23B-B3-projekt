**Software Requirements Specification — Test Cases (Section 7.1)

7.1 Test Case

Below are test cases that map to the implemented functional requirements for the Cinema Project. Each test case includes Test ID, Precondition, Steps, Expected Result and Pass Criteria.

- **FR-01 — Display Top Movies**
  - **Test ID:** TC-01-TopMovies
  - **Precondition:** `main-site` dependencies installed; `main-site/server` running on `http://localhost:4000`; `database/db.sqlite` contains movie rows.
  - **Test Steps:**
    1. Open the `main-site` dev URL (Vite) and navigate to the main/home page.
    2. Observe the Top Movies section or call `GET http://localhost:4000/api/movies/top`.
  - **Expected Result:** API returns HTTP 200 and a JSON array (max 20) containing objects with `id`, `title`, `overview`, and `poster`. The UI displays the returned movie titles and posters.
  - **Pass Criteria:** API returns 200 with at least one movie; UI shows the same movie titles displayed by the API.

- **FR-02 — Movie Details**
  - **Test ID:** TC-02-MovieDetails
  - **Precondition:** `main-site` and server running; at least one movie exists in DB.
  - **Test Steps:**
    1. From Top Movies, click a movie to open its details page OR call `GET /api/movies/{id}` with an existing movie id.
    2. Verify the response/UI contains `id`, `title`, `overview`, `poster`, `duration`, `genre`, and `director` (when available).
    3. For a non-existent id call `GET /api/movies/9999999` and observe response.
  - **Expected Result:** For existing id: HTTP 200 and JSON with expected fields; UI shows full details. For non-existent id: API returns HTTP 404 with `{ message: 'Not found' }`.
  - **Pass Criteria:** Existing id returns expected payload and UI shows it; non-existent id returns HTTP 404.

- **FR-03 — List Gifts**
  - **Test ID:** TC-03-Gifts
  - **Precondition:** Server running; `gifts` table populated in DB.
  - **Test Steps:**
    1. Call `GET http://localhost:4000/api/gifts` or open Gifts page in the `main-site`.
  - **Expected Result:** API returns HTTP 200 and a JSON array with objects containing `id`, `name`, `type`, and `price`, ordered by `price`.
  - **Pass Criteria:** Returned list is present, each entry has required fields, and ordering by price is correct.

- **FR-04 — Sync Movies Script**
  - **Test ID:** TC-04-SyncMovies
  - **Precondition:** `main-site/.env` contains a valid `MOVIE_API_KEY` (or a mock `MOVIE_API_URL` is provided); `npm install` completed in `main-site`.
  - **Test Steps:**
    1. From `main-site` run `npm run sync:movies`.
    2. Observe console output and verify database changes (rows inserted/updated and `updated_at` set).
  - **Expected Result:** Script runs without uncaught errors, fetches movie list, inserts or updates rows in `database/db.sqlite`, and prints number of fetched items.
  - **Negative Test:** Run without `MOVIE_API_KEY` — script should surface fetch/auth error.
  - **Pass Criteria:** With valid key: DB rows updated and script exits normally. With invalid/missing key: script exits with non-zero status and shows an HTTP/auth error.

- **FR-05 — API Server Availability**
  - **Test ID:** TC-05-APIServer
  - **Precondition:** `main-site` dependencies installed.
  - **Test Steps:**
    1. From `main-site` run `npm run server` (or `node server/index.js`).
    2. Call `GET http://localhost:4000/api/movies/top`.
  - **Expected Result:** Server starts and listens on port 4000; endpoint returns HTTP 200 (or 404 if DB empty) and does not crash.
  - **Pass Criteria:** Server remains running and responds; logs show `API on http://localhost:4000`.

- **FR-06 — Frontend Dev Startup (all sites)**
  - **Test ID:** TC-06-FrontendDev
  - **Precondition:** For each site (`main-site`, `admin-worker-site`, `user-profile-site`) run `npm install`.
  - **Test Steps:**
    1. For each site run `npm run dev` and open the provided dev URL.
    2. Verify the app renders without critical console errors and main routes load.
  - **Expected Result:** Each site builds and serves in dev mode; UI is accessible and core pages load.
  - **Pass Criteria:** No fatal build errors and pages render; dev server remains running.

- **FR-07 — Production Build**
  - **Test ID:** TC-07-Build
  - **Precondition:** `npm install` ran for the target site.
  - **Test Steps:**
    1. Run `npm run build` in `main-site`, `admin-worker-site`, and `user-profile-site`.
    2. Verify `dist/` (or Vite output folder) is created and contains static assets.
    3. Optionally run `npm run preview` to serve built assets and check pages.
  - **Expected Result:** Build completes successfully and produces static files.
  - **Pass Criteria:** `build` command exits with code 0 and `dist/` contains assets and an `index.html`.

- **FR-08 — Linting (admin & user sites)**
  - **Test ID:** TC-08-Lint
  - **Precondition:** Dev dependencies installed for `admin-worker-site` and `user-profile-site`.
  - **Test Steps:**
    1. Run `npm run lint` in `admin-worker-site` and `user-profile-site`.
  - **Expected Result:** Linter runs and reports issues (if any). For CI, ensure no blocking lint errors remain.
  - **Pass Criteria:** Lint command runs without crashing; team-defined lint policy is satisfied.

- **FR-09 — Database File Handling**
  - **Test ID:** TC-09-DBFile
  - **Precondition:** `database/db.sqlite` may be present or removed to test both conditions.
  - **Test Steps:**
    1. Start server with `database/db.sqlite` present — confirm server runs.
    2. Rename or remove `database/db.sqlite` and start server again.
  - **Expected Result:** With file present: server starts. With missing file: server fails with clear error because `better-sqlite3` used with `{ fileMustExist: true }`.
  - **Pass Criteria:** Behavior matches expectations: clear error when DB file missing; successful start when present.

Notes on coverage and execution
- These tests exercise functionality implemented in the repository. If your formal SRS uses different FR numbering, map these TC IDs to the official FR IDs.
- For automation: API tests can be implemented with Jest + Supertest and a temporary test DB fixture. Frontend end-to-end tests can use Cypress or Playwright.

Next steps (optional)
- I can add these cases into `Documentation.md` as `Section 7.1` if you prefer the SRS to live there instead of a separate `SRS.md`.
- I can create automated API tests (Jest + Supertest) and add `npm test` to `main-site`.
