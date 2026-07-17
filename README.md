# Absolute Cinema

A full-stack cinema platform with a public customer website, an administration panel, a REST API, online seat booking, card payments, electronic tickets, automated testing, and continuous deployment.

This project was developed as a team project during the Software Development programme at Tallinn Polytechnic School.

## Project Team

- **Sofja Portnova**
- **Elnar Käst**
- **Artur Genno**

The repository contains contributions from all three developers.

## Live Demo

[Open Absolute Cinema](https://absolutecinema.spjo.eu)

> The live version may use a different database and configuration from the local development version.

## Project Overview

Absolute Cinema consists of three main components:

- **Main Site** — a customer-facing cinema website
- **Admin Worker Site** — an internal administration dashboard
- **API Server** — an Express REST API connected to an SQLite database

Customers can browse movies, search for sessions, select seats, complete bookings, purchase gifts, make card payments, and receive electronic tickets by email.

Administrators can manage movies, sessions, cinemas, halls, and other platform data through a separate administration interface.

## Main Features

### Customer Website

- Home page with featured content
- Movie catalogue
- Movie detail pages
- Top movies section
- Coming-soon movies
- Genre filtering
- Cinema information pages
- Events and themed landing pages
- Family screening information
- Birthday event information
- Showtime search and filtering
- Interactive seat selection
- Shopping cart
- Gift purchase flow
- Booking and checkout
- Stripe card payment support
- Electronic ticket delivery by email
- Responsive design for desktop and mobile devices

### Administration Panel

- Administrator authentication
- Dashboard overview
- Movie creation, editing, and deletion
- Session creation, editing, and deletion
- Bulk deletion of sessions by date range
- Cinema and hall data management
- Responsive administration interface

### Backend and Database

- REST API built with Node.js and Express
- SQLite database
- Movie management
- Genre management
- Session management
- Cinema and hall management
- Gift management
- Seat availability management
- Booking functionality
- Protection against double-booking
- Input validation
- Error handling
- Email ticket delivery
- Stripe payment integration

## Team Contribution

The project was developed collaboratively by:

- Sofja Portnova
- Elnar Käst
- Artur Genno

Team responsibilities included:

- frontend development;
- backend and REST API development;
- database integration;
- movie and session management;
- user and administration functionality;
- responsive interface development;
- booking and seat-selection functionality;
- testing and debugging;
- CI/CD configuration;
- production deployment;
- documentation.

This README describes the complete team project and does not imply that one developer created the entire platform independently.

## Technology Stack

### Frontend

- JavaScript
- React 19
- React Router
- Vite 7
- HTML
- CSS
- Responsive Web Design

### Backend

- Node.js
- Express 5
- REST API

### Database

- SQLite
- `better-sqlite3`
- SQL

### Testing and Code Quality

- Vitest
- Playwright
- API integration testing
- End-to-end testing
- ESLint
- Automated test coverage

### DevOps and Deployment

- Git
- GitHub
- GitHub Actions
- CI/CD
- SSH deployment
- PM2
- GitHub Pages pull-request previews

### External Services

- Stripe
- SMTP email delivery
- Google Search Console

## Repository Structure

```text
.
├── main-site/
│   ├── public/
│   ├── src/
│   ├── server/
│   └── package.json
│
├── admin-worker-site/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── database/
│   └── db.sqlite
│
├── queries/
│   └── SQL query examples
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-zone.yml
│
├── test_endpoints.js
├── test_api.js
├── check_db.js
├── check_coming_table.js
└── package.json
```

## Requirements

Before running the project, install:

- Node.js LTS
- npm
- Git

The local SQLite database must be available at:

```text
database/db.sqlite
```

## Installation

Clone the repository:

```bash
git clone https://github.com/Tallinna-Polutehnikum/TA23B-B3-projekt.git
```

Open the project folder:

```bash
cd TA23B-B3-projekt
```

Install dependencies for the main website and API:

```bash
cd main-site
npm install
```

Install dependencies for the administration website:

```bash
cd ../admin-worker-site
npm install
```

Install root dependencies for helper scripts:

```bash
cd ..
npm install
```

## Environment Configuration

Environment files must not be committed to GitHub.

Make sure the following entries are included in `.gitignore`:

```text
.env
.env.local
.env.*
```

### Administrator Authentication

Create or update:

```text
main-site/.env.local
```

Add secure administrator credentials:

```env
ADMIN_LOGIN_EMAIL=your_admin_email
ADMIN_LOGIN_PASSWORD=your_secure_password
ADMIN_LOGIN_USERNAME=your_admin_username
```

Never publish real administrator credentials in the repository, source code, or README.

### Email Ticket Delivery

To send electronic tickets after successful bookings, add SMTP configuration to:

```text
main-site/.env.local
```

Example configuration:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="Absolute Cinema <tickets@your-domain.com>"
```

Gmail configuration example:

```env
SMTP_SERVICE=gmail
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_google_app_password
SMTP_FROM="Absolute Cinema <your_email@gmail.com>"
```

Optional SSL configuration:

```env
SMTP_PORT=465
SMTP_SECURE=true
```

Accepted variable aliases may include:

```env
SMTP_SERVER=your_smtp_server
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

If SMTP configuration is missing, booking can still work, but ticket email delivery will be skipped.

Use an application-specific password when connecting a Gmail account. Do not use or publish the normal account password.

### Stripe Card Payments

Stripe payments require both a server-side secret key and a client-side publishable key.

Add the secret key to:

```text
main-site/.env.local
```

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
```

An optional webhook secret can also be configured:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Add the public key to the Vite environment configuration:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

The Stripe secret key must never be exposed in frontend code or committed to GitHub.

If the required Stripe keys are missing, card payment functionality is disabled automatically.

## Running the Project

Run the backend API and both frontend applications in separate terminals.

### Terminal 1 — Backend API

```bash
cd main-site
npm run server
```

The API runs by default at:

```text
http://localhost:4000
```

### Terminal 2 — Main Website

```bash
cd main-site
npm run dev
```

The main website runs by default at:

```text
http://localhost:5173
```

### Terminal 3 — Administration Website

```bash
cd admin-worker-site
npm run dev
```

The administration website runs by default at:

```text
http://localhost:5156
```

The backend API must be running before the frontend applications can retrieve live data.

### Windows PowerShell Note

If PowerShell blocks npm scripts, use `npm.cmd`:

```powershell
npm.cmd run server
```

```powershell
npm.cmd run dev
```

## Administration Panel Deployment

The administration panel can be hosted under the same domain as the public website.

Example build-time configuration:

```env
VITE_BASE_PATH=/admin/
VITE_API_BASE_URL=
```

When `VITE_API_BASE_URL` is empty, API requests use the same origin through `/api/*`.

Production credentials and domain-specific configuration must be stored in environment variables or repository secrets.

## Production Build

Build the main website:

```bash
cd main-site
npm run build
```

Build the administration website:

```bash
cd ../admin-worker-site
npm run build
```

The generated production files are placed in the corresponding `dist` directories.

## API Overview

The local API base URL is:

```text
http://localhost:4000
```

Example public endpoints:

```http
GET /api/movies
GET /api/movies/top
GET /api/movies/coming-soon
GET /api/genres
GET /api/sessions
GET /api/sessions/:id/seats
POST /api/sessions/:id/book
```

Example administration endpoints:

```http
POST /api/movies
PUT /api/movies/:id
DELETE /api/movies/:id

POST /api/sessions
PUT /api/sessions/:id
DELETE /api/sessions/:id

POST /api/sessions/bulk-delete
```

Administrative endpoints require authentication.

## Useful Helper Commands

Run endpoint checks from the repository root:

```bash
node test_endpoints.js
```

Run API checks:

```bash
node test_api.js
```

Check the database:

```bash
node check_db.js
```

Check coming-soon movie data:

```bash
node check_coming_table.js
```

Run movie synchronisation from the main-site directory:

```bash
npm run sync:movies
```

## Testing

Run automated tests from the relevant project directory:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test -- --coverage
```

The project includes:

- unit tests;
- API integration tests;
- Playwright end-to-end tests;
- automated coverage validation;
- frontend build verification.

## Continuous Integration

The repository includes a GitHub Actions CI workflow:

```text
.github/workflows/ci.yml
```

The workflow runs on pushes and pull requests.

For the main and administration applications, CI can perform:

- dependency installation;
- linting;
- automated testing;
- test coverage validation;
- production build verification.

The minimum statement coverage target is:

```text
70%
```

## Pull Request Previews

Pull requests created from branches in this repository can receive temporary frontend preview deployments through GitHub Pages.

A preview URL can be added automatically to the pull request by the CI workflow.

## Automatic Deployment

The repository includes a production deployment workflow:

```text
.github/workflows/deploy-zone.yml
```

The deployment process can:

- connect to the production server over SSH;
- synchronise application files;
- install dependencies;
- build the application;
- restart the Node.js process;
- verify API health;
- verify the public website.

Production server addresses, usernames, SSH keys, database paths, passwords, and other sensitive values must be stored in GitHub repository secrets.

Example secret names:

```text
DEPLOY_HOST
DEPLOY_USER
DEPLOY_PATH
DEPLOY_SSH_PRIVATE_KEY
```

Do not publish real secret values in the README.

## Manual Database Synchronisation

The normal deployment process should not overwrite the production database.

Database replacement should only be performed through a separate manual workflow when a planned migration or reset is required.

Recommended safety steps:

1. Confirm that the database replacement is intentional.
2. Create a backup of the production database.
3. Upload the new database.
4. Verify the uploaded database.
5. Restart the application if necessary.
6. Confirm that the website and API work correctly.

A manual confirmation value can be required before the workflow runs.

## Search Engine Indexing

The project includes:

```text
main-site/public/robots.txt
main-site/public/sitemap.xml
```

The main HTML file also includes canonical and robots metadata.

For production indexing:

1. Add the production domain to Google Search Console.
2. Verify domain ownership.
3. Submit the sitemap.
4. Use URL Inspection for the home page.
5. Request indexing for important pages.

## Security Notes

- Never commit `.env` files.
- Never publish real passwords.
- Never publish secret API keys.
- Use strong and unique administrator credentials.
- Store production secrets in GitHub repository secrets.
- Use a Google App Password for Gmail SMTP.
- Rotate any credential that has previously been published.
- Restrict administrator endpoints on the backend.
- Do not expose the production database publicly.
- Review Git history if a secret was accidentally committed.
- Do not rely only on frontend checks for administrator security.
- Validate and authorise protected operations on the server.

## Known Notes

- The backend must be running before the frontends can use live data.
- The local project relies on `database/db.sqlite`.
- SMTP environment variables are required for ticket email delivery.
- Stripe environment variables are required for card payments.
- PowerShell users may need to use `npm.cmd`.
- Production configuration may differ from local development.
- The live version may contain different data from the repository database.

## Development Highlights

Development work included:

- genre filtering;
- movie catalogue improvements;
- seat map improvements;
- events and cinema pages;
- payment flow development;
- administration panel functionality;
- session management;
- bulk deletion of sessions by date range;
- database connection improvements;
- responsive interface improvements;
- email ticket delivery;
- Stripe card payment integration;
- CI/CD implementation;
- production deployment automation;
- API integration tests;
- Playwright end-to-end tests.

## What We Learned

This project helped the team develop practical skills in:

- full-stack web development;
- React application development;
- Node.js and Express;
- REST API development;
- SQLite and SQL;
- authentication and protected endpoints;
- booking system development;
- payment integration;
- email delivery;
- responsive interface development;
- automated testing;
- API integration testing;
- end-to-end testing;
- debugging production issues;
- CI/CD;
- deployment automation;
- Git and GitHub collaboration;
- teamwork and project organisation.

## Contributors

Absolute Cinema was developed by:

- **Sofja Portnova**
- **Elnar Käst**
- **Artur Genno**

This repository contains work and contributions from all members of the development team.

## Repository

[github.com/Tallinna-Polutehnikum/TA23B-B3-projekt](https://github.com/Tallinna-Polutehnikum/TA23B-B3-projekt)
