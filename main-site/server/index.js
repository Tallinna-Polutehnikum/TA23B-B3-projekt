import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import PDFDocument from 'pdfkit';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: fs.existsSync(envLocalPath) ? envLocalPath : undefined });
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
  const defaultDbPath = path.resolve(__dirname, '..', '..', 'database', 'db.sqlite');
  const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath;
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
const seatAvailabilitySelect = hasSeatAvailabilityFlag ? 's.is_available' : '1';
const sessionColumns = db.prepare(`PRAGMA table_info(sessions)`).all();
const hasSessionHallColumn = sessionColumns.some((col) => col.name === 'hall');

const AUTO_SHOW_TIMES = ['12:00', '15:00', '18:00', '21:00'];
const AUTO_WINDOW_DAYS = 7;
const AUTH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const PASS_LINK_TTL_MS = 1000 * 60 * 30;
const PASS_TOKEN_SECRET = process.env.TICKET_PASS_SECRET || 'local-dev-ticket-pass-secret';
const authSessions = new Map();
const MOCK_PAYMENT_PROVIDERS = new Set(['montonio']);
const ADMIN_USERS = [
  { username: 'Artur', email: 'artur.genno@techno.ee' },
  { username: 'Elnar', email: 'elnar.kast@techno.ee' },
  { username: 'Sofja', email: 'sofja.portnova@techno.ee' },
];
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const STRIPE_ENABLED = Boolean(stripe);

if (!STRIPE_ENABLED) {
  console.warn('Stripe is not configured. Set STRIPE_SECRET_KEY to enable live PaymentIntents.');
}

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 0) || 0;
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_USERNAME || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
const SMTP_FROM = process.env.SMTP_FROM || 'tickets@absolute-cinema.local';
const SMTP_ENABLED = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

const mailer = SMTP_ENABLED
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

db.exec(`
  CREATE TABLE IF NOT EXISTS payment_tx (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES user(id),
    payment_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL,
    method TEXT,
    metadata TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const paymentTxColumns = db.prepare(`PRAGMA table_info(payment_tx)`).all();
const hasPaymentUserId = paymentTxColumns.some((col) => col.name === 'user_id');
if (!hasPaymentUserId) {
  db.exec(`ALTER TABLE payment_tx ADD COLUMN user_id INTEGER REFERENCES user(id)`);
}

const userColumns = db.prepare(`PRAGMA table_info(user)`).all();
const hasUserAvatarColumn = userColumns.some((col) => col.name === 'avatar_url');
if (!hasUserAvatarColumn) {
  db.exec(`ALTER TABLE user ADD COLUMN avatar_url TEXT`);
}

const hasUserAdminColumn = userColumns.some((col) => col.name === 'is_admin');
if (!hasUserAdminColumn) {
  db.exec(`ALTER TABLE user ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
}

const adminEmailLookup = new Map(
  ADMIN_USERS.map((entry) => [entry.email.toLowerCase(), entry.username])
);

const markAdminByEmail = db.prepare(`
  UPDATE user
  SET is_admin = 1
  WHERE lower(email) = lower(?)
`);

const upsertAdminNameByEmail = db.prepare(`
  UPDATE user
  SET username = ?, is_admin = 1
  WHERE lower(email) = lower(?)
`);

for (const adminUser of ADMIN_USERS) {
  upsertAdminNameByEmail.run(adminUser.username, adminUser.email);
}

