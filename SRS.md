# Software Requirements Specification (SRS)

Project: Absolute Cinema
Version: 2.0
Date: 2026-03-30
Status: Active

---

## 1. Purpose

This document defines the functional and non-functional requirements for the Absolute Cinema project in its current repository state.

It is written for:

- developers
- testers
- project supervisors
- maintainers

---

## 2. Scope

Absolute Cinema is a cinema platform with:

- a public web application for end users
- an admin web application for cinema workers
- a local REST API server
- a local SQLite database

The system supports movie browsing, session discovery, seat booking, and admin-side content/session management.

---

## 3. Product Overview

### 3.1 Main Components

- main-site: public React + Vite app
- admin-worker-site: admin React + Vite app
- main-site/server: Express API server
- database/db.sqlite: SQLite data storage

### 3.2 Runtime Context

- API base URL: http://localhost:4000
- Main site dev URL: http://localhost:5173
- Admin site dev URL: http://localhost:5156

---

## 4. User Classes

- Guest User: browses movies and sessions, selects seats
- Customer: uses cart and checkout flow
- Admin Worker: manages movies and sessions
- Maintainer: runs scripts, monitors API, and updates data

---

## 5. Functional Requirements

### FR-01 Top Movies

The system shall provide a top movies list on the public site.

Acceptance:

- API endpoint GET /api/movies/top returns JSON list with id, title, overview, poster.

### FR-02 Movie Catalog and Details

The system shall provide:

- full movie catalog
- single movie details view

Acceptance:

- GET /api/movies returns list
- GET /api/movies/:id returns details or 404 for unknown id

### FR-03 Genres and Genre-Based Movies

The system shall support genre listing and genre-based movie retrieval.

Acceptance:

- GET /api/genres returns genre list
- GET /api/genres/:type/movies returns movies by genre or 404 when empty

### FR-04 Gifts and Coming Soon

The system shall provide gifts and coming soon movie data.

Acceptance:

- GET /api/gifts returns gift list ordered by price
- GET /api/movies/coming-soon returns coming soon data

### FR-05 Session Listing and Filtering

The system shall provide session listing data required by the showtime page, including city/cinema, date/time, and genre data.

Acceptance:

- GET /api/sessions returns joined session data sorted by date and time
- Frontend filters by city, date, and genre

### FR-06 Seat Map Retrieval

The system shall provide seat map data for a selected session.

Acceptance:

- GET /api/sessions/:id/seats returns sessionInfo and seat list with occupied status
- Unknown session id returns 404

### FR-07 Seat Booking

The system shall allow booking one or more seats for a session and prevent duplicate bookings.

Acceptance:

- POST /api/sessions/:id/book accepts seatIds[]
- Returns 201 on success
- Returns 409 if one or more seats are already booked
- Updates remaining seat count for the session

### FR-08 Cart and Checkout (Public UI)

The public site shall support:

- adding gifts to cart
- adding selected seats to cart
- quantity updates and removals
- checkout completion flow

Acceptance:

- cart totals and item counts update correctly
- checkout completion clears cart

### FR-09 Admin Movie Management

Admin workers shall be able to create, update, and delete movies.

Acceptance:

- POST /api/movies creates movie
- PUT /api/movies/:id updates movie
- DELETE /api/movies/:id removes movie

### FR-10 Admin Session Management

Admin workers shall be able to create, update, and delete sessions.

Acceptance:

- POST /api/sessions creates session with hall and cinema validation
- PUT /api/sessions/:id updates session
- DELETE /api/sessions/:id removes session

### FR-11 Admin Bulk Session Deletion

Admin workers shall be able to remove sessions by date range.

Acceptance:

- POST /api/sessions/bulk-delete accepts startDate and endDate
- Returns number of deleted rows

### FR-12 Database Access

The backend shall read and write to the local SQLite database file.

Acceptance:

- server starts only when database/db.sqlite is accessible
- database errors are logged and result in safe error responses

---

## 6. Non-Functional Requirements

### NFR-01 Reliability

- API server must remain running during normal request flow.
- Booking writes must be transactional to protect data integrity.

### NFR-02 Performance

- Standard list endpoints should respond within 1500 ms in local development with normal dataset size.

### NFR-03 Maintainability

- Codebase is separated into two frontends and one backend module.
- ESLint configuration is used in frontend projects.

### NFR-04 Usability

- Public site routes and admin tabs must be navigable without page crashes.
- Error cases should show clear feedback in UI or API response body.

### NFR-05 Compatibility

- Frontends must run in modern Chromium-based browsers and Firefox.
- Development startup must work on Windows with Node.js and npm.

### NFR-06 Security Baseline

- API accepts JSON payloads only for write operations.
- Invalid payloads should return 4xx responses, not crash the server.
- No seat may be sold twice for the same session.

---

## 7. External Interface Requirements

### 7.1 User Interface

- Main site: React SPA with routes for home, showtime, movies, events, cinemas, checkout, and more.
- Admin site: React dashboard with tabs for overview, movies, sessions, add movie, add session.

### 7.2 API Interface

- REST over HTTP
- JSON request/response format
- Status code expectations:
  - 200 for successful reads/updates
  - 201 for successful creates/bookings
  - 204 for successful delete without body
  - 400 for invalid request data
  - 404 for missing resource
  - 409 for booking conflict
  - 500 for unexpected server errors

### 7.3 Database Interface

- SQLite file: database/db.sqlite
- Backend uses better-sqlite3
- Booking and update operations may use transactions

---

## 8. Assumptions and Constraints

- This project currently targets local or classroom deployment.
- Authentication and role-based authorization are not fully implemented in this repository state.
- Payment gateway integration is out of scope for this SRS version.
- Availability depends on local database file integrity.

---

## 9. Verification and Test Matrix

| ID | Requirement | Verification Method |
| --- | --- | --- |
| TC-01 | FR-01 | Call GET /api/movies/top and verify UI section displays returned items |
| TC-02 | FR-02 | Call GET /api/movies and GET /api/movies/:id with valid and invalid id |
| TC-03 | FR-03 | Call GET /api/genres and GET /api/genres/:type/movies |
| TC-04 | FR-04 | Call GET /api/gifts and GET /api/movies/coming-soon |
| TC-05 | FR-05 | Open showtime page, verify filters and session data correctness |
| TC-06 | FR-06 | Call GET /api/sessions/:id/seats for valid and invalid id |
| TC-07 | FR-07 | Book seats twice and verify second attempt returns 409 |
| TC-08 | FR-08 | Add gifts and seats to cart, verify totals, complete checkout |
| TC-09 | FR-09 | Use admin UI or API to create, edit, and delete a movie |
| TC-10 | FR-10 | Use admin UI or API to create, edit, and delete a session |
| TC-11 | FR-11 | Use bulk delete with date range and verify deleted counts |
| TC-12 | FR-12 | Start server with and without DB file and verify behavior |

---

## 10. Traceability Notes

- This SRS reflects the implemented architecture and endpoints in the current repository.
- If new major modules are added, update both README and this SRS in the same change set.
