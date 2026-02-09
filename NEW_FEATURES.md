# New Features - Filtering, Seats and Admin Panel

## 1. Filtering on Main Page (Showtimes)

### Added filters:
- **City** - automatically extracted from cinema name (Tallinn, Tartu, etc.)
- **Date** - selection from 7 days forward (already existed)
- **Genre** - dynamically loaded from DB, filters sessions by selected genre

### How it works:
```javascript
// Cities automatically identified from cinema field in DB
// Genres obtained from genres field in sessions
// Filtering happens in real time when filters change
```

### Component: `main-site/src/components/Showtimes.jsx`

---

## 2. Seat System (SeatMap)

### Functionality:
- **Visual seat map** - 10 rows × 15 seats
- **Seat statuses:**
  - 🟢 Green - available (can select)
  - 🔴 Red - occupied (unavailable)
  - 🟣 Purple - selected (highlighted)

- **Price information** - €12 per seat
- **List of selected seats** - displays selected seats (A1, B5, etc.)
- **Legend** - explains meaning of each color

### How to use:
```jsx
import SeatMap from "./SeatMap";

// In component
<SeatMap 
  sessionId={session.id}
  onClose={() => setShowSeatMap(false)}
/>
```

### Component: 
- `main-site/src/components/SeatMap.jsx`
- `main-site/src/components/SeatMap.css`

### Integration:
- SessionCard component now opens SeatMap when "Buy Tickets" is clicked

---

## 3. Admin Panel

### Structure:
```
Admin Dashboard
├── Overview (main screen with statistics)
├── Movies Management (movie list)
├── Sessions Management (session list)
├── Add New Movie (add movie form)
├── Add New Session (add session form)
└── Settings (configuration and reports)
```

### 📊 Dashboard Overview
Shows:
- Number of movies in DB
- Active sessions
- Cinemas
- Revenue for today
- Quick actions

### 🎬 Movie Management

#### Add Movie form includes:
- ✓ Movie title (required)
- ✓ Original title
- ✓ Description (required)
- ✓ Poster URL (required)
- ✓ Duration in minutes (required)
- ✓ Release date (required)
- ✓ Genre (required - select from list)
- ✓ IMDb rating (optional)
- ✓ Directors (optional)

#### Movie list shows:
- Movie poster
- Title
- Description
- Genre
- Action buttons (Edit, Delete)

### 🎫 Session Management

#### Add Session form includes:
- ✓ Movie selection (required)
- ✓ Cinema selection (required)
- ✓ Session date (required)
- ✓ Session time (required)
- ✓ Hall number (default 1)
- ✓ Available seats (required)
- ✓ Language (default Estonian)
- ✓ Subtitles (optional)
- ✓ Format (2D, 3D, IMAX, 4DX)

#### Session list shows:
- Movie title
- Cinema
- Date and time
- Hall number
- Number of free seats (with color code)
- Language and format
- Action buttons (Edit, Delete)

### Components:
```
admin-worker-site/src/components/
├── AdminDashboard.jsx (main component)
├── AdminDashboard.css
├── AddMovieForm.jsx (add movie form)
├── AddMovieForm.css
├── AddSessionForm.jsx (add session form)
├── AddSessionForm.css
├── MoviesList.jsx (movie list)
├── MoviesList.css
├── SessionsList.jsx (session list)
└── SessionsList.css
```

---

## 4. API Endpoints

### GET Endpoints (existing):
- `GET /api/movies/top` - top 20 movies
- `GET /api/sessions` - all sessions
- `GET /api/sessions/:id/seats` - **NEW** - seats for session

### POST Endpoints (new):
- `POST /api/movies` - add new movie
  ```json
  {
    "title": "Movie Title",
    "originalTitle": "Original Title",
    "overview": "Description",
    "poster": "https://...",
    "duration": 120,
    "genre": "Action",
    "directors": "Director Name",
    "releaseDate": "2024-01-01",
    "rating": 8.5
  }
  ```

- `POST /api/sessions` - add new session
  ```json
  {
    "movieId": 1,
    "cinema": "Tallinn - Kino",
    "date": "2024-02-10",
    "time": "18:30",
    "hall": "1",
    "seatsAvailable": 100,
    "language": "Estonian",
    "subtitles": "English",
    "format": "2D"
  }
  ```

---

## 5. Design and UI

### Color scheme:
- Main color: **#00d084** (green - primary actions)
- Background: **#0f0f0f**, **#1a1a1a** (dark)
- Text: **#fff**, **#ddd**, **#aaa** (different levels)
- Errors: **#ff4444** (red)
- Warnings: **#ff8800** (orange)

### Responsiveness:
- ✓ Full mobile device support
- ✓ Responsive admin panel (side nav becomes horizontal on mobile)
- ✓ SeatMap optimized for touch screens
- ✓ Tables hide columns on small screens

---

## 6. Notes

### For SeatMap API:
Endpoint `/api/sessions/:id/seats` returns:
```json
{
  "sessionInfo": {
    "id": 1,
    "title": "Movie Title",
    "cinema": "Cinema Name",
    "time": "18:30"
  },
  "seats": [
    {
      "id": "seat-0-0",
      "row": "A",
      "number": 1,
      "occupied": false
    },
    ...
  ]
}
```

### Form validation:
- All required fields marked with asterisk (*)
- Client-side validation before submission
- Server-side validation with error handling

### Loading states:
- Buttons disabled during loading
- Button text changes to "Loading..."
- Error message shown on failure

---

## 7. TODO Features (for future improvements)

- [ ] Edit movie/session
- [ ] Delete movie/session (with confirmation)
- [ ] Search by name
- [ ] Sorting in tables
- [ ] Pagination
- [ ] Export reports
- [ ] Sync between tabs (if one admin changes data)
- [ ] Notification system
- [ ] Archive sessions
