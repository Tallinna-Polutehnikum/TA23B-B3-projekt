# 🏗️ Architecture and Component Structure

## Main Site (User-Facing Application)

```
App.jsx
├── Header
│   ├── SearchBar
│   ├── Navigation
│   └── Cart
├── HeroBanner
├── Showtimes (✅ UPDATED)
│   ├── Location Filter (city)
│   ├── Date Selector (days)
│   ├── Genre Filter (new)
│   └── SessionCard[]
│       ├── Movie Info
│       ├── Session Details
│       └── "Buy Tickets" Button
│           └── SeatMap Modal (✅ NEW)
│               ├── Screen Label
│               ├── Seats Grid
│               │   ├── Row A-J
│               │   └── Seats 1-15
│               ├── Legend
│               └── Footer (Total Price, Buttons)
├── TopMovies
├── Genres
├── Gifts
├── ComingSoon
└── Footer
```

### Data Flow:

```
Browser
  ↓
Main Site (Vite)
  ↓
API Server (Port 4000)
  ↓
Database (SQLite)
  ├── movies
  ├── sessions
  ├── genres
  └── seats (derived)
```

---

## Admin Panel (Administrator Section)

```
App.jsx
└── AdminDashboard.jsx (✅ НОВОЕ)
    ├── Header
    │   ├── Brand (Absolute Cinema)
    │   └── User Profile
    ├── Sidebar (Navigation)
    │   ├── Dashboard
    │   │   └── Overview
    │   ├── Manage Content
    │   │   ├── Movies
    │   │   └── Sessions
    │   ├── Add New
    │   │   ├── New Movie
    │   │   └── New Session
    │   └── Settings
    │       ├── Configuration
    │       └── Reports
    └── Main Content Area
        ├── Overview Tab
        │   ├── Stats Grid
        │   │   ├── Movies Count
        │   │   ├── Sessions Count
        │   │   ├── Cinemas Count
        │   │   └── Revenue
        │   └── Quick Actions
        │
        ├── Movies Management Tab
        │   ├── Header (with "Add Movie" button)
        │   └── MoviesList Component
        │       └── Table
        │           ├── Poster
        │           ├── Title
        │           ├── Overview
        │           ├── Genre
        │           └── Actions (Edit, Delete)
        │
        ├── Sessions Management Tab
        │   ├── Header (with "Add Session" button)
        │   └── SessionsList Component
        │       └── Table
        │           ├── Movie
        │           ├── Cinema
        │           ├── Date
        │           ├── Time
        │           ├── Hall
        │           ├── Seats
        │           ├── Language
        │           ├── Format
        │           └── Actions (Edit, Delete)
        │
        ├── Add Movie Tab
        │   └── AddMovieForm Component
        │       ├── Title Input
        │       ├── Original Title Input
        │       ├── Duration Input
        │       ├── Release Date Picker
        │       ├── Genre Select
        │       ├── Rating Input
        │       ├── Directors Input
        │       ├── Poster URL Input
        │       ├── Overview Textarea
        │       └── Submit Button
        │
        └── Add Session Tab
            └── AddSessionForm Component
                ├── Movie Select
                ├── Cinema Select
                ├── Date Picker
                ├── Time Picker
                ├── Hall Select
                ├── Seats Input
                ├── Language Select
                ├── Subtitles Select
                ├── Format Select
                └── Submit Button
```

### Поток Данных:

```
Admin Panel (Vite)
  ↓
API Server (Port 4000)
  ↓
Database (SQLite)

Requests:
- GET /api/movies/top → MoviesList, AddSessionForm
- GET /api/sessions → SessionsList
- POST /api/movies → Add Movie
- POST /api/sessions → Add Session
```

---

## Component Hierarchy

### Main Site Components

**File: `src/components/Showtimes.jsx`**
- State: activeDay, location, selectedGenre, sessions, availableGenres
- Props: (none)
- Children: SessionCard[]
- Features:
  - Dynamic city extraction from cinema names
  - Real-time genre filtering
  - Multi-filter support

