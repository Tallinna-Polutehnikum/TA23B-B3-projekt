# 🚀 Шпаргалка - Быстрый Старт

## За 5 Минут

### 1️⃣ Запустить Backend
```bash
cd main-site
npm install
node server/index.js
# Порт: http://localhost:4000
```

### 2️⃣ Запустить Main Site
```bash
cd main-site
npm install  # (если не запускали)
npm run dev
# Порт: http://localhost:5173 (обычно)
# Откройте: http://localhost:5173/showtime
```

### 3️⃣ Запустить Admin Panel
```bash
cd admin-worker-site
npm install
npm run dev
# Порт: http://localhost:5174 (обычно)
```

---

## Файлы, Которые Изменились ✏️

### Main Site
```
main-site/
├── src/components/
│   ├── Showtimes.jsx ✅ (обновлено)
│   ├── SessionCard.jsx ✅ (обновлено)
│   ├── SeatMap.jsx ✅ (НОВОЕ)
│   └── SeatMap.css ✅ (НОВОЕ)
└── server/
    └── index.js ✅ (обновлено)
```

### Admin Site
```
admin-worker-site/src/
├── App.jsx ✅ (обновлено)
├── App.css ✅ (обновлено)
└── components/
    ├── AdminDashboard.jsx ✅ (НОВОЕ)
    ├── AdminDashboard.css ✅ (НОВОЕ)
    ├── AddMovieForm.jsx ✅ (НОВОЕ)
    ├── AddMovieForm.css ✅ (НОВОЕ)
    ├── AddSessionForm.jsx ✅ (НОВОЕ)
    ├── AddSessionForm.css ✅ (НОВОЕ)
    ├── MoviesList.jsx ✅ (НОВОЕ)
    ├── MoviesList.css ✅ (НОВОЕ)
    ├── SessionsList.jsx ✅ (НОВОЕ)
    └── SessionsList.css ✅ (НОВОЕ)
```

---

## Новые Возможности 🎉

### На Main Site
- 🔍 **Фильтр по городу** - выпадающий список
- 🎬 **Фильтр по жанру** - выпадающий список
- 🎫 **Выбор мест** - сетка 10×15, показывает занятость
- 💰 **Расчет цены** - €12 за место

### На Admin Site
- 📊 **Dashboard** - статистика
- 🎬 **Управление фильмами** - список, добавление
- 🎫 **Управление сеансами** - список, добавление
- 📝 **Формы** - валидация, обработка ошибок

---

## Быстрые Ссылки

| Что | Ссылка |
|-----|--------|
| Main Site Showtime | http://localhost:5173/showtime |
| Admin Panel | http://localhost:5174 |
| Backend API | http://localhost:4000 |
| API Sessions | http://localhost:4000/api/sessions |
| API Seats | http://localhost:4000/api/sessions/1/seats |

---

## Ключевые Компоненты

### Showtimes (фильтрация)
```jsx
<Showtimes />
// Показывает сеансы с фильтрами
// Использует: city, date, genre
```

### SeatMap (выбор мест)
```jsx
<SeatMap sessionId={1} onClose={() => {}} />
// Модальное окно с сеткой мест
// Показывает: занятость, цену, выбранные места
```

### AdminDashboard (админ-панель)
```jsx
<AdminDashboard />
// Главная админ-панель
// Содержит: навигацию, формы, списки
```

---

## API Endpoints

### Получить Данные
```bash
# Все сеансы
GET http://localhost:4000/api/sessions

# Места для сеанса
GET http://localhost:4000/api/sessions/1/seats

# Топ фильмов
GET http://localhost:4000/api/movies/top
```

### Добавить Данные
```bash
# Добавить фильм
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

# Добавить сеанс
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

## Цвета

| Название | Код | Использование |
|----------|-----|----------------|
| Primary Green | #00d084 | Кнопки, активные элементы |
| Dark | #0f0f0f | Фон |
| Dark Secondary | #1a1a1a | Карточки, контейнеры |
| Dark Tertiary | #2a2a2a | Вторичный фон |
| Border | #333 | Границы |
| Text | #fff | Основной текст |
| Text Secondary | #ddd | Вторичный текст |
| Text Tertiary | #aaa | Третичный текст |
| Error | #ff4444 | Ошибки |
| Warning | #ff8800 | Предупреждения |

---

## Горячие Клавиши / Советы

### Разработка
```bash
# Очистить node_modules и переустановить
rm -rf node_modules package-lock.json
npm install

# Запустить с горячей перезагрузкой
npm run dev

# Проверить ошибки в коде
npm run lint  # (если настроено)
```

### Браузер
```
F12         - Открыть DevTools
Ctrl+Shift+J - Консоль
Ctrl+Shift+K - Сеть
Ctrl+Shift+I - Инспектор элементов
```

### Database
```bash
# Просмотреть таблицы
sqlite3 database/db.sqlite ".tables"

# Экспортировать данные
sqlite3 database/db.sqlite ".dump" > backup.sql

# Импортировать данные
sqlite3 database/db.sqlite < backup.sql
```

---

## Частые Проблемы и Решения

| Проблема | Решение |
|----------|---------|
| `Module not found` | Запустите `npm install` |
| `Port 4000 already in use` | Замените порт в `server/index.js` на свободный |
| `Cannot GET /showtime` | Убедитесь, что используете React Router правильно |
| `API is 404` | Проверьте, запущен ли backend сервер |
| `Таблицы пусты` | Проверьте БД, может нужны данные |
| `Стили не применяются` | Очистите кэш браузера (Ctrl+Shift+Del) |

---

## Расширение Функциональности

### Хочу добавить Edit (редактирование)
1. Добавьте `PUT /api/movies/:id` в backend
2. Добавьте форму в компонент
3. Измените обработчик onClick в таблице
4. Тестируйте

### Хочу добавить Delete (удаление)
1. Добавьте `DELETE /api/movies/:id` в backend
2. Добавьте конфирм диалог перед удалением
3. Обновите таблицу после удаления
4. Тестируйте

### Хочу добавить Search (поиск)
1. Добавьте input поле в компонент
2. Фильтруйте список по введённому тексту
3. Показывайте результаты в реальном времени

---

## Документация

📖 **Подробные документы:**
- `NEW_FEATURES.md` - Описание всех новых функций
- `ARCHITECTURE.md` - Архитектура и структура
- `IMPLEMENTATION_SUMMARY.md` - Резюме реализации
- `TESTING_CHECKLIST.md` - Контрольный список тестирования
- `DATABASE_SETUP.sql` - SQL примеры

---

## Контакты и Поддержка

Если возникают вопросы:
1. Проверьте документацию выше
2. Смотрите консоль браузера (F12)
3. Проверьте сообщения сервера
4. Используйте контрольный список тестирования

---

## Примечание

Все компоненты готовы к использованию. Функции Edit и Delete имеют готовый UI, но логика отложена для будущих версий.

Если нужно быстро добавить эту функциональность, скопируйте структуру POST запросов и создайте PUT/DELETE versions.

---

**Last Updated:** 5 февраля 2026
**Version:** 1.0
**Status:** ✅ Ready to Use
