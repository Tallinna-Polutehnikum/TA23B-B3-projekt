import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// simple request logger to help debug connectivity
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

let db;
try {
  const dbPath = path.resolve(__dirname, '..', '..', 'database', 'db.sqlite');
  console.log('Opening database at:', dbPath);
  db = new Database(dbPath);
  console.log('✓ Database opened successfully');
} catch (err) {
  console.error('✗ Failed to open database:', err.message);
  process.exit(1);
}

// ============= GET ENDPOINTS =============

app.get('/api/movies/top', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, title, overview, poster
    FROM movie
    ORDER BY updated_at DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

// All movies (full catalog)
app.get('/api/movies', (_req, res) => {
  const rows = db.prepare(`
    SELECT 
      m.id,
      m.title,
      m.overview,
      m.poster,
      m.duration,
      m.directors,
      COALESCE(g.type, '—') AS genre
    FROM movie m
    LEFT JOIN genres g ON m.genre_id = g.id
    ORDER BY m.updated_at DESC
  `).all();
  res.json(rows);
});

app.get('/api/movies/coming-soon', (_req, res) => {
  const rows = db.prepare(`
    SELECT 
      c.id,
      c.title,
      c.overview,
      c.poster,
      COALESCE(g.type, '—') AS genre
    FROM comingsoon_movies c
    LEFT JOIN genres g ON g.id = c.genre_id
    ORDER BY c.id ASC
    LIMIT 10
  `).all();
  res.json(rows);
});

app.get('/api/movies/:id', (req, res) => {
  const row = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.overview,
      m.poster,
      m.duration,
      COALESCE(g.type, '—') AS genre,
      m.directors AS director
    FROM movie m
    LEFT JOIN genres g ON g.id = m.genre_id
    WHERE m.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
});

// Fetch a single movie by genre type (returns latest movie for the genre)
app.get('/api/movies/by-genre', (req, res) => {
  const type = req.query.type;
  if (!type) return res.status(400).json({ message: 'Missing genre type' });

  const row = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.overview,
      m.poster,
      m.duration,
      COALESCE(g.type, '—') AS genre,
      m.directors AS director
    FROM movie m
    LEFT JOIN genres g ON g.id = m.genre_id
    WHERE g.type = ?
    ORDER BY m.updated_at DESC
    LIMIT 1
  `).get(type);

  if (!row) return res.status(404).json({ message: 'No movie found for this genre' });
  res.json(row);
});

// legacy route kept for backward compatibility (may be shadowed by /api/movies/:id if placed after it)
app.get('/api/movies/genre', (req, res) => {
  // forward to by-genre handler logic
  const type = req.query.type;
  if (!type) return res.status(400).json({ message: 'Missing genre type' });
  const row = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.overview,
      m.poster,
      m.duration,
      COALESCE(g.type, '—') AS genre,
      m.directors AS director
    FROM movie m
    LEFT JOIN genres g ON g.id = m.genre_id
    WHERE g.type = ?
    ORDER BY m.updated_at DESC
    LIMIT 1
  `).get(type);
  if (!row) return res.status(404).json({ message: 'No movie found for this genre' });
  res.json(row);
});

// Return all genres
app.get('/api/genres', (_req, res) => {
  const rows = db.prepare(`SELECT id, type FROM genres ORDER BY id`).all();
  res.json(rows);
});

// Return all cinemas
app.get('/api/cinemas', (_req, res) => {
  const rows = db.prepare(`SELECT id, name FROM cinema ORDER BY name`).all();
  res.json(rows);
});

// Get latest movie for a given genre (by genre type)
app.get('/api/genres/:type/movie', (req, res) => {
  const type = req.params.type;
  if (!type) return res.status(400).json({ message: 'Missing genre type' });
  const row = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.overview,
      m.poster,
      m.duration,
      COALESCE(g.type, '—') AS genre,
      m.directors AS director
    FROM movie m
    LEFT JOIN genres g ON g.id = m.genre_id
    WHERE g.type = ?
    ORDER BY m.updated_at DESC
    LIMIT 1
  `).get(type);
  if (!row) return res.status(404).json({ message: 'No movie found for this genre' });
  res.json(row);
});

// Return multiple movies for a given genre (latest first)
app.get('/api/genres/:type/movies', (req, res) => {
  const type = req.params.type;
  if (!type) return res.status(400).json({ message: 'Missing genre type' });
  const rows = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.overview,
      m.poster,
      COALESCE(g.type, '—') AS genre
    FROM movie m
    LEFT JOIN genres g ON g.id = m.genre_id
    WHERE g.type = ?
    ORDER BY m.updated_at DESC
    LIMIT 12
  `).all(type);
  if (!rows || rows.length === 0) return res.status(404).json({ message: 'No movies found for this genre' });
  res.json(rows);
});

