const Database = require("better-sqlite3");
const path = require("node:path");

const DB_PATH = path.resolve(__dirname, "db.sqlite");
const db = new Database(DB_PATH);

const SHOW_TIMES = ["12:00", "15:00", "18:00", "21:00"];
const WINDOW_DAYS = 7;
const DEFAULT_SEATS = 100;
const DEFAULT_LANGUAGE = "Estonian";
const DEFAULT_SUBTITLES = "English";
const DEFAULT_FORMAT = "2D";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function toScheduleDate(dateString, timeString) {
  return new Date(`${dateString}T${timeString}:00`);
}

function groupHallsByCinema(halls) {
  const grouped = new Map();

  for (const hall of halls) {
    if (!grouped.has(hall.cinema_id)) {
      grouped.set(hall.cinema_id, []);
    }
    grouped.get(hall.cinema_id).push(hall);
  }

  const result = [...grouped.entries()].map(([cinemaId, cinemaHalls]) => ({
    cinemaId,
    halls: cinemaHalls.sort((a, b) => a.id - b.id)
  }));

  result.sort((a, b) => a.cinemaId - b.cinemaId);
  return result;
}

function pickMovieId(movies, cinemaId, dayOffset, timeIndex, hallIndex, cinemaHallCount) {
  const cinemaSeed = Number(cinemaId) % movies.length;
  const rotation = dayOffset * SHOW_TIMES.length * Math.max(cinemaHallCount, 1);
  const slotSeed = timeIndex * Math.max(cinemaHallCount, 1) + hallIndex;
  const movieIndex = (cinemaSeed + rotation + slotSeed) % movies.length;
  return movies[movieIndex].id;
}

function main() {
  try {
    console.log("Running session scheduler...");
    console.log(`Using database: ${DB_PATH}`);

    const seatColumns = db.prepare(`PRAGMA table_info(seat)`).all();
    const hasSeatAvailabilityFlag = seatColumns.some((col) => col.name === "is_available");
    const seatAvailabilityWhere = hasSeatAvailabilityFlag ? "WHERE is_available = 1" : "";

    const sessionColumns = db.prepare(`PRAGMA table_info(sessions)`).all();
    const hasHallTextColumn = sessionColumns.some((col) => col.name === "hall");

    const deletedExpired = db.prepare(`
      DELETE FROM sessions
      WHERE datetime(date || ' ' || time) < datetime('now')
    `).run();

    const deletedBeyondWindow = db.prepare(`
      DELETE FROM sessions
      WHERE datetime(date || ' ' || time) > datetime('now', '+7 days')
    `).run();

    const movies = db.prepare(`SELECT id FROM movie ORDER BY id`).all();
    const halls = db.prepare(`
      SELECT
        h.id,
        h.cinema_id,
        h.hall_number,
        COALESCE(sc.total_seats, ${DEFAULT_SEATS}) AS default_seats
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

    if (movies.length === 0) {
      console.log("No movies found. Scheduler skipped generation.");
      return;
    }

    if (halls.length === 0) {
      console.log("No halls found. Scheduler skipped generation.");
      return;
    }

    const cinemas = groupHallsByCinema(halls);

    const maxHallsInCinema = cinemas.reduce((max, c) => Math.max(max, c.halls.length), 0);
    if (movies.length < maxHallsInCinema) {
      console.log(
        `Warning: ${movies.length} movies for up to ${maxHallsInCinema} halls. ` +
          "Some halls may share the same movie in a slot."
      );
    }

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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
      : null;

    const updateSessionWithHall = hasHallTextColumn
      ? db.prepare(`
          UPDATE sessions
          SET movie_id = ?, cinema_id = ?, hall_id = ?, hall = ?
          WHERE id = ?
        `)
      : null;

    const now = new Date();
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedPastCount = 0;
    let lockedByTicketsCount = 0;
    let duplicateRemovedCount = 0;

    const applySchedule = db.transaction(() => {
      for (let dayOffset = 0; dayOffset < WINDOW_DAYS; dayOffset += 1) {
        const day = new Date(now);
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() + dayOffset);
        const dateStr = formatDate(day);

        for (const cinema of cinemas) {
          const hallCount = cinema.halls.length;

          for (let timeIndex = 0; timeIndex < SHOW_TIMES.length; timeIndex += 1) {
            const time = SHOW_TIMES[timeIndex];

            for (let hallIndex = 0; hallIndex < hallCount; hallIndex += 1) {
              const hall = cinema.halls[hallIndex];
              const scheduleDate = toScheduleDate(dateStr, time);

              if (scheduleDate <= now) {
                skippedPastCount += 1;
                continue;
              }

              const plannedMovieId = pickMovieId(
                movies,
                cinema.cinemaId,
                dayOffset,
                timeIndex,
                hallIndex,
                hallCount
              );

              const slotSessions = findSlotSessions.all(hall.id, dateStr, time);

              if (slotSessions.length === 0) {
                if (hasHallTextColumn && insertSessionWithHall) {
                  insertSessionWithHall.run(
                    plannedMovieId,
                    hall.cinema_id,
                    hall.id,
                    hall.hall_number,
                    dateStr,
                    time,
                    hall.default_seats,
                    DEFAULT_LANGUAGE,
                    DEFAULT_SUBTITLES,
                    DEFAULT_FORMAT
                  );
                } else {
                  insertSession.run(
                    plannedMovieId,
                    hall.cinema_id,
                    hall.id,
                    dateStr,
                    time,
                    hall.default_seats,
                    DEFAULT_LANGUAGE,
                    DEFAULT_SUBTITLES,
                    DEFAULT_FORMAT
                  );
                }
                insertedCount += 1;
                continue;
              }

              let keeper = slotSessions[0];
              let keeperTickets = ticketCountBySession.get(keeper.id).cnt;

              for (const candidate of slotSessions.slice(1)) {
                const candidateTickets = ticketCountBySession.get(candidate.id).cnt;
                if (candidateTickets > keeperTickets) {
                  if (keeperTickets === 0) {
                    deleteSessionById.run(keeper.id);
                    duplicateRemovedCount += 1;
                  }
                  keeper = candidate;
                  keeperTickets = candidateTickets;
                } else if (candidateTickets === 0) {
                  deleteSessionById.run(candidate.id);
                  duplicateRemovedCount += 1;
                } else {
                  lockedByTicketsCount += 1;
                }
              }

              if (keeper.movie_id === plannedMovieId) {
                continue;
              }

              if (keeperTickets > 0) {
                lockedByTicketsCount += 1;
                continue;
              }

              if (hasHallTextColumn && updateSessionWithHall) {
                updateSessionWithHall.run(
                  plannedMovieId,
                  hall.cinema_id,
                  hall.id,
                  hall.hall_number,
                  keeper.id
                );
              } else {
                updateSession.run(plannedMovieId, hall.cinema_id, hall.id, keeper.id);
              }
              updatedCount += 1;
            }
          }
        }
      }
    });

    applySchedule();

    console.log(`Expired sessions deleted: ${deletedExpired.changes}`);
    console.log(`Sessions deleted beyond 7 days: ${deletedBeyondWindow.changes}`);
    console.log(`Duplicate sessions removed: ${duplicateRemovedCount}`);
    console.log(`Past times skipped: ${skippedPastCount}`);
    console.log(`Sessions inserted: ${insertedCount}`);
    console.log(`Sessions updated: ${updatedCount}`);
    console.log(`Slots locked by tickets: ${lockedByTicketsCount}`);
    console.log("Scheduler finished.");
  } catch (error) {
    console.error("Scheduler failed:", error.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
