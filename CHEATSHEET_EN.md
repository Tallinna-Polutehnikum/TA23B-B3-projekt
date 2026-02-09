# 🚀 Cheat Sheet - Quick Start

## In 5 Minutes

### 1️⃣ Start Backend
```bash
cd main-site
npm install
node server/index.js
# Port: http://localhost:4000
```

### 2️⃣ Start Main Site
```bash
cd main-site
npm install  # (if not already done)
npm run dev
# Port: http://localhost:5173 (typically)
# Open: http://localhost:5173/showtime
```

### 3️⃣ Start Admin Panel
```bash
cd admin-worker-site
npm install
npm run dev
# Port: http://localhost:5174 (typically)
```

---

## Files That Changed ✏️

### Main Site
```
main-site/
├── src/components/
│   ├── Showtimes.jsx ✅ (updated)
│   ├── SessionCard.jsx ✅ (updated)
│   ├── SeatMap.jsx ✅ (NEW)
│   └── SeatMap.css ✅ (NEW)
└── server/
    └── index.js ✅ (updated)
```

### Admin Site
```
admin-worker-site/src/
├── App.jsx ✅ (updated)
├── App.css ✅ (updated)
└── components/
    ├── AdminDashboard.jsx ✅ (NEW)
    ├── AdminDashboard.css ✅ (NEW)
    ├── AddMovieForm.jsx ✅ (NEW)
    ├── AddMovieForm.css ✅ (NEW)
    ├── AddSessionForm.jsx ✅ (NEW)
    ├── AddSessionForm.css ✅ (NEW)
    ├── MoviesList.jsx ✅ (NEW)
    ├── MoviesList.css ✅ (NEW)
    ├── SessionsList.jsx ✅ (NEW)
    └── SessionsList.css ✅ (NEW)
```

---

## New Features 🎉

### On Main Site
- 🔍 **City Filter** - dropdown list
- 🎬 **Genre Filter** - dropdown list
- 🎫 **Seat Selection** - 10×15 grid, shows availability
- 💰 **Price Calculation** - €12 per seat

### On Admin Site
- 📊 **Dashboard** - statistics
- 🎬 **Movie Management** - list, add new
- 🎫 **Session Management** - list, add new
- 📝 **Forms** - validation, error handling

---

## Quick Links

| What | Link |
|------|------|
| Main Site Showtime | http://localhost:5173/showtime |
| Admin Panel | http://localhost:5174 |
| Backend API | http://localhost:4000 |
| API Sessions | http://localhost:4000/api/sessions |
| API Seats | http://localhost:4000/api/sessions/1/seats |

---

## Key Components

### Showtimes (filtering)
```jsx
<Showtimes />
// Shows sessions with filters
// Uses: city, date, genre
```

### SeatMap (seat selection)
```jsx
<SeatMap sessionId={1} onClose={() => {}} />
// Modal window with seat grid
// Shows: availability, price, selected seats
```

### AdminDashboard (admin panel)
```jsx
<AdminDashboard />
// Main admin panel
// Contains: navigation, forms, lists
```

---

## API Endpoints

### Get Data
```bash
# All sessions
GET http://localhost:4000/api/sessions

# Seats for a session
GET http://localhost:4000/api/sessions/1/seats

# Top movies
GET http://localhost:4000/api/movies/top
```

### Add Data
```bash
# Add movie
POST http://localhost:4000/api/movies
Content-Type: application/json
{
  "title": "Movie Name",
  "overview": "Description",
  "poster": "https://...",
  "duration": 120,
  "genre": "Action",
  "directors": "Director Name",
  "releaseDate": "2024-02-10",
  "rating": 8.5
}

# Add session
POST http://localhost:4000/api/sessions
Content-Type: application/json
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

## Colors

| Name | Code | Usage |
|------|------|-------|
| Primary Green | #00d084 | Buttons, active elements |
| Dark | #0f0f0f | Background |
| Dark Secondary | #1a1a1a | Cards, containers |
| Dark Tertiary | #2a2a2a | Secondary background |
| Border | #333 | Borders |
| Text | #fff | Main text |
| Text Secondary | #ddd | Secondary text |
| Text Tertiary | #aaa | Tertiary text |
| Error | #ff4444 | Errors |
| Warning | #ff8800 | Warnings |

---

## Keyboard Shortcuts / Tips

### Development
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run with hot reload
npm run dev

# Check code errors
npm run lint  # (if configured)
```

### Browser
```
F12         - Open DevTools
Ctrl+Shift+J - Console
Ctrl+Shift+K - Network
Ctrl+Shift+I - Element Inspector
```

### Database
```bash
# View tables
sqlite3 database/db.sqlite ".tables"

# Export data
sqlite3 database/db.sqlite ".dump" > backup.sql

# Import data
sqlite3 database/db.sqlite < backup.sql
```

---

## Common Problems and Solutions

| Problem | Solution |
|---------|----------|
| `Module not found` | Run `npm install` |
| `Port 4000 already in use` | Change port in `server/index.js` |
| `Cannot GET /showtime` | Ensure React Router is correct |
| `API is 404` | Check if backend server is running |
| `Tables are empty` | Check DB, data may be needed |
| `Styles not applying` | Clear browser cache (Ctrl+Shift+Del) |

---

## Extending Functionality

### I want to add Edit (editing)
1. Add `PUT /api/movies/:id` to backend
2. Add form in component
3. Change onClick handler in table
4. Test

### I want to add Delete (deletion)
1. Add `DELETE /api/movies/:id` to backend
2. Add confirm dialog before deletion
3. Update table after deletion
4. Test

### I want to add Search (search)
1. Add input field in component
2. Filter list by entered text
3. Show results in real-time

---

## Documentation

📖 **Detailed documents:**
- `NEW_FEATURES.md` - Description of all new features
- `ARCHITECTURE.md` - Architecture and structure
- `IMPLEMENTATION_SUMMARY.md` - Implementation summary
- `TESTING_CHECKLIST.md` - Testing checklist
- `DATABASE_SETUP.sql` - SQL examples

---

## Support and Help

If you have questions:
1. Check the documentation above
2. Check browser console (F12)
3. Check server messages
4. Use the testing checklist

---

## Note

All components are ready to use. Edit and Delete features have ready-to-use UI, but logic is deferred for future versions.

If you need to quickly add this functionality, copy the structure of POST requests and create PUT/DELETE versions.

---

**Last Updated:** February 5, 2026
**Version:** 1.0
**Status:** ✅ Ready to Use