app.get('/api/gifts', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, name, type, price, description
    FROM Gifts
    ORDER BY price
  `).all();
  res.json(rows);
});

app.get('/api/sessions', (_req, res) => {
  const rows = db.prepare(`
    SELECT 
      s.id,
      m.id as movie_id,
      m.title,
      m.poster,
      COALESCE(c.name, s.cinema_name, 'Cinema') as cinema,
      c.id as cinema_id,
      s.hall,
      s.time,
      s.date,
      s.seats_available as seats,
      s.language,
      s.subtitles,
      s.format,
      COALESCE(g.type, '—') AS genres
    FROM sessions s
    LEFT JOIN movie m ON s.movie_id = m.id
    LEFT JOIN cinema c ON s.cinema_id = c.id
    LEFT JOIN genres g ON m.genre_id = g.id
    ORDER BY s.date, s.time
  `).all();
  res.json(rows);
});

app.get('/api/sessions/:id/seats', (req, res) => {
  const sessionInfo = db.prepare(`
    SELECT 
      s.id,
      m.title,
      COALESCE(c.name, s.cinema_name, 'Cinema') as cinema,
      c.id as cinema_id,
      s.time,
      s.seats_available as seatsAvailable
    FROM sessions s
    LEFT JOIN movie m ON s.movie_id = m.id
    LEFT JOIN cinema c ON s.cinema_id = c.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!sessionInfo) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const totalSeats = Number(sessionInfo.seatsAvailable) || 150;
  const columns = 15;
  const rows = Math.max(1, Math.ceil(totalSeats / columns));
  const seats = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const seatNumber = row * columns + col + 1;
      if (seatNumber > totalSeats) break;
      seats.push({
        id: `seat-${row}-${col}`,
        row: String.fromCharCode(65 + row),
        number: col + 1,
        occupied: false,
        seatNumber
      });
    }
  }

  res.json({
    sessionInfo,
    seats
  });
});

// ============= POST ENDPOINTS =============

app.post('/api/movies', (req, res) => {
  const { title, originalTitle, overview, poster, duration, genre, directors, releaseDate } = req.body;

  // Validate required fields
  if (!title || !overview || !poster || !duration) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Find or create genre
    let genreId = 1;
    if (genre) {
      const existingGenre = db.prepare(`SELECT id FROM genres WHERE type = ?`).get(genre);
      if (existingGenre) {
        genreId = existingGenre.id;
      } else {
        const result = db.prepare(`INSERT INTO genres (type) VALUES (?)`).run(genre);
        genreId = result.lastInsertRowid;
      }
    }

    // Insert movie
    const result = db.prepare(`
      INSERT INTO movie (title, overview, poster, duration, genre_id, directors, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(title, overview, poster, duration, genreId, directors || null);

    res.status(201).json({
      id: result.lastInsertRowid,
      title,
      overview,
      poster,
      duration,
      genre,
      directors
    });
  } catch (err) {
    console.error('Error creating movie:', err);
    res.status(500).json({ message: 'Failed to create movie' });
  }
});

// Update movie
app.put('/api/movies/:id', (req, res) => {
  const { title, overview, poster, duration, genre, directors } = req.body;
  const movieId = req.params.id;

  const existing = db.prepare(`SELECT id, genre_id FROM movie WHERE id = ?`).get(movieId);
  if (!existing) return res.status(404).json({ message: 'Movie not found' });

  try {
    // Resolve genre
    let genreId = existing.genre_id;
    if (genre) {
      const g = db.prepare(`SELECT id FROM genres WHERE type = ?`).get(genre);
      if (g) {
        genreId = g.id;
      } else {
        const result = db.prepare(`INSERT INTO genres (type) VALUES (?)`).run(genre);
        genreId = result.lastInsertRowid;
      }
    }

    db.prepare(`
      UPDATE movie
      SET
        title = COALESCE(?, title),
        overview = COALESCE(?, overview),
        poster = COALESCE(?, poster),
        duration = COALESCE(?, duration),
        genre_id = COALESCE(?, genre_id),
        directors = COALESCE(?, directors),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(title, overview, poster, duration, genreId, directors, movieId);

    res.json({
      id: Number(movieId),
      title,
      overview,
      poster,
      duration,
      genre,
      directors
    });
  } catch (err) {
    console.error('Error updating movie:', err);
    res.status(500).json({ message: 'Failed to update movie' });
  }
});

// Delete movie
app.delete('/api/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const existing = db.prepare(`SELECT id FROM movie WHERE id = ?`).get(movieId);
  if (!existing) return res.status(404).json({ message: 'Movie not found' });

  try {
    db.prepare(`DELETE FROM movie WHERE id = ?`).run(movieId);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting movie:', err);
    res.status(500).json({ message: 'Failed to delete movie' });
  }
});