function toApiUser(userRow) {
  if (!userRow) return null;

  let avatarUrl = userRow.avatar_url || null;
  if (typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
    const savedPath = saveAvatarDataImage(userRow.id, avatarUrl);
    if (savedPath) {
      db.prepare(`UPDATE user SET avatar_url = ? WHERE id = ?`).run(savedPath, userRow.id);
      avatarUrl = savedPath;
    }
  }

  return {
    id: userRow.id,
    username: userRow.username,
    email: userRow.email,
    avatarUrl,
    isAdmin: Number(userRow.is_admin || 0) === 1,
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(plainPassword, storedPassword) {
  if (!storedPassword) return false;

  if (!storedPassword.startsWith('scrypt$')) {
    return storedPassword === plainPassword;
  }

  const parts = storedPassword.split('$');
  if (parts.length !== 3) return false;

  const [, salt, storedHashHex] = parts;
  const calculatedHashHex = crypto.scryptSync(plainPassword, salt, 64).toString('hex');

  const storedBuffer = Buffer.from(storedHashHex, 'hex');
  const calculatedBuffer = Buffer.from(calculatedHashHex, 'hex');
  if (storedBuffer.length !== calculatedBuffer.length) return false;

  return crypto.timingSafeEqual(storedBuffer, calculatedBuffer);
}

function createAuthToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  authSessions.set(token, {
    userId,
    expiresAt: Date.now() + AUTH_TOKEN_TTL_MS,
  });
  return token;
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const fallbackToken = req.headers['x-auth-token'];
  return typeof fallbackToken === 'string' ? fallbackToken : '';
}

function getAuthUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const session = authSessions.get(token);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    authSessions.delete(token);
    return null;
  }

  const user = db
    .prepare(`SELECT id, username, email, avatar_url, is_admin FROM user WHERE id = ?`)
    .get(session.userId);

  if (!user) {
    authSessions.delete(token);
    return null;
  }

  return { token, user: toApiUser(user) };
}

function signPassToken(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', PASS_TOKEN_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

function saveAvatarDataImage(userId, dataImage) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataImage || '');
  if (!match) return null;

  const [, mimeType, base64Payload] = match;
  const extensionByMime = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  const ext = extensionByMime[mimeType.toLowerCase()];
  if (!ext) return null;

  const buffer = Buffer.from(base64Payload.replace(/\s+/g, ''), 'base64');
  if (!buffer.length) return null;

  const fileName = `user-${userId}-${Date.now()}.${ext}`;
  const filePath = path.join(avatarsDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/avatars/${fileName}`;
}

function verifyPassToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', PASS_TOKEN_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload?.userId || !payload?.exp) {
      return null;
    }
    if (Number(payload.exp) < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getNormalizedTicketsForUser(userId) {
  const sessionColumns = db.prepare(`PRAGMA table_info(sessions)`).all();
  const hasSessionHallTextColumn = sessionColumns.some((col) => col.name === 'hall');
  const hallNumberExpr = hasSessionHallTextColumn
    ? `COALESCE(CAST(h.hall_number AS TEXT), s.hall, 'N/A')`
    : `COALESCE(CAST(h.hall_number AS TEXT), 'N/A')`;

  const tickets = db.prepare(`
    SELECT
      t.id AS ticket_id,
      t.session_id,
      t.seat_id,
      s.date,
      s.time,
      datetime(s.date || ' ' || s.time) AS starts_at,
      m.title AS movie_title,
      m.poster AS movie_poster,
      COALESCE(c.name, 'Cinema') AS cinema_name,
      ${hallNumberExpr} AS hall_number,
      st.seat_number,
      COALESCE(st.price, 12) AS ticket_price
    FROM ticket t
    JOIN sessions s ON s.id = t.session_id
    JOIN movie m ON m.id = s.movie_id
    LEFT JOIN cinema c ON c.id = s.cinema_id
    LEFT JOIN hall h ON h.id = s.hall_id
    LEFT JOIN seat st ON st.id = t.seat_id
    WHERE t.user_id = ?
    ORDER BY s.date ASC, s.time ASC, t.id ASC
  `).all(userId);

  const now = new Date();
  return tickets.map((ticket) => {
    const startsAt = new Date(`${ticket.date}T${ticket.time}:00`);
    const hasValidStart = Number.isFinite(startsAt.getTime());
    const isActive = hasValidStart && startsAt >= now;
    return {
      id: ticket.ticket_id,
      sessionId: ticket.session_id,
      seatId: ticket.seat_id,
      date: ticket.date,
      time: ticket.time,
      startsAt: hasValidStart ? startsAt.toISOString() : null,
      isActive,
      movieTitle: ticket.movie_title,
      moviePoster: ticket.movie_poster,
      cinemaName: ticket.cinema_name,
      hallNumber: ticket.hall_number,
      seatNumber: ticket.seat_number,
      price: Number(ticket.ticket_price) || 0,
    };
  });
}

function createMockPaymentId(provider) {
  return `pay_${provider}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

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

async function sendTicketEmail({ to, name, session, seats }) {
  if (!SMTP_ENABLED || !mailer) {
    console.warn('SMTP is not configured; skipping ticket email');
    return { sent: false, reason: 'smtp-not-configured' };
  }

  if (!to || !String(to).includes('@')) {
    return { sent: false, reason: 'invalid-recipient' };
  }

  const subject = `Your tickets for ${session.movieTitle} on ${session.date} ${session.time}`;

  const lines = [
    name ? `Hi ${name},` : 'Hi,',
    '',
    'Here are your cinema tickets:',
    `Movie: ${session.movieTitle}`,
    `Date & Time: ${session.date} ${session.time}`,
    `Cinema: ${session.cinemaName}`,
    `Hall: ${session.hallNumber}`,
    `Seats: ${seats.join(', ')}`,
    '',
    'Show this email at the entrance. Enjoy your movie!',
    'Absolute Cinema'
  ];

  await mailer.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text: lines.join('\n'),
  });

  return { sent: true };
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
      ${seatAvailabilitySelect} AS is_available,
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

