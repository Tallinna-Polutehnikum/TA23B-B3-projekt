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

Additional Test Cases (TC-10 .. TC-20)

- **FR-10 — Authentication (basic)**
  - **Test ID:** TC-10-Auth
  - **Precondition:** Authentication endpoints implemented (if not present, this is a design test to add auth later). For now test via mock or stubbed auth.
  - **Test Steps:**
    1. Attempt to access an admin-only route (e.g., `/admin/*`) without credentials.
    2. Attempt to login with valid credentials (if login UI exists) or call the auth API with correct credentials.
    3. Attempt to access admin route with valid token/session.
  - **Expected Result:** Unauthorized requests return HTTP 401/403. Valid credentials return a token/session and allow access to protected endpoints.
  - **Pass Criteria:** Access control enforced; tokens/sessions allow restricted operations.

- **FR-11 — Admin: Create / Update / Delete Movies**
  - **Test ID:** TC-11-AdminMoviesCRUD
  - **Precondition:** Admin API routes exist for CRUD (or will be implemented); admin auth available.
  - **Test Steps:**
    1. Using admin credentials, POST a new movie payload to the admin movie create endpoint.
    2. Confirm the movie appears in the DB and via `GET /api/movies/:id`.
    3. PATCH/PUT to update the movie fields and confirm changes.
    4. DELETE the movie and confirm `GET /api/movies/:id` returns 404.
  - **Expected Result:** CRUD operations succeed and DB state matches requests.
  - **Pass Criteria:** Create/Update/Delete reflect on API responses and persistent DB.

- **FR-12 — Admin: Create / Update / Delete Gifts**
  - **Test ID:** TC-12-AdminGiftsCRUD
  - **Precondition:** Admin gift-management API exists.
  - **Test Steps:**
    1. Create a gift via admin API and verify listing and DB row.
    2. Update gift price/type and verify ordering by price in `GET /api/gifts`.
    3. Delete gift and verify it no longer appears.
  - **Expected Result:** Gift CRUD works and `GET /api/gifts` reflects changes.
  - **Pass Criteria:** Admin actions produce persistent changes and the public API reflects them.

- **FR-13 — Booking Flow & Session Management (design/test if unimplemented)**
  - **Test ID:** TC-13-Booking
  - **Precondition:** Booking endpoints or a design specification exist. If not implemented, this test documents expected behavior for future work.
  - **Test Steps:**
    1. Create a session (movie screening) with available seats.
    2. Reserve one or more seats as a user (authenticated or guest flow), then confirm reservation is held.
    3. Complete purchase flow (if exists) and confirm seat status changes to sold.
    4. Attempt double-booking same seat concurrently (see concurrency test TC-20).
  - **Expected Result:** Seats reserved then sold on purchase; double-booking prevented; appropriate HTTP codes returned.
  - **Pass Criteria:** Correct seat state transitions and user-visible confirmations.

- **FR-14 — Search and Filters**
  - **Test ID:** TC-14-SearchFilters
  - **Precondition:** Frontend search/filter UI or API query parameters implemented (or planned).
  - **Test Steps:**
    1. Use search box to search by partial movie title and verify results.
    2. Apply genre/duration/price filters (if available) and verify results narrow accordingly.
    3. Call API with query params (e.g., `/api/movies?search=star&genre=action`).
  - **Expected Result:** Results match search criteria; filtering works as expected.
  - **Pass Criteria:** Search returns relevant results and filters combine correctly.

- **FR-15 — Pagination / Limits**
  - **Test ID:** TC-15-Pagination
  - **Precondition:** API supports pagination or will be updated to support it.
  - **Test Steps:**
    1. Call `/api/movies/top?page=1&limit=10` (or equivalent) and note results.
    2. Request page 2 and ensure no overlap with page 1 and correct ordering.
  - **Expected Result:** API returns paginated results with `total`, `page`, and `limit` metadata or equivalent headers.
  - **Pass Criteria:** Pagination works consistently and is documented.