app.post('/api/sessions', (req, res) => {
  const { movieId, cinemaId, cinema, date, time, hall, seatsAvailable, language, subtitles, format } = req.body;

  // Validate required fields
  if (!movieId || (!cinemaId && !cinema) || !date || !time || !seatsAvailable) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let cinemaName = cinema;
    let cinemaRowId = cinemaId || null;

    if (cinemaId) {
      const row = db.prepare(`SELECT id, name FROM cinema WHERE id = ?`).get(cinemaId);
      if (!row) return res.status(400).json({ message: 'Invalid cinemaId' });
      cinemaName = row.name;
      cinemaRowId = row.id;
    }

    // Insert session
    const result = db.prepare(`
      INSERT INTO sessions (
        movie_id, 
        cinema_id,
        cinema_name, 
        date, 
        time, 
        hall, 
        seats_available, 
        language, 
        subtitles, 
        format
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movieId,
      cinemaRowId,
      cinemaName,
      date,
      time,
      hall || 1,
      seatsAvailable,
      language || 'Estonian',
      subtitles || 'English',
      format || '2D'
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      movieId,
      cinema: cinemaName,
      cinemaId: cinemaRowId,
      date,
      time,
      hall,
      seatsAvailable,
      language,
      subtitles,
      format
    });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ message: 'Failed to create session' });
  }
});

// Update session
app.put('/api/sessions/:id', (req, res) => {
  const sessionId = req.params.id;
  const { movieId, cinemaId, cinema, date, time, hall, seatsAvailable, language, subtitles, format } = req.body;

  const existing = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId);
  if (!existing) return res.status(404).json({ message: 'Session not found' });

  try {
    let cinemaName = cinema ?? existing.cinema_name;
    let cinemaRowId = cinemaId ?? existing.cinema_id ?? null;

    if (cinemaId) {
      const row = db.prepare(`SELECT id, name FROM cinema WHERE id = ?`).get(cinemaId);
      if (!row) return res.status(400).json({ message: 'Invalid cinemaId' });
      cinemaName = row.name;
      cinemaRowId = row.id;
    }

    db.prepare(`
      UPDATE sessions
      SET
        movie_id = COALESCE(?, movie_id),
        cinema_id = ?,
        cinema_name = ?,
        date = COALESCE(?, date),
        time = COALESCE(?, time),
        hall = COALESCE(?, hall),
        seats_available = COALESCE(?, seats_available),
        language = COALESCE(?, language),
        subtitles = COALESCE(?, subtitles),
        format = COALESCE(?, format)
      WHERE id = ?
    `).run(
      movieId,
      cinemaRowId,
      cinemaName,
      date,
      time,
      hall,
      seatsAvailable,
      language,
      subtitles,
      format,
      sessionId
    );

    res.json({
      id: Number(sessionId),
      movieId: movieId ?? existing.movie_id,
      cinema: cinemaName,
      cinemaId: cinemaRowId,
      date: date ?? existing.date,
      time: time ?? existing.time,
      hall: hall ?? existing.hall,
      seatsAvailable: seatsAvailable ?? existing.seats_available,
      language: language ?? existing.language,
      subtitles: subtitles ?? existing.subtitles,
      format: format ?? existing.format
    });
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ message: 'Failed to update session' });
  }
});

// Bulk delete sessions by date range
app.post('/api/sessions/bulk-delete', (req, res) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) return res.status(400).json({ message: 'startDate and endDate are required (YYYY-MM-DD or DD.MM.YYYY)' });

  const normalize = (value) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (trimmed.includes('.')) {
      // DD.MM.YYYY -> YYYY-MM-DD
      const [d, m, y] = trimmed.split('.');
      if (d && m && y) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return trimmed;
  };

  const isoStart = normalize(startDate);
  const isoEnd = normalize(endDate);

  try {
    const deleteSessions = db.prepare(`
      DELETE FROM sessions 
      WHERE datetime(date) >= datetime(?) AND datetime(date) < datetime(?, '+1 day')
    `);
    const deleteShowtime = db.prepare(`
      DELETE FROM showtime 
      WHERE datetime(date) >= datetime(?) AND datetime(date) < datetime(?, '+1 day')
    `);

    const resultSessions = isoStart && isoEnd ? deleteSessions.run(isoStart, isoEnd) : { changes: 0 };
    const resultShowtime = isoStart && isoEnd ? deleteShowtime.run(isoStart, isoEnd) : { changes: 0 };

    res.json({
      deletedSessions: resultSessions.changes || 0,
      deletedShowtime: resultShowtime.changes || 0
    });
  } catch (err) {
    console.error('Error bulk deleting sessions:', err);
    res.status(500).json({ message: 'Failed to delete sessions' });
  }
});

// Delete session
app.delete('/api/sessions/:id', (req, res) => {
  const sessionId = req.params.id;
  const existing = db.prepare(`SELECT id FROM sessions WHERE id = ?`).get(sessionId);
  if (!existing) return res.status(404).json({ message: 'Session not found' });

  try {
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

app.listen(4000, () => console.log('API on http://localhost:4000'));