# Automated Testing Report Template

## 1. Project and Team
- Project name: Absolute Cinema
- Team members: Artur Genno, Sofja Portnova, Elnar Käst
- Commit/tag tested: Local working tree on May 13, 2026
- Test date: 2026-05-13

## 2. Frameworks and Tools
- Unit tests: Vitest
- API integration tests: Vitest + native fetch + temporary Node child process for API startup
- E2E tests: Playwright (Chromium)
- CI/runner used (if any): Local run in VS Code terminal (PowerShell)

## 3. Tested Scenarios

### Unit tests
- Scenario 1: Poster URL normalization in movie UI helpers (relative, absolute, protocol-relative, data URL, invalid URL fallback)
- Scenario 2: Duration and display text formatting helpers return expected UI-safe values
- Scenario 3: Session card regression check confirms trailer button is removed and Buy Tickets remains visible in source

### API tests
- Scenario 1: Public GET endpoints respond successfully and return arrays (/api/movies/top, /api/genres)
- Scenario 2: Protected admin endpoint is rejected without authentication (/api/admin/stats returns 401)
- Scenario 3: Admin login flow returns token and authenticated /api/auth/me returns admin user object

### E2E tests
- Scenario 1: Guest can open home page, navigate to Movies and Showtime routes, and open login page
- Scenario 2: URL assertions confirm route transitions for /movies, /showtime, and /profile?mode=login
- Scenario 3: Login page renders expected heading (Welcome back) after navigation

## 4. Coverage
- Unit + integration coverage command:
	- main-site: npm.cmd run test
	- admin-worker-site: npm.cmd run test
- Lines coverage (%):
	- main-site: 100%
	- admin-worker-site: 100%
- Statements coverage (%):
	- main-site: 100%
	- admin-worker-site: 100%
- Functions coverage (%):
	- main-site: 100%
	- admin-worker-site: 100%
- Branches coverage (%):
	- main-site: 96.66%
	- admin-worker-site: 100%
- Coverage report path:
	- main-site/coverage/coverage-summary.json
	- admin-worker-site/coverage/coverage-summary.json

## 5. Findings and Problems
- Bug/issue found 1: JSX duplicate className attribute warnings appeared in App.jsx and HeroBanner.jsx during E2E run
- Bug/issue found 2: E2E failed before browser installation because Playwright Chromium executable was missing
- Flaky/unstable test notes: No flaky behavior observed after Playwright browser installation and stable routing assertions
- Environment/setup issues: Node version warning for Vitest engine requirements appears on this machine (Node v23.1.0)

## 6. Conclusions
- What is already reliable: Core helper logic, basic API auth/public route behavior, and a minimal guest navigation user journey
- What still needs testing: Booking flow with seat reservation, checkout payment branches, profile/account update edge cases, and admin CRUD flows end-to-end
- Next testing priorities:
	- Add E2E scenario for full ticket purchase flow (select session -> choose seats -> checkout)
	- Add API negative tests for invalid payloads and conflict cases
	- Expand unit coverage to additional frontend components and business logic utilities
