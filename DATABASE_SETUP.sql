-- SQL запросы для обновления БД (если необходимо)
-- Используйте эти запросы только если таблицы не содержат необходимые поля

-- Проверить существующие таблицы
-- SELECT name FROM sqlite_master WHERE type='table';

-- Если нужно добавить поле 'genres' к таблице movie (если его нет)
-- ALTER TABLE movie ADD COLUMN genres TEXT;

-- Если нужно добавить больше полей к sessions
-- ALTER TABLE sessions ADD COLUMN format TEXT DEFAULT '2D';
-- ALTER TABLE sessions ADD COLUMN language TEXT DEFAULT 'Estonian';
-- ALTER TABLE sessions ADD COLUMN subtitles TEXT DEFAULT 'English';

-- Пример данных для тестирования

-- Добавить тестовый фильм
INSERT INTO movie (id, title, overview, poster, duration, genre_id, directors, genres, updated_at)
VALUES (
  999,
  'Test Movie',
  'This is a test movie for the new system',
  'https://via.placeholder.com/300x450',
  120,
  1,
  'Test Director',
  'Action, Sci-Fi',
  datetime('now')
);

-- Добавить тестовый сеанс
INSERT INTO sessions (id, movie_id, cinema_name, date, time, hall, seats_available, language, subtitles, format)
VALUES (
  999,
  999,
  'Tallinn - Kino',
  date('now', '+1 day'),
  '18:30',
  1,
  85,
  'Estonian',
  'English',
  '2D'
);

-- Проверить данные
SELECT 
  s.id,
  m.title,
  s.cinema_name,
  s.date,
  s.time,
  s.seats_available,
  m.genres
FROM sessions s
LEFT JOIN movie m ON s.movie_id = m.id
LIMIT 10;

-- Если нужно очистить тестовые данные
-- DELETE FROM sessions WHERE id = 999;
-- DELETE FROM movie WHERE id = 999;