- **FR-16 — Input Validation & Error Responses**
  - **Test ID:** TC-16-Validation
  - **Precondition:** API routes accept JSON payloads.
  - **Test Steps:**
    1. Send malformed payloads (missing required fields, wrong types) to create/update endpoints.
    2. Send oversized fields or invalid data (e.g., negative price).
  - **Expected Result:** API returns HTTP 400 with helpful error messages; server does not crash.
  - **Pass Criteria:** Validation prevents invalid data from being persisted and returns proper status codes.

- **FR-17 — Static Assets & Preview (production-ready)**
  - **Test ID:** TC-17-StaticPreview
  - **Precondition:** `npm run build` completed; `npm run preview` available.
  - **Test Steps:**
    1. Run build for target site and `npm run preview`.
    2. Load pages and verify assets (CSS, JS, images) are served correctly and UI functions.
  - **Expected Result:** Built site serves static assets and behaves as expected in preview mode.
  - **Pass Criteria:** No 404 on static assets; UI functional.

- **FR-18 — Accessibility Smoke Tests**
  - **Test ID:** TC-18-Accessibility
  - **Precondition:** Frontend accessible in dev/preview mode.
  - **Test Steps:**
    1. Run basic accessibility checks (Lighthouse or axe) on main pages (home, details, gifts).
    2. Manually verify `alt` attributes exist for poster images and form elements have labels.
  - **Expected Result:** No severe accessibility violations (contrast, missing labels, missing alt text).
  - **Pass Criteria:** Major accessibility issues addressed or logged for remediation.

- **FR-19 — Logging & Error Handling (observability)**
  - **Test ID:** TC-19-Logging
  - **Precondition:** Server logging available (console or structured logs).
  - **Test Steps:**
    1. Generate an error (e.g., call endpoint with invalid payload) and observe logs.
    2. Trigger server start/stop and note startup/shutdown messages.
  - **Expected Result:** Errors and lifecycle events are logged with enough context for debugging.
  - **Pass Criteria:** Logs include timestamps and context; stack traces not leaked to end-users in production.

- **FR-20 — Concurrency / Data Integrity (double-booking)**
  - **Test ID:** TC-20-Concurrency
  - **Precondition:** Booking/session endpoints exist for booking seats.
  - **Test Steps:**
    1. Simulate two concurrent requests attempting to reserve the same seat (use small script or test harness).
    2. Observe DB state and responses.
  - **Expected Result:** Only one request succeeds; other receives a clear failure (HTTP 409 Conflict or similar).
  - **Pass Criteria:** Data integrity maintained; race conditions prevented by DB constraints or transactional logic.

