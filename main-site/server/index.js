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

const seatColumns = db.prepare(`PRAGMA table_info(seat)`).all();
const hasSeatAvailabilityFlag = seatColumns.some((col) => col.name === 'is_available');
const seatAvailabilityWhere = hasSeatAvailabilityFlag ? 'WHERE is_available = 1' : '';

const AUTO_SHOW_TIMES = ['12:00', '15:00', '18:00', '21:00'];
const AUTO_WINDOW_DAYS = 7;

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function toShowtimeDate(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function groupHallsByCinema(halls) {
  const grouped = new Map();

  for (const hall of halls) {
    if (!grouped.has(hall.cinema_id)) {
      grouped.set(hall.cinema_id, []);
    }
    grouped.get(hall.cinema_id).push(hall);
  }

  return [...grouped.entries()]
    .map(([cinemaId, cinemaHalls]) => ({
      cinemaId,
      halls: cinemaHalls.sort((a, b) => a.id - b.id)
    }))
    .sort((a, b) => a.cinemaId - b.cinemaId);
}

function seedUpcomingSessionsForMovie(movieId) {
  const sessionColumns = db.prepare(`PRAGMA table_info(sessions)`).all();
  const hasHallTextColumn = sessionColumns.some((col) => col.name === 'hall');

  const halls = db.prepare(`
    SELECT
      h.id,
      h.cinema_id,
      h.hall_number,
      COALESCE(sc.total_seats, 100) AS default_seats
    FROM hall h
    LEFT JOIN (
      SELECT hall_id, COUNT(*) AS total_seats
      FROM seat
      ${seatAvailabilityWhere}
      GROUP BY hall_id
    ) sc ON sc.hall_id = h.id
    WHERE h.cinema_id IS NOT NULL
    ORDER BY h.cinema_id, h.id
  `).all();

  if (halls.length === 0) {
    return { inserted: 0, skippedPast: 0, reason: 'no-halls' };
  }

  const cinemas = groupHallsByCinema(halls);

  const findSlotSessions = db.prepare(`
    SELECT id, movie_id
    FROM sessions
    WHERE hall_id = ? AND date = ? AND time = ?
    ORDER BY id
  `);

  const ticketCountBySession = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM ticket
    WHERE session_id = ?
  `);

  const deleteSessionById = db.prepare(`DELETE FROM sessions WHERE id = ?`);

  const insertSession = db.prepare(`
    INSERT INTO sessions (
      movie_id,
      cinema_id,
      hall_id,
      date,
      time,
      seats_available,
      language,
      subtitles,
      format
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateSession = db.prepare(`
    UPDATE sessions
    SET movie_id = ?, cinema_id = ?, hall_id = ?
    WHERE id = ?
  `);

  const insertSessionWithHall = hasHallTextColumn
    ? db.prepare(`
        INSERT INTO sessions (
          movie_id,
          cinema_id,
          hall_id,
          hall,
          date,
          time,
          seats_available,
          language,
          subtitles,
          format
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
    : null;

  const updateSessionWithHall = hasHallTextColumn
    ? db.prepare(`
        UPDATE sessions
        SET movie_id = ?, cinema_id = ?, hall_id = ?, hall = ?
        WHERE id = ?
      `)
    : null;

  let inserted = 0;
  let updated = 0;
  let skippedPast = 0;
  let skippedLocked = 0;
  let duplicateRemoved = 0;
  const now = new Date();

  const tx = db.transaction(() => {
    for (let dayOffset = 0; dayOffset < AUTO_WINDOW_DAYS; dayOffset += 1) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + dayOffset);
      const dateStr = formatIsoDate(day);

      for (let cinemaIndex = 0; cinemaIndex < cinemas.length; cinemaIndex += 1) {
        const cinema = cinemas[cinemaIndex];
        const forcedTime = AUTO_SHOW_TIMES[(dayOffset + cinemaIndex) % AUTO_SHOW_TIMES.length];
        const forcedHall = cinema.halls[(dayOffset + cinemaIndex) % cinema.halls.length];

        for (const hall of cinema.halls) {
          for (const showTime of AUTO_SHOW_TIMES) {
            if (hall.id !== forcedHall.id || showTime !== forcedTime) {
              continue;
            }

          const candidateDate = toShowtimeDate(dateStr, showTime);
          if (candidateDate <= now) {
            skippedPast += 1;
            continue;
          }

            const slotSessions = findSlotSessions.all(hall.id, dateStr, showTime);

            if (slotSessions.length === 0) {
              if (hasHallTextColumn && insertSessionWithHall) {
                insertSessionWithHall.run(
                  movieId,
                  hall.cinema_id,
                  hall.id,
                  hall.hall_number,
                  dateStr,
                  showTime,
                  hall.default_seats,
                  'Estonian',
                  'English',
                  '2D'
                );
              } else {
                insertSession.run(
                  movieId,
                  hall.cinema_id,
                  hall.id,
                  dateStr,
                  showTime,
                  hall.default_seats,
                  'Estonian',
                  'English',
                  '2D'
                );
              }
              inserted += 1;
              continue;
            }

            let keeper = slotSessions[0];
            let keeperTickets = ticketCountBySession.get(keeper.id).cnt;

            for (const candidate of slotSessions.slice(1)) {
              const candidateTickets = ticketCountBySession.get(candidate.id).cnt;
              if (candidateTickets > keeperTickets) {
                if (keeperTickets === 0) {
                  deleteSessionById.run(keeper.id);
                  duplicateRemoved += 1;
                }
                keeper = candidate;
                keeperTickets = candidateTickets;
              } else if (candidateTickets === 0) {
                deleteSessionById.run(candidate.id);
                duplicateRemoved += 1;
              }
            }

            if (keeper.movie_id === movieId) {
              continue;
            }

            if (keeperTickets > 0) {
              skippedLocked += 1;
              continue;
            }

            if (hasHallTextColumn && updateSessionWithHall) {
              updateSessionWithHall.run(
                movieId,
                hall.cinema_id,
                hall.id,
                hall.hall_number,
                keeper.id
              );
            } else {
              updateSession.run(movieId, hall.cinema_id, hall.id, keeper.id);
            }
            updated += 1;
          }
        }
      }
    }
  });

  tx();

  return {
    inserted,
    updated,
    skippedPast,
    skippedLocked,
    duplicateRemoved,
    cinemasScanned: cinemas.length,
    daysPlanned: AUTO_WINDOW_DAYS
  };
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

app.get('/api/hall', (req, res) => {
  const cinemaId = req.query.cinemaId;
  let rows;
  if (cinemaId) {
    rows = db.prepare(`
      SELECT h.id, h.hall_number, h.cinema_id, COALESCE(c.name, 'Cinema') AS cinema
      FROM hall h
      LEFT JOIN cinema c ON c.id = h.cinema_id
      WHERE h.cinema_id = ?
      ORDER BY h.hall_number
    `).all(cinemaId);
  } else {
    rows = db.prepare(`
      SELECT h.id, h.hall_number, h.cinema_id, COALESCE(c.name, 'Cinema') AS cinema
      FROM hall h
      LEFT JOIN cinema c ON c.id = h.cinema_id
      ORDER BY c.name, h.hall_number
    `).all();
  }
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
      COALESCE(c.name, 'Cinema') as cinema,
      c.id as cinema_id,
      h.hall_number as hall,
      h.id as hall_id,
      s.time,
      s.date,
      (COALESCE(sc.total_seats, s.seats_available) - COALESCE(res.reserved, 0)) as seats,
      s.language,
      s.subtitles,
      s.format,
      COALESCE(g.type, '—') AS genres
    FROM sessions s
    LEFT JOIN movie m ON s.movie_id = m.id
    LEFT JOIN cinema c ON s.cinema_id = c.id
    LEFT JOIN hall h ON s.hall_id = h.id
    LEFT JOIN (
      SELECT hall_id, COUNT(*) AS total_seats
      FROM seat
      ${seatAvailabilityWhere}
      GROUP BY hall_id
    ) sc ON sc.hall_id = h.id
    LEFT JOIN (
      SELECT session_id, COUNT(*) AS reserved
      FROM ticket
      GROUP BY session_id
    ) res ON res.session_id = s.id
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
      COALESCE(c.name, 'Cinema') as cinema,
      c.id as cinema_id,
      h.hall_number as hall,
      h.id as hall_id,
      s.time,
      COALESCE(sc.total_seats, s.seats_available) as seatsAvailable
    FROM sessions s
    LEFT JOIN movie m ON s.movie_id = m.id
    LEFT JOIN cinema c ON s.cinema_id = c.id
    LEFT JOIN hall h ON s.hall_id = h.id
    LEFT JOIN (
      SELECT hall_id, COUNT(*) AS total_seats
      FROM seat
      ${seatAvailabilityWhere}
      GROUP BY hall_id
    ) sc ON sc.hall_id = h.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!sessionInfo) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const seats = db.prepare(`
    SELECT 
      s.id,
      s.seat_number,
      s.type,
      s.price,
      ${hasSeatAvailabilityFlag ? 's.is_available' : '1 AS is_available'},
      CASE WHEN t.id IS NULL THEN 0 ELSE 1 END AS occupied
    FROM seat s
    LEFT JOIN ticket t ON t.seat_id = s.id AND t.session_id = ?
    WHERE s.hall_id = ?
    ORDER BY s.id
  `).all(req.params.id, sessionInfo.hall_id);

  res.json({
    sessionInfo,
    seats
  });
});

// Book seats for a session
app.post('/api/sessions/:id/book', (req, res) => {
  const sessionId = Number(req.params.id);
  const { seatIds, userId } = req.body || {};

  if (!sessionId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: 'sessionId and seatIds[] are required' });
  }

  const session = db.prepare(`
    SELECT id, hall_id, seats_available
    FROM sessions
    WHERE id = ?
  `).get(sessionId);

  if (!session) return res.status(404).json({ message: 'Session not found' });

  // Validate seats belong to the hall of the session
  const placeholders = seatIds.map(() => '?').join(',');
  const seats = db.prepare(`
    SELECT id
    FROM seat
    WHERE hall_id = ? AND id IN (${placeholders})
  `).all(session.hall_id, ...seatIds);

  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: 'One or more seats do not belong to this hall' });
  }

  const reserved = db.prepare(`
    SELECT seat_id
    FROM ticket
    WHERE session_id = ? AND seat_id IN (${placeholders})
  `).all(sessionId, ...seatIds);

  if (reserved.length > 0) {
    return res.status(409).json({
      message: 'Some seats are already booked',
      seats: reserved.map((r) => r.seat_id)
    });
  }

  try {
    const insertTicket = db.prepare(`
      INSERT INTO ticket (user_id, session_id, seat_id)
      VALUES (?, ?, ?)
    `);

    const runTx = db.transaction(() => {
      seatIds.forEach((seatId) => {
        insertTicket.run(userId ?? null, sessionId, seatId);
      });

      db.prepare(`
        UPDATE sessions
        SET seats_available = seats_available - ?
        WHERE id = ?
      `).run(seatIds.length, sessionId);
    });

    runTx();

    const remaining = db.prepare(`
      SELECT seats_available AS seats
      FROM sessions
      WHERE id = ?
    `).get(sessionId);

    res.status(201).json({
      sessionId,
      seatsBooked: seatIds,
      seatsRemaining: remaining?.seats ?? null
    });
  } catch (err) {
    console.error('Error booking seats:', err);
    res.status(500).json({ message: 'Failed to book seats' });
  }
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

    const movieId = Number(result.lastInsertRowid);
    let autoSchedule;

    try {
      autoSchedule = seedUpcomingSessionsForMovie(movieId);
    } catch (scheduleErr) {
      console.error('Auto schedule failed for new movie:', movieId, scheduleErr);
      autoSchedule = {
        inserted: 0,
        skippedPast: 0,
        error: 'auto-schedule-failed'
      };
    }

    res.status(201).json({
      id: movieId,
      title,
      overview,
      poster,
      duration,
      genre,
      directors,
      autoSchedule
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
  const { movieId, cinemaId, hallId, date, time, seatsAvailable, language, subtitles, format } = req.body;

  if (!movieId || !cinemaId || !hallId || !date || !time || !seatsAvailable) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const cinemaRow = db.prepare(`SELECT id, name FROM cinema WHERE id = ?`).get(cinemaId);
    if (!cinemaRow) {
      return res.status(400).json({ message: 'Invalid cinemaId' });
    }

    const hallRow = db.prepare(`SELECT id, hall_number, cinema_id FROM hall WHERE id = ?`).get(hallId);
    if (!hallRow) {
      return res.status(400).json({ message: 'Invalid hallId' });
    }

    if (hallRow.cinema_id !== cinemaRow.id) {
      return res.status(400).json({ message: 'hallId does not belong to the selected cinema' });
    }

    const result = db.prepare(`
      INSERT INTO sessions (
        movie_id, 
        cinema_id,
        hall_id,
        hall,
        date, 
        time, 
        seats_available, 
        language, 
        subtitles, 
        format
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movieId,
      cinemaRow.id,
      hallRow.id,
      hallRow.hall_number,
      date,
      time,
      seatsAvailable,
      language || 'Estonian',
      subtitles || 'English',
      format || '2D'
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      movieId,
      cinema: cinemaRow.name,
      cinemaId: cinemaRow.id,
      hall: hallRow.hall_number,
      hallId: hallRow.id,
      date,
      time,
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
  const { movieId, cinemaId, hallId, date, time, seatsAvailable, language, subtitles, format } = req.body;

  const existing = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId);
  if (!existing) return res.status(404).json({ message: 'Session not found' });

  try {
    let resolvedCinemaId = existing.cinema_id;
    if (cinemaId !== undefined) {
      const cinemaRow = db.prepare(`SELECT id FROM cinema WHERE id = ?`).get(cinemaId);
      if (!cinemaRow) return res.status(400).json({ message: 'Invalid cinemaId' });
      resolvedCinemaId = cinemaRow.id;
    }

    let resolvedHallId = existing.hall_id;
    let resolvedHallNumber = null;

    if (hallId !== undefined) {
      const hallRow = db.prepare(`SELECT id, hall_number, cinema_id FROM hall WHERE id = ?`).get(hallId);
      if (!hallRow) return res.status(400).json({ message: 'Invalid hallId' });
      if (hallRow.cinema_id !== resolvedCinemaId) {
        if (cinemaId === undefined && (resolvedCinemaId === null || resolvedCinemaId === undefined)) {
          resolvedCinemaId = hallRow.cinema_id;
        } else {
          return res.status(400).json({ message: 'hallId does not belong to the selected cinema' });
        }
      }
      resolvedHallId = hallRow.id;
      resolvedHallNumber = hallRow.hall_number;
    } else if (cinemaId !== undefined && resolvedHallId) {
      const hallRow = db.prepare(`SELECT id, hall_number, cinema_id FROM hall WHERE id = ?`).get(resolvedHallId);
      if (hallRow && hallRow.cinema_id !== resolvedCinemaId) {
        return res.status(400).json({ message: 'Current hall does not belong to the new cinema. Please choose a hall.' });
      }
      if (hallRow) {
        resolvedHallNumber = hallRow.hall_number;
      }
    }

    db.prepare(`
      UPDATE sessions
      SET
        movie_id = COALESCE(?, movie_id),
        cinema_id = ?,
        hall_id = ?,
        date = COALESCE(?, date),
        time = COALESCE(?, time),
        seats_available = COALESCE(?, seats_available),
        language = COALESCE(?, language),
        subtitles = COALESCE(?, subtitles),
        format = COALESCE(?, format)
      WHERE id = ?
    `).run(
      movieId,
      resolvedCinemaId,
      resolvedHallId,
      date,
      time,
      seatsAvailable,
      language,
      subtitles,
      format,
      sessionId
    );

    const updated = db.prepare(`
      SELECT 
        s.id,
        s.movie_id,
        s.cinema_id,
        s.hall_id,
        h.hall_number AS hall_number,
        s.date,
        s.time,
        s.seats_available,
        s.language,
        s.subtitles,
        s.format,
        COALESCE(c.name, 'Cinema') AS cinema_label
      FROM sessions s
      LEFT JOIN cinema c ON s.cinema_id = c.id
      LEFT JOIN hall h ON s.hall_id = h.id
      WHERE s.id = ?
    `).get(sessionId);

    res.json({
      id: updated.id,
      movieId: updated.movie_id,
      cinema: updated.cinema_label,
      cinemaId: updated.cinema_id,
      hallId: updated.hall_id,
      hall: updated.hall_number,
      date: updated.date,
      time: updated.time,
      seatsAvailable: updated.seats_available,
      language: updated.language,
      subtitles: updated.subtitles,
      format: updated.format
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