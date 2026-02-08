# Запуск Новых Функций

## Для Главной Страницы (Main Site)

### 1. Фильтрация и Места

Новые компоненты уже интегрированы! Просто запустите main-site:

```bash
cd main-site
npm install
npm run dev
```

Функции доступны на странице `/showtime`:
- **Фильтрация по городу** - выпадающий список городов
- **Фильтрация по жанру** - выпадающий список жанров
- **Выбор мест** - кнопка "Buy Tickets" на каждом сеансе

### 2. API для мест

Эндпоинт уже добавлен в сервер:

```bash
# Убедитесь, что запущен сервер main-site
cd main-site
npm run dev  # или node server/index.js
```

API доступен на:
- `http://localhost:4000/api/sessions`
- `http://localhost:4000/api/sessions/{id}/seats`

---

## Для Админ-Панели (Admin Worker Site)

### 1. Запуск админ-панели

```bash
cd admin-worker-site
npm install
npm run dev
```

### 2. Доступные страницы

- **Dashboard** (`/`) - основной экран со статистикой
- **Movies** (`/movies`) - управление фильмами
- **Sessions** (`/sessions`) - управление сеансами
- **Add Movie** (`/add-movie`) - форма добавления фильма
- **Add Session** (`/add-session`) - форма добавления сеанса

### 3. Используемые API эндпоинты

Админ-панель отправляет запросы на:
- `GET /api/movies/top` - получить список фильмов
- `GET /api/sessions` - получить список сеансов
- `POST /api/movies` - добавить новый фильм
- `POST /api/sessions` - добавить новый сеанс

---

## Backend API обновлен

### Запуск сервера

```bash
cd main-site
npm install
node server/index.js
# или с контролем ошибок:
npm run dev
```

### Новые POST endpoints:

#### Добавить фильм
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

#### Добавить сеанс
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

## Проверка интеграции

### 1. Проверить фильтры на main-site
```
1. Откройте http://localhost:5173/showtime (или ваш порт)
2. Должны отображаться:
   - Выпадающий список городов
   - Выпадающий список жанров
   - Дни недели (как раньше)
3. Нажмите на любой "Buy Tickets" - должна открыться схема мест
```

### 2. Проверить админ-панель
```
1. Откройте http://localhost:5174 (или ваш порт)
2. Вы должны увидеть:
   - Боковую навигацию с пунктами меню
   - Overview с статистикой
   - Кнопки для добавления фильма/сеанса
```

### 3. Проверить API
```bash
# Получить сеансы
curl http://localhost:4000/api/sessions | jq

# Получить места для сеанса ID 1
curl http://localhost:4000/api/sessions/1/seats | jq
```

---

## Решение Проблем

### Админ-панель не стартует
```bash
# Проверьте зависимости
cd admin-worker-site
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API возвращает 404
```
- Убедитесь, что main-site сервер запущен на порту 4000
- Проверьте базу данных db.sqlite в папке database/
```

### Места не загружаются в SeatMap
```
- Проверьте в консоли браузера (F12) ошибки
- API эндпоинт должен быть доступен на http://localhost:4000/api/sessions/{id}/seats
```

### Таблицы в админ-панели пусты
```
- Убедитесь, что БД содержит записи
- Проверьте запросы в консоли сервера
- Попробуйте добавить первый фильм/сеанс вручную
```

---

## Структура Папок

```
project/
├── main-site/
│   ├── src/
│   │   └── components/
│   │       ├── Showtimes.jsx ✅ (обновлено с фильтрами)
│   │       ├── SeatMap.jsx ✅ (новое)
│   │       ├── SeatMap.css ✅ (новое)
│   │       └── SessionCard.jsx ✅ (обновлено)
│   ├── server/
│   │   └── index.js ✅ (добавлены POST endpoints)
│   └── package.json
│
├── admin-worker-site/
│   ├── src/
│   │   ├── App.jsx ✅ (обновлено)
│   │   ├── App.css ✅ (обновлено)
│   │   └── components/
│   │       ├── AdminDashboard.jsx ✅ (новое)
│   │       ├── AdminDashboard.css ✅ (новое)
│   │       ├── AddMovieForm.jsx ✅ (новое)
│   │       ├── AddMovieForm.css ✅ (новое)
│   │       ├── AddSessionForm.jsx ✅ (новое)
│   │       ├── AddSessionForm.css ✅ (новое)
│   │       ├── MoviesList.jsx ✅ (новое)
│   │       ├── MoviesList.css ✅ (новое)
│   │       ├── SessionsList.jsx ✅ (новое)
│   │       └── SessionsList.css ✅ (новое)
│   └── package.json
│
├── database/
│   └── db.sqlite
│
└── NEW_FEATURES.md ✅ (документация)
```

---

## Контрольный Список

- ✅ Фильтрация на главной странице (город, дата, жанр)
- ✅ Компонент SeatMap для выбора мест
- ✅ Admin Dashboard с меню
- ✅ Форма добавления фильма
- ✅ Форма добавления сеанса
- ✅ Список фильмов в админ-панели
- ✅ Список сеансов в админ-панели
- ✅ API endpoints для добавления данных
- ✅ API endpoint для получения мест
- ✅ Адаптивный дизайн (mobile-friendly)
- ✅ Документация

---

## Дополнительная Информация

Все компоненты используют современный React (hooks):
- `useState` для управления состоянием
- `useEffect` для загрузки данных
- Async/await для API запросов

Все стили используют CSS Grid/Flexbox и адаптивны для всех размеров экранов.
