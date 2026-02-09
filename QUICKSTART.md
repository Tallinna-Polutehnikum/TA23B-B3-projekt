# Quick Start for New Features

## For Main Page (Main Site)

### 1. Filtering and Seats

New components are already integrated! Just start the main-site:

```bash
cd main-site
npm install
npm run dev
```

Features available on page `/showtime`:
- **Filtering by city** - city dropdow
n list
- **Filtering by genre** - genre dropdown list
- **Seat selection** - "Buy Tickets" button on each session

### 2. API for seats

Endpoint already added to server:

```bash
# Make sure backend is started
cd main-site
npm run dev  # or node server/index.js
```

API available at:
- `http://localhost:4000/api/sessions`
- `http://localhost:4000/api/sessions/{id}/seats`

---

## For Admin Panel (Admin Worker Site)

### 1. Start admin panel

```bash
cd admin-worker-site
npm install
npm run dev
```

### 2. Available pages

- **Dashboard** (`/`) - main screen with statistics
- **Movies** (`/movies`) - movie management
- **Sessions** (`/sessions`) - session management
- **Add Movie** (`/add-movie`) - add movie form
- **Add Session** (`/add-session`) - add session form

### 3. Used API endpoints

Admin panel sends requests to:
- `GET /api/movies/top` - get movie list
- `GET /api/sessions` - get session list
- `POST /api/movies` - add new movie
- `POST /api/sessions` - add new session

---

## Backend API updated

### Start server

```bash
cd main-site
npm install
node server/index.js
# or with error handling:
npm run dev
```

### New POST endpoints:

#### Add Movie
```bash
curl -X POST http://localhost:4000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Matrix",
    "overview": "A hacker discovers the truth about reality",
    "poster": "https://example.com/matrix.jpg",
    "duration": 136,
    "genre": "Sci-Fi",
    "directors": "Lana Wachowski, Lilly Wachowski",
    "releaseDate": "1999-03-31",
    "rating": 8.7
  }'
```

#### Add Session
```bash
curl -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": 1,
    "cinema": "Tallinn - Kino",
    "date": "2024-02-10",
    "time": "18:30",
    "hall": "1",
    "seatsAvailable": 100,
    "language": "Estonian",
    "subtitles": "English",
    "format": "2D"
  }'
```

---

## Integration Check

### 1. Check filters on main-site
```
1. Open http://localhost:5173/showtime (or your port)
2. Should display:
   - City dropdown list
   - Genre dropdown list
   - Days of week (as before)
3. Click any "Buy Tickets" - seat map should open
```

### 2. Check admin panel
```
1. Open http://localhost:5174 (or your port)
2. You should see:
   - Sidebar navigation with menu items
   - Overview with statistics
   - Buttons to add movie/session
```

### 3. Check API
```bash
# Get sessions
curl http://localhost:4000/api/sessions | jq

# Get seats for session ID 1
curl http://localhost:4000/api/sessions/1/seats | jq
```

---

## Troubleshooting

### Admin panel doesn't start
```bash
# Check dependencies
cd admin-worker-site
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API returns 404
```
- Make sure main-site backend server is running on port 4000
- Check database db.sqlite exists in database/ folder
```

### Seats don't load in SeatMap
```
- Check browser console (F12) for errors
- API endpoint should be available at http://localhost:4000/api/sessions/{id}/seats
```

### Tables in admin panel are empty
```
- Make sure DB contains records
- Check server console for requests
- Try adding first movie/session manually
```

---

## Folder Structure

```
project/
├── main-site/
│   ├── src/
│   │   └── components/
│   │       ├── Showtimes.jsx ✅ (updated with filters)
│   │       ├── SeatMap.jsx ✅ (new)
│   │       ├── SeatMap.css ✅ (new)
│   │       └── SessionCard.jsx ✅ (updated)
│   ├── server/
│   │   └── index.js ✅ (added POST endpoints)
│   └── package.json
│
├── admin-worker-site/
│   ├── src/
│   │   ├── App.jsx ✅ (updated)
│   │   ├── App.css ✅ (updated)
│   │   └── components/
│   │       ├── AdminDashboard.jsx ✅ (new)
│   │       ├── AdminDashboard.css ✅ (new)
│   │       ├── AddMovieForm.jsx ✅ (new)
│   │       ├── AddMovieForm.css ✅ (new)
│   │       ├── AddSessionForm.jsx ✅ (new)
│   │       ├── AddSessionForm.css ✅ (new)
│   │       ├── MoviesList.jsx ✅ (new)
│   │       ├── MoviesList.css ✅ (new)
│   │       ├── SessionsList.jsx ✅ (new)
│   │       └── SessionsList.css ✅ (new)
│   └── package.json
│
├── database/
│   └── db.sqlite
│
└── NEW_FEATURES.md ✅ (documentation)
```

---

## Checklist

- ✅ Filtering on main page (city, date, genre)
- ✅ SeatMap component for seat selection
- ✅ Admin Dashboard with menu
- ✅ Add movie form
- ✅ Add session form
- ✅ Movie list in admin panel
- ✅ Session list in admin panel
- ✅ API endpoints for adding data
- ✅ API endpoint for getting seats
- ✅ Responsive design (mobile-friendly)
- ✅ Documentation

---

## Additional Information

All components use modern React (hooks):
- `useState` for state management
- `useEffect` for data loading
- Async/await for API requests

All styles use CSS Grid/Flexbox and are responsive for all screen sizes.