// Book seats for a session and optionally send tickets via email
app.post('/api/sessions/:id/book', async (req, res) => {
app.get('/api/admin/stats', (_req, res) => {
  try {
    const activeTickets = db.prepare(`
      SELECT COUNT(*) AS count
      FROM ticket t
      INNER JOIN sessions s ON s.id = t.session_id
      WHERE datetime(s.date || ' ' || s.time) >= datetime('now')
    `).get();

    const activeSessions = db.prepare(`
      SELECT COUNT(*) AS count
      FROM sessions
      WHERE datetime(date || ' ' || time) >= datetime('now')
    `).get();

    res.json({
      activeTickets: Number(activeTickets?.count || 0),
      activeSessions: Number(activeSessions?.count || 0)
    });
  } catch (err) {
    console.error('Error loading admin stats:', err);
    res.status(500).json({ message: 'Failed to load admin stats' });
  }
});

// Book seats for a session
app.post('/api/sessions/:id/book', (req, res) => {
  const sessionId = Number(req.params.id);
  const { seatIds, userId, contactEmail, contactName } = req.body || {};
  const auth = getAuthUser(req);
  const effectiveUserId = userId ?? auth?.user?.id ?? null;

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
        insertTicket.run(effectiveUserId, sessionId, seatId);
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

    // Gather session and seat details for email receipt
    const sessionDetails = db.prepare(`
      SELECT
        s.date,
        s.time,
        m.title AS movie_title,
        COALESCE(c.name, 'Cinema') AS cinema_name,
        COALESCE(h.hall_number, s.hall, 'N/A') AS hall_number
      FROM sessions s
      LEFT JOIN movie m ON m.id = s.movie_id
      LEFT JOIN cinema c ON c.id = s.cinema_id
      LEFT JOIN hall h ON h.id = s.hall_id
      WHERE s.id = ?
      LIMIT 1
    `).get(sessionId);

    const seatRows = db.prepare(`
      SELECT seat_number
      FROM seat
      WHERE id IN (${placeholders})
    `).all(...seatIds);

    const seatLabels = seatRows.map((row) => row.seat_number).filter(Boolean);

    if (contactEmail && sessionDetails) {
      try {
        await sendTicketEmail({
          to: contactEmail,
          name: contactName,
          session: {
            movieTitle: sessionDetails.movie_title || 'Movie',
            date: sessionDetails.date,
            time: sessionDetails.time,
            cinemaName: sessionDetails.cinema_name,
            hallNumber: sessionDetails.hall_number,
          },
          seats: seatLabels,
        });
      } catch (mailErr) {
        console.error('Failed to send ticket email:', mailErr);
      }
    }

    res.status(201).json({
      sessionId,
      seatsBooked: seatIds,
      seatsRemaining: remaining?.seats ?? null,
      emailed: Boolean(contactEmail && sessionDetails),
    });
  } catch (err) {
    console.error('Error booking seats:', err);
    res.status(500).json({ message: 'Failed to book seats' });
  }
});

// ============= POST ENDPOINTS =============

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email' });
  }

  if (password.length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters' });
  }

  const exists = db
    .prepare(`
      SELECT id
      FROM user
      WHERE lower(username) = lower(?) OR lower(email) = lower(?)
      LIMIT 1
    `)
    .get(username, email);

  if (exists) {
    return res.status(409).json({ message: 'User with this username or email already exists' });
  }

  try {
    const hashedPassword = hashPassword(password);
    const shouldBeAdmin = adminEmailLookup.has(email);
    const inserted = db
      .prepare(`INSERT INTO user (username, email, pass, is_admin) VALUES (?, ?, ?, ?)`)
      .run(username, email, hashedPassword, shouldBeAdmin ? 1 : 0);

    if (shouldBeAdmin) {
      upsertAdminNameByEmail.run(adminEmailLookup.get(email), email);
    }

    const userId = Number(inserted.lastInsertRowid);
    const user = db
      .prepare(`SELECT id, username, email, avatar_url, is_admin FROM user WHERE id = ?`)
      .get(userId);

    const token = createAuthToken(userId);
    res.status(201).json({ token, user: toApiUser(user) });
  } catch (err) {
    console.error('Auth register failed:', err);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const identifier = String(req.body?.identifier || req.body?.email || req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!identifier || !password) {
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  const userRow = db
    .prepare(`
      SELECT id, username, email, avatar_url, is_admin, pass
      FROM user
      WHERE lower(username) = lower(?) OR lower(email) = lower(?)
      LIMIT 1
    `)
    .get(identifier, identifier);

  if (!userRow || !verifyPassword(password, userRow.pass)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Upgrade legacy plain-text passwords to hashed format on successful login.
  if (userRow.pass && !String(userRow.pass).startsWith('scrypt$')) {
    const upgraded = hashPassword(password);
    db.prepare(`UPDATE user SET pass = ? WHERE id = ?`).run(upgraded, userRow.id);
  }

  const matchedAdminName = adminEmailLookup.get(String(userRow.email || '').toLowerCase());
  if (matchedAdminName && Number(userRow.is_admin || 0) !== 1) {
    upsertAdminNameByEmail.run(matchedAdminName, userRow.email);
    userRow.is_admin = 1;
    userRow.username = matchedAdminName;
  }

  const token = createAuthToken(userRow.id);
  res.json({
    token,
    user: toApiUser(userRow),
  });
});

app.get('/api/auth/me', (req, res) => {
  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({ user: auth.user });
});

app.put('/api/profile/account', (req, res) => {
  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const username = String(req.body?.username || '').trim();
  const avatarUrlRaw = req.body?.avatarUrl;
  const avatarUrl = avatarUrlRaw == null ? '' : String(avatarUrlRaw).trim();

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters' });
  }

  const isDataImage = avatarUrl.startsWith('data:image/');
  const isHttpImage = /^https?:\/\//i.test(avatarUrl);
  const isRelativeUploadPath = avatarUrl.startsWith('/uploads/');
  if (avatarUrl && !isDataImage && !isHttpImage && !isRelativeUploadPath) {
    return res.status(400).json({ message: 'Avatar must be an image URL or uploaded image' });
  }

  if (avatarUrl.length > 1024 * 1024) {
    return res.status(400).json({ message: 'Avatar image is too large' });
  }

  const duplicate = db
    .prepare(`
      SELECT id
      FROM user
      WHERE lower(username) = lower(?) AND id != ?
      LIMIT 1
    `)
    .get(username, auth.user.id);

  if (duplicate) {
    return res.status(409).json({ message: 'Username is already taken' });
  }

  let avatarValue = avatarUrl || null;
  if (isDataImage) {
    const savedPath = saveAvatarDataImage(auth.user.id, avatarUrl);
    if (!savedPath) {
      return res.status(400).json({ message: 'Could not process uploaded image' });
    }
    avatarValue = savedPath;
  }

  db.prepare(`
    UPDATE user
    SET username = ?, avatar_url = ?
    WHERE id = ?
  `).run(username, avatarValue, auth.user.id);

  const updatedUser = db
    .prepare(`SELECT id, username, email, avatar_url, is_admin FROM user WHERE id = ?`)
    .get(auth.user.id);

  res.json({ user: toApiUser(updatedUser) });
});