Automation notes
- For CI-friendly automation:
  - Implement API tests as Jest + Supertest suites using a disposable test DB created before tests and removed after.
  - Use Playwright or Cypress for E2E flows (TC-01, TC-02, TC-13, TC-14).
  - Add a `npm test` script and GitHub Actions workflow to run `install -> lint -> test -> build` on PRs.

  Additional Test Cases (TC-21 .. TC-30)

  - **FR-21 — Performance / Load Test**
    - **Test ID:** TC-21-Performance
    - **Precondition:** Test environment or local machine with tooling (k6, ApacheBench, or Artillery).
    - **Test Steps:**
      1. Run a load test against `GET /api/movies/top` with increasing concurrency (e.g., 50, 100, 200 concurrent users) for a sustained period (1-5 minutes).
      2. Monitor response times, error rates, and server CPU/memory.
    - **Expected Result:** API handles expected load with acceptable latency and low error rate (team-defined SLA).
    - **Pass Criteria:** Throughput and latency meet performance criteria; no memory leaks or crashes.

  - **FR-22 — Rate Limiting / Abuse Protection**
    - **Test ID:** TC-22-RateLimit
    - **Precondition:** Rate-limiting middleware configured (or planned).
    - **Test Steps:**
      1. Send a burst of requests from a single client exceeding the configured rate.
      2. Observe responses for HTTP 429 or equivalent behavior.
    - **Expected Result:** Requests above threshold are rejected with HTTP 429 and informative message.
    - **Pass Criteria:** Abuse protection prevents excessive requests and legitimate users are unaffected.

  - **FR-23 — Backup & Restore DB**
    - **Test ID:** TC-23-BackupRestore
    - **Precondition:** Backup procedure documented (or to be implemented) using `database/db.sqlite` dump/copy.
    - **Test Steps:**
      1. Create a backup copy of `database/db.sqlite`.
      2. Modify the DB (insert/delete rows) and then restore the backup.
      3. Verify DB contents match pre-backup state.
    - **Expected Result:** Backup and restore succeed without corruption.
    - **Pass Criteria:** After restore, DB state equals the pre-backup snapshot.

  - **FR-24 — Internationalization / Localization**
    - **Test ID:** TC-24-I18N
    - **Precondition:** App supports localization (or plans exist to add it).
    - **Test Steps:**
      1. Switch UI language to a secondary language (e.g., Estonian or Russian) if available.
      2. Verify UI strings, date/time, and number formats change accordingly.
    - **Expected Result:** Translations appear for main UI elements; date/number formatting respects locale.
    - **Pass Criteria:** No missing key placeholders; localized pages readable.

  - **FR-25 — Notifications / Email (booking confirmations)**
    - **Test ID:** TC-25-Notifications
    - **Precondition:** Email/notification service configured (or a mock available).
    - **Test Steps:**
      1. Trigger an event that sends a notification (e.g., booking confirmation).
      2. Observe the outgoing message via SMTP capture or mock service.
    - **Expected Result:** Notification contains correct booking details and recipient address.
    - **Pass Criteria:** Notification sent and contents verified; failures logged.

  - **FR-26 — Role-Based Access Control (RBAC)**
    - **Test ID:** TC-26-RBAC
    - **Precondition:** User roles defined (admin, worker, customer) and enforced by the API.
    - **Test Steps:**
      1. Authenticate as different roles and attempt role-specific operations (admin-only, worker-only).
      2. Verify unauthorized roles cannot perform restricted actions.
    - **Expected Result:** Role checks enforce permissions; unauthorized attempts return HTTP 403.
    - **Pass Criteria:** RBAC rules enforced across admin endpoints.

  - **FR-27 — File Uploads (movie posters)**
    - **Test ID:** TC-27-FileUpload
    - **Precondition:** API or admin UI supports uploading poster images (or planned).
    - **Test Steps:**
      1. Upload a valid image (JPG/PNG) as a poster for a movie.
      2. Upload invalid file types (exe, large files) and observe behavior.
      3. Verify uploaded image is served in the UI and stored in expected location.
    - **Expected Result:** Valid images accepted; invalid files rejected with HTTP 400 and proper message.
    - **Pass Criteria:** Uploads succeed for valid files and are rejected for invalid or oversized files.

  - **FR-28 — Image Optimization & CDN Behavior**
    - **Test ID:** TC-28-CDNImages
    - **Precondition:** Images served with caching headers or via CDN (or planned).
    - **Test Steps:**
      1. Request poster images and inspect response headers for cache-control and content delivery behavior.
      2. Purge cache and confirm updated images are served.
    - **Expected Result:** Images served with appropriate caching headers; CDN integration (if present) works.
    - **Pass Criteria:** Cache headers present and updates propagate after purge.

  - **FR-29 — Data Privacy / User Deletion (GDPR)**
    - **Test ID:** TC-29-DataDeletion
    - **Precondition:** User data model exists and deletion process defined (or planned).
    - **Test Steps:**
      1. Request deletion of a test user account via API or UI.
      2. Verify personal data is anonymized or removed and backups handled per policy.
    - **Expected Result:** Personal data removed/anonymized and no residual PII remains accessible.
    - **Pass Criteria:** Deletion workflow completes and verification shows data removed per policy.

  - **FR-30 — Healthchecks & Metrics**
    - **Test ID:** TC-30-HealthMetrics
    - **Precondition:** Health endpoint (`/health` or `/metrics`) exists or planned.
    - **Test Steps:**
      1. Call `/health` and ensure status 200 and basic checks (DB reachable, disk space OK).
      2. Scrape `/metrics` (Prometheus format) or verify basic metrics exist (request counts, error rates).
    - **Expected Result:** Health endpoint returns 200 with service status; metrics exposed for observability.
    - **Pass Criteria:** Health and metrics endpoints respond and show expected values.

  Automation / CI follow-up
  - Add automated jobs for performance (k6) and accessibility audits into CI as optional pipelines.
  - Include DB backup/restore verification step in staging job (non-destructive when possible).