**File: `src/components/SessionCard.jsx`**
- State: showSeatMap
- Props: session { id, title, poster, cinema, time, date, hall, genres, seats, language, subtitles, format }
- Children: SeatMap
- Features:
  - Opens SeatMap on "Buy Tickets"
  - Displays session information

**File: `src/components/SeatMap.jsx`**
- State: seats, selectedSeats, loading, sessionInfo
- Props: sessionId, onClose
- API: GET `/api/sessions/:id/seats`
- Features:
  - 10x15 seat grid
  - Real-time price calculation
  - Seat selection/deselection
  - Legend

---

### Admin Panel Components

**File: `src/components/AdminDashboard.jsx`**
- State: activeTab, refresh
- Props: (none)
- Children: AddMovieForm, AddSessionForm, MoviesList, SessionsList
- Features:
  - Tab-based navigation
  - Quick stats display
  - Main content switching

**File: `src/components/AddMovieForm.jsx`**
- State: loading, error, formData
- Props: onSuccess
- API: POST `/api/movies`
- Features:
  - Form validation
  - Genre selection
  - Error handling
  - Success callback

**File: `src/components/AddSessionForm.jsx`**
- State: loading, error, movies, formData
- Props: onSuccess
- API: GET `/api/movies/top`, POST `/api/sessions`
- Features:
  - Dynamic movie loading
  - Cinema selection
  - Multiple options (language, format, etc.)

**File: `src/components/MoviesList.jsx`**
- State: movies, loading
- Props: refresh
- API: GET `/api/movies/top`
- Features:
  - Responsive table
  - Movie thumbnails
  - Edit/Delete buttons (UI ready)

**File: `src/components/SessionsList.jsx`**
- State: sessions, loading
- Props: refresh
- API: GET `/api/sessions`
- Features:
  - Responsive table with column hiding
  - Color-coded seat availability
  - Edit/Delete buttons (UI ready)

---

## API Endpoints Structure

### GET Endpoints

```
├── /api/movies
│   ├── /api/movies/top (20 movies)
│   ├── /api/movies/:id (movie details)
│   └── /api/movies/coming-soon (coming soon)
│
├── /api/sessions
│   ├── /api/sessions (all sessions) - ✅ updated with genres
│   └── /api/sessions/:id/seats (seats) - ✅ new
│
├── /api/gifts
│
└── Others...
```

### POST Endpoints (new)

```
├── /api/movies
│   └── Creates new movie
│       ├── Required: title, overview, poster, duration
│       ├── Optional: genre, directors, releaseDate, rating
│       └── Returns: { id, title, ... }
│
└── /api/sessions
    └── Creates new session
        ├── Required: movieId, cinema, date, time, seatsAvailable
        ├── Optional: hall, language, subtitles, format
        └── Returns: { id, movieId, cinema, ... }
```

---

## State Management

### Main Site

```
App.jsx
├── cart[] (gifts)
├── showCart (boolean)

Showtimes.jsx
├── activeDay (string)
├── location (string)
├── selectedGenre (string)
├── sessions[] (from API)
├── availableGenres[] (derived)

SessionCard.jsx
├── showSeatMap (boolean)

SeatMap.jsx
├── seats[] (from API)
├── selectedSeats[] (user selected)
├── loading (boolean)
├── sessionInfo (object)
```

### Admin Panel

```
AdminDashboard.jsx
├── activeTab (string)
├── refresh (number - trigger)

AddMovieForm.jsx
├── loading (boolean)
├── error (string)
├── formData {} (form fields)

AddSessionForm.jsx
├── loading (boolean)
├── error (string)
├── movies[] (from API)
├── formData {} (form fields)

MoviesList.jsx
├── movies[] (from API)
├── loading (boolean)

SessionsList.jsx
├── sessions[] (from API)
├── loading (boolean)
```

---

## Data Flow Diagrams

### Adding a Movie

```
User fills AddMovieForm
       ↓
Form validation (client-side)
       ↓
POST /api/movies
       ↓
Server validation
       ↓
Database INSERT
       ↓
Response with new movie ID
       ↓
onSuccess callback
       ↓
Refresh MoviesList
       ↓
User redirected to Movies tab
```

### Selecting Seats

```
User clicks "Buy Tickets"
       ↓
SeatMap opens
       ↓
GET /api/sessions/:id/seats
       ↓
Generate seats grid (10x15)
       ↓
Display with 30% random occupied seats
       ↓
User clicks available seats
       ↓
Update selectedSeats state
       ↓
Recalculate total price (seats * €12)
       ↓
Display selected seats list
       ↓
User clicks "Book Seats"
       ↓
Send to cart/checkout (future)
```

### Filtering Sessions

```
User selects filters
       ↓
onChange event triggers
       ↓
State updates (location, selectedGenre, activeDay)
       ↓
filteredSessions computed
       ↓
Component re-renders
       ↓
Only matching sessions display
```

---

## Performance Optimizations

1. **API Caching**
   - Sessions loaded once in Showtimes
   - Movies loaded once in AdminDashboard

2. **Lazy Loading**
   - MoviesList loads on demand (Movies tab)
   - SessionsList loads on demand (Sessions tab)

3. **Conditional Rendering**
   - Modals only render when needed (showSeatMap, activeTab)
   - Tables hide columns on mobile

4. **Memoization**
   - Available genres computed once
   - Cities computed on demand

---

## CSS Architecture

### Naming Convention (BEM)

```css
/* Block */
.seat-map {}

/* Block__Element */
.seat-map__header {}
.seat-map__grid {}

/* Block__Element--Modifier */
.seat__occupied {}
.seat__selected {}
.btn-submit:disabled {}
```

### CSS Variables (Future Enhancement)
```css
--primary-color: #00d084
--dark-bg: #0f0f0f
--dark-bg-secondary: #1a1a1a
--border-color: #333
--text-primary: #fff
--text-secondary: #ddd
--text-tertiary: #aaa
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
```

---

## Error Handling

### Frontend

```javascript
try {
  const response = await fetch(url)
  if (!response.ok) throw new Error('API Error')
  const data = await response.json()
  setData(data)
} catch (err) {
  setError(err.message)
  // Display to user
}
```

### Backend

```javascript
app.post('/api/movies', (req, res) => {
  // Validate required fields
  if (!title || !overview) {
    return res.status(400).json({ message: 'Missing fields' })
  }
  
  try {
    // Do work
    res.status(201).json(result)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})
```

---

## Responsive Design Breakpoints

```css
Mobile: < 768px
  - Seat grid smaller (28px seats)
  - Table columns hidden (overview, language, format)
  - Admin sidebar becomes horizontal scrollable
  - Forms stack vertically

Tablet: 768px - 1024px
  - Seat grid medium (30px seats)
  - More table columns visible
  - Admin sidebar with reduced width
  - Some columns still hidden

Desktop: > 1024px
  - Seat grid full (32px seats)
  - All table columns visible
  - Full admin sidebar
  - Optimal layout
```

---

## Future Architecture Considerations

1. **State Management**
   - Consider Redux/Zustand if app grows
   - Currently using local state is sufficient

2. **API**
   - Consider API versioning (/api/v1/)
   - Add rate limiting for production
   - Add authentication/authorization

3. **Testing**
   - Unit tests for components
   - Integration tests for forms
   - E2E tests for workflows

4. **Performance**
   - Add React.memo for expensive components
   - Use useCallback for event handlers
   - Code splitting for admin panel

5. **Security**
   - Input sanitization
   - CSRF protection
   - SQL injection prevention (already using prepared statements)