app.get('/api/profile/overview', (req, res) => {
  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const normalizedTickets = getNormalizedTicketsForUser(auth.user.id);

  const transactions = db.prepare(`
    SELECT
      payment_id,
      provider,
      amount_cents,
      currency,
      status,
      method,
      created_at,
      updated_at
    FROM payment_tx
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(auth.user.id).map((row) => ({
    paymentId: row.payment_id,
    provider: row.provider,
    amount: row.amount_cents / 100,
    currency: row.currency,
    status: row.status,
    method: row.method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json({
    tickets: normalizedTickets,
    transactions,
  });
});

app.get('/api/profile/pass-link', (req, res) => {
  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const activeTickets = getNormalizedTicketsForUser(auth.user.id).filter((ticket) => ticket.isActive);
  if (activeTickets.length === 0) {
    return res.status(400).json({ message: 'No active tickets' });
  }

  const exp = Date.now() + PASS_LINK_TTL_MS;
  const token = signPassToken({
    userId: auth.user.id,
    exp,
  });

  const passPath = `/api/profile/tickets-pass.pdf?token=${encodeURIComponent(token)}`;
  const passUrl = `${req.protocol}://${req.get('host')}${passPath}`;

  res.json({
    passUrl,
    expiresAt: new Date(exp).toISOString(),
    activeTickets: activeTickets.length,
  });
});

app.get('/api/profile/tickets-pass.pdf', (req, res) => {
  const token = String(req.query?.token || '');
  const payload = verifyPassToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired pass link' });
  }

  const user = db
    .prepare(`SELECT id, username, email, avatar_url, is_admin FROM user WHERE id = ?`)
    .get(payload.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const activeTickets = getNormalizedTicketsForUser(user.id).filter((ticket) => ticket.isActive);
  if (activeTickets.length === 0) {
    return res.status(404).json({ message: 'No active tickets found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="active-tickets.pdf"');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(22).text('Absolute Cinema - Active Tickets', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Account: ${user.username} (${user.email})`);
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  activeTickets.forEach((ticket, index) => {
    doc
      .fontSize(14)
      .text(`${index + 1}. ${ticket.movieTitle}`);
    doc
      .fontSize(11)
      .text(`Ticket ID: #${ticket.id}`)
      .text(`Date & Time: ${ticket.date} ${ticket.time}`)
      .text(`Cinema: ${ticket.cinemaName}`)
      .text(`Hall: ${ticket.hallNumber}`)
      .text(`Seat: ${ticket.seatNumber}`)
      .text(`Price: EUR ${ticket.price.toFixed(2)}`);
    doc.moveDown(0.8);

    if (index < activeTickets.length - 1) {
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(0.8);
    }
  });

  doc.end();
});

app.post('/api/auth/logout', (req, res) => {
  const token = getTokenFromRequest(req);
  if (token) authSessions.delete(token);
  res.status(204).end();
});

app.post('/api/payments/stripe/create-intent', async (req, res) => {
  if (!STRIPE_ENABLED) {
    return res.status(503).json({ message: 'Stripe is not configured on the server' });
  }

  const auth = getAuthUser(req);
  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || 'EUR').trim().toLowerCase() || 'eur';
  const cartItems = Number(req.body?.cartItems);
  const seats = Number(req.body?.seats);

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  const amountCents = Math.round(amount * 100);
  const metadata = {
    project: 'absolute-cinema',
    seats: Number.isFinite(seats) ? seats : undefined,
    cartItems: Number.isFinite(cartItems) ? cartItems : undefined,
    userId: auth?.user?.id || undefined,
  };

  Object.keys(metadata).forEach((key) => {
    if (metadata[key] == null) delete metadata[key];
  });

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    db.prepare(`
      INSERT INTO payment_tx (user_id, payment_id, provider, amount_cents, currency, status, method, metadata)
      VALUES (?, ?, 'stripe', ?, ?, ?, ?, ?)
      ON CONFLICT(payment_id) DO UPDATE SET
        amount_cents = excluded.amount_cents,
        currency = excluded.currency,
        status = excluded.status,
        method = excluded.method,
        metadata = excluded.metadata,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      auth?.user?.id ?? null,
      intent.id,
      intent.amount,
      (intent.currency || currency).toUpperCase(),
      intent.status,
      Array.isArray(intent.payment_method_types) ? intent.payment_method_types[0] || null : null,
      intent.metadata ? JSON.stringify(intent.metadata) : null
    );

    return res.json({
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount / 100,
      currency: (intent.currency || currency).toUpperCase(),
      status: intent.status,
      provider: 'stripe',
    });
  } catch (err) {
    console.error('Stripe create-intent failed:', err);
    return res.status(err?.statusCode || 500).json({ message: err?.message || 'Failed to create Stripe PaymentIntent' });
  }
});

app.post('/api/payments/stripe/sync', async (req, res) => {
  if (!STRIPE_ENABLED) {
    return res.status(503).json({ message: 'Stripe is not configured on the server' });
  }

  const auth = getAuthUser(req);
  const paymentIntentId = String(req.body?.paymentIntentId || req.body?.id || '').trim();

  if (!paymentIntentId) {
    return res.status(400).json({ message: 'paymentIntentId is required' });
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const method = Array.isArray(intent.payment_method_types) ? intent.payment_method_types[0] || null : null;

    db.prepare(`
      INSERT INTO payment_tx (user_id, payment_id, provider, amount_cents, currency, status, method, metadata)
      VALUES (?, ?, 'stripe', ?, ?, ?, ?, ?)
      ON CONFLICT(payment_id) DO UPDATE SET
        amount_cents = excluded.amount_cents,
        currency = excluded.currency,
        status = excluded.status,
        method = excluded.method,
        metadata = excluded.metadata,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      auth?.user?.id ?? null,
      intent.id,
      intent.amount,
      (intent.currency || 'EUR').toUpperCase(),
      intent.status,
      method,
      intent.metadata ? JSON.stringify(intent.metadata) : null
    );

    return res.json({
      paymentIntentId: intent.id,
      status: intent.status,
      amount: intent.amount / 100,
      currency: (intent.currency || 'EUR').toUpperCase(),
      provider: 'stripe',
      method,
      created: intent.created ? new Date(intent.created * 1000).toISOString() : null,
    });
  } catch (err) {
    console.error('Stripe sync failed:', err);
    return res.status(err?.statusCode || 500).json({ message: err?.message || 'Failed to sync Stripe payment' });
  }
});

app.post('/api/payments/mock-intent', (req, res) => {
  const auth = getAuthUser(req);
  const provider = String(req.body?.provider || '').trim().toLowerCase();
  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || 'EUR').trim().toUpperCase();
  const method = String(req.body?.method || '').trim().toLowerCase();
  const metadata = req.body?.metadata ?? null;

  if (!MOCK_PAYMENT_PROVIDERS.has(provider)) {
    return res.status(400).json({ message: 'Unsupported provider' });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  const amountCents = Math.round(amount * 100);
  const paymentId = createMockPaymentId(provider);

  db.prepare(`
    INSERT INTO payment_tx (user_id, payment_id, provider, amount_cents, currency, status, method, metadata)
    VALUES (?, ?, ?, ?, ?, 'requires_confirmation', ?, ?)
  `).run(
    auth?.user?.id ?? null,
    paymentId,
    provider,
    amountCents,
    currency,
    method || null,
    metadata ? JSON.stringify(metadata) : null
  );

  res.status(201).json({
    paymentId,
    provider,
    amount,
    currency,
    status: 'requires_confirmation',
    clientSecret: `mock_secret_${paymentId}`,
    mocked: true,
  });
});

app.post('/api/payments/mock-confirm', (req, res) => {
  const provider = String(req.body?.provider || '').trim().toLowerCase();
  const paymentId = String(req.body?.paymentId || '').trim();
  const forceFail = Boolean(req.body?.forceFail);

  if (!MOCK_PAYMENT_PROVIDERS.has(provider)) {
    return res.status(400).json({ message: 'Unsupported provider' });
  }

  if (!paymentId) {
    return res.status(400).json({ message: 'paymentId is required' });
  }

  const payment = db
    .prepare(`
      SELECT payment_id, provider, amount_cents, currency, status
      FROM payment_tx
      WHERE payment_id = ? AND provider = ?
      LIMIT 1
    `)
    .get(paymentId, provider);

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  if (payment.status === 'succeeded') {
    return res.json({
      paymentId: payment.payment_id,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount_cents / 100,
      currency: payment.currency,
      mocked: true,
    });
  }

  if (forceFail) {
    db.prepare(`
      UPDATE payment_tx
      SET status = 'failed', updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = ?
    `).run(paymentId);

    return res.status(402).json({
      message: 'Mock payment declined',
      paymentId,
      provider,
      status: 'failed',
      mocked: true,
    });
  }

  db.prepare(`
    UPDATE payment_tx
    SET status = 'succeeded', updated_at = CURRENT_TIMESTAMP
    WHERE payment_id = ?
  `).run(paymentId);

  return res.json({
    paymentId,
    provider,
    status: 'succeeded',
    amount: payment.amount_cents / 100,
    currency: payment.currency,
    mocked: true,
    paidAt: new Date().toISOString(),
  });
});

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

  const hasShowtimeTable = Boolean(
    db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'showtime'`).get()
  );

  try {
    const deleteMovieCascade = db.transaction((id) => {
      db.prepare(`
        DELETE FROM ticket
        WHERE session_id IN (
          SELECT s.id
          FROM sessions s
          WHERE s.movie_id = ?
        )
      `).run(id);

      if (hasShowtimeTable) {
        db.prepare(`
          DELETE FROM showtime
          WHERE session_id IN (
            SELECT s.id
            FROM sessions s
            WHERE s.movie_id = ?
          )
        `).run(id);
      }

      db.prepare(`DELETE FROM sessions WHERE movie_id = ?`).run(id);
      db.prepare(`DELETE FROM movie WHERE id = ?`).run(id);
    });

    deleteMovieCascade(movieId);
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

    const result = hasSessionHallColumn
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
      )
      : db.prepare(`
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movieId,
        cinemaRow.id,
        hallRow.id,
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
  const hasShowtimeTable = Boolean(
    db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'showtime'`).get()
  );

  try {
    const deleteSessions = db.prepare(`
      DELETE FROM sessions 
      WHERE datetime(date) >= datetime(?) AND datetime(date) < datetime(?, '+1 day')
    `);
    const deleteShowtime = hasShowtimeTable
      ? db.prepare(`
        DELETE FROM showtime 
        WHERE datetime(date) >= datetime(?) AND datetime(date) < datetime(?, '+1 day')
      `)
      : null;

    const resultSessions = isoStart && isoEnd ? deleteSessions.run(isoStart, isoEnd) : { changes: 0 };
    const resultShowtime = isoStart && isoEnd && deleteShowtime
      ? deleteShowtime.run(isoStart, isoEnd)
      : { changes: 0 };

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

  const hasShowtimeTable = Boolean(
    db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'showtime'`).get()
  );

  try {
    const deleteSessionCascade = db.transaction((id) => {
      db.prepare(`DELETE FROM ticket WHERE session_id = ?`).run(id);
      if (hasShowtimeTable) {
        db.prepare(`DELETE FROM showtime WHERE session_id = ?`).run(id);
      }
      db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
    });

    deleteSessionCascade(sessionId);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

const APP_PORT = Number(process.env.PORT || 4000);
const APP_HOST = process.env.HOST || '';
const distDir = path.resolve(__dirname, '..', 'dist');
const distIndex = path.join(distDir, 'index.html');

app.use('/uploads', express.static(uploadsDir));

if (fs.existsSync(distDir) && fs.existsSync(distIndex)) {
  app.use(express.static(distDir));

  // Serve built frontend for non-API paths in production hosting.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(distIndex);
  });
}

if (APP_HOST) {
  app.listen(APP_PORT, APP_HOST, () => {
    console.log(`API on http://${APP_HOST}:${APP_PORT}`);
  });
} else {
  app.listen(APP_PORT, () => {
    console.log(`API on http://localhost:${APP_PORT}`);
  });
}