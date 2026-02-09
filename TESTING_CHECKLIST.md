# ✅ Testing Checklist

## 📋 Main Site - Filtering and Seats

### Filtering
- [ ] Page `/showtime` loads without errors
- [ ] Dropdowns displayed:
  - [ ] Location (city)
  - [ ] Genre (genre)
  - [ ] Days (days of week)
- [ ] City selection filters sessions
- [ ] Genre selection filters sessions
- [ ] Multiple filters work synchronously
- [ ] "All Cities" displays all sessions
- [ ] Genre list has no duplicates
- [ ] Sessions sorted by date and time
- [ ] "No sessions found" message when empty

### Seats (SeatMap)
- [ ] "Buy Tickets" button visible on each session
- [ ] Click "Buy Tickets" opens modal
- [ ] Modal has backdrop blur effect
- [ ] X button closes modal
- [ ] Click outside modal closes it
- [ ] Seat grid (10 rows × 15 seats) displayed
- [ ] Rows labeled (A, B, C, ... J)
- [ ] Seats numbered (1-15)
- [ ] Green seats clickable
- [ ] Red seats (occupied) disabled
- [ ] Click seat becomes purple
- [ ] Click again toggles to green
- [ ] Legend displayed (Available, Occupied, Selected)
- [ ] Screen label displayed (SCREEN)
- [ ] List of selected seats displayed (A1, B5, etc.)
- [ ] Price shown: Seats × €12 = Total
- [ ] "Book Seats" button active when seats selected
- [ ] "Book Seats" button disabled with zero seats
- [ ] "Cancel" button always active
- [ ] Console logs selected seats on "Book Seats" click
- [ ] Modal closes after completion

### Responsiveness
- [ ] On mobile (< 768px):
  - [ ] SeatMap opens fullscreen
  - [ ] Seats smaller size (28px)
  - [ ] Buttons positioned correctly
  - [ ] No horizontal scroll
- [ ] On tablet:
  - [ ] Seats medium size
  - [ ] Interface usable
- [ ] On desktop:
  - [ ] Seats optimal size
  - [ ] Layout beautiful

---

## 📊 Admin Panel - Interface

### Loading and Navigation
- [ ] Admin panel opens on port 5174 (or other)
- [ ] Loads without errors
- [ ] "Absolute Cinema" logo displayed
- [ ] Admin avatar and name displayed
- [ ] Sidebar menu visible and functional

### Menu and Navigation
- [ ] Menu contains sections:
  - [ ] Dashboard
  - [ ] Movies
  - [ ] Sessions
  - [ ] Add New Movie
  - [ ] Add New Session
  - [ ] Configuration
  - [ ] Reports
- [ ] Menu click activates tab
- [ ] Active item highlighted green
- [ ] Icons visible and recognizable
- [ ] Menu scrolls if content doesn't fit

### Overview (Main Screen)
- [ ] 4 stat cards displayed:
  - [ ] Movies in Database (24)
  - [ ] Active Sessions (156)
  - [ ] Cinemas (8)
  - [ ] Today Revenue (€3,245)
- [ ] Stat cards have icons
- [ ] Numbers shown in green
- [ ] Stat cards elevate on hover
- [ ] "Quick Actions" section with buttons:
  - [ ] Add Movie
  - [ ] Add Session
  - [ ] View Reports
- [ ] Buttons redirect to respective tabs

### Movies Management
- [ ] "Movies" tab opens
- [ ] Title displays "Movies Management"
- [ ] "Add New Movie" button displayed
- [ ] Table with columns:
  - [ ] Poster (thumbnails)
  - [ ] Title
  - [ ] Overview
  - [ ] Genre
  - [ ] Actions
- [ ] Table loads data from API
- [ ] Edit and Delete buttons for each movie
- [ ] "No movies found" if empty

### Sessions Management
- [ ] "Sessions" tab opens
- [ ] Title displays "Sessions Management"
- [ ] "Add New Session" button displayed
- [ ] Table with columns:
  - [ ] Movie
  - [ ] Cinema
  - [ ] Date
  - [ ] Time
  - [ ] Hall
  - [ ] Seats
  - [ ] Language
  - [ ] Format
  - [ ] Actions
- [ ] Table loads data from API
- [ ] Seats color-coded:
  - [ ] Green badge if many seats
  - [ ] Orange badge if few seats (< 20)
- [ ] Edit and Delete buttons for each session
- [ ] "No sessions found" if empty

---

## 🎬 Admin Panel - Add Movie Form

### Form Fields
- [ ] Title "Add New Movie" appears
- [ ] Fields displayed:
  - [ ] Movie Title (required, marked *)
  - [ ] Original Title
  - [ ] Duration (required, marked *)
  - [ ] Release Date (required, marked *)
  - [ ] Genre (required, marked *)
  - [ ] IMDb Rating
  - [ ] Directors
  - [ ] Poster URL (required, marked *)
  - [ ] Overview (required, marked *)
- [ ] All fields have placeholders
- [ ] Input fields have dark background (#2a2a2a)
- [ ] Field highlights green on focus

### Form Validation
- [ ] Empty form submission shows HTML5 error
- [ ] Required fields marked with asterisk
- [ ] Genre dropdown contains options:
  - [ ] Action
  - [ ] Drama
  - [ ] Comedy
  - [ ] Horror
  - [ ] Sci-Fi
  - [ ] Romance
  - [ ] Thriller
  - [ ] Animation
  - [ ] Adventure
  - [ ] Documentary
- [ ] Duration accepts only numbers
- [ ] Rating 0-10 with 0.1 step
- [ ] Poster URL requires URL format

### Form Submission
- [ ] "✓ Add Movie" button visible
- [ ] On submission button becomes "Adding Movie..." and disables
- [ ] On success:
  - [ ] Form clears
  - [ ] Success message shown (future)
  - [ ] Redirects to Movies tab
  - [ ] New movie appears in table
- [ ] On error:
  - [ ] Error message shown in red
  - [ ] Form remains filled for editing

---

## 🎫 Admin Panel - Add Session Form

### Form Fields
- [ ] Title "Add New Session" appears
- [ ] Fields displayed:
  - [ ] Select Movie (required)
  - [ ] Cinema (required)
  - [ ] Date (required)
  - [ ] Time (required)
  - [ ] Hall Number
  - [ ] Available Seats (required)
  - [ ] Language
  - [ ] Subtitles
  - [ ] Format
- [ ] Movie dropdown loads from API
- [ ] Cinema dropdown contains options:
  - [ ] Tallinn - Kino
  - [ ] Tallinn - CinemaX
  - [ ] Tallinn - Forum
  - [ ] Tartu - Cinema
  - [ ] Tartu - Plaza
- [ ] Hall dropdown contains 1-5
- [ ] Available Seats accepts only numbers (1-500)
- [ ] Language options: Estonian, English, Russian, German
- [ ] Subtitles options: None, Estonian, English, Russian
- [ ] Format options: 2D, 3D, IMAX, 4DX

### Form Submission
- [ ] "✓ Add Session" button visible
- [ ] On submission button becomes "Adding Session..." and disables
- [ ] On success:
  - [ ] Form clears
  - [ ] Redirects to Sessions tab
  - [ ] New session appears in table
- [ ] On error error message shown

---

## 🔧 Backend API

### Check Endpoints

#### GET /api/sessions
```bash
curl http://localhost:4000/api/sessions | jq
```
- [ ] Returns array of sessions
- [ ] Each session contains `genres` field
- [ ] HTTP 200 status

#### GET /api/sessions/:id/seats
```bash
curl http://localhost:4000/api/sessions/1/seats | jq
```
- [ ] Returns object with:
  - [ ] sessionInfo (id, title, cinema, time)
  - [ ] seats (array)
- [ ] Each seat contains: id, row, number, occupied
- [ ] 150 seats (10×15)
- [ ] HTTP 200 status
- [ ] HTTP 404 for invalid ID

#### POST /api/movies
```bash
curl -X POST http://localhost:4000/api/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","overview":"Test","poster":"url","duration":100,"genre":"Action"}'
```
- [ ] Creates new movie in DB
- [ ] Returns created movie with ID
- [ ] HTTP 201 status
- [ ] Validates required fields
- [ ] HTTP 400 for missing field
- [ ] HTTP 500 with message on DB error

#### POST /api/sessions
```bash
curl -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"movieId":1,"cinema":"Tallinn - Kino","date":"2024-02-10","time":"18:30","seatsAvailable":100}'
```
- [ ] Creates new session in DB
- [ ] Returns created session with ID
- [ ] HTTP 201 status
- [ ] Validates required fields
- [ ] Uses default values for optional fields
- [ ] HTTP 400 or 500 on error

---

## 🎨 Design and Styles

### Color Scheme
- [ ] Primary: #00d084 (green)
  - [ ] On buttons (Add Movie, Add Session, Book Seats)
  - [ ] On active menu items
  - [ ] On selected seats
  - [ ] On prices
- [ ] Background: #0f0f0f (very dark)
- [ ] Secondary background: #1a1a1a, #2a2a2a
- [ ] Text: #fff (main), #ddd (secondary), #aaa (tertiary)
- [ ] Errors: #ff4444 (red)
- [ ] Warnings: #ff8800 (orange)

### Typography
- [ ] Headers bold (font-weight: 600-700)
- [ ] Text readable on dark background
- [ ] Sizes proportional

### Effects
- [ ] Hover effects on buttons (elevate, color change)
- [ ] Transitions (transition: all 0.2s)
- [ ] Backdrop blur on modals
- [ ] Shadows on cards
- [ ] Active state for elements

---

## 📱 Responsiveness


### Мобильные (< 768px)
- [ ] Админ-панель:
  - [ ] Меню горизонтальное (grid-auto-flow: column)
  - [ ] Содержимое полной ширины
  - [ ] Таблицы скрывают лишние колонки
- [ ] Main Site:
  - [ ] Фильтры располагаются правильно
  - [ ] SeatMap полноэкранный
  - [ ] Места читаемые
- [ ] Формы:
  - [ ] Поля в одну колонку
  - [ ] Кнопки полной ширины

### Планшеты (768px - 1024px)
- [ ] Админ-панель с меню слева (200px)
- [ ] Таблицы показывают больше колонок
- [ ] Формы двухколончатые

### Десктоп (> 1024px)
- [ ] Полноценное боковое меню (250px)
- [ ] Все колонки видны
- [ ] Оптимальный макет

---

## 🐛 Обработка Ошибок

### Сетевые Ошибки
- [ ] При отсутствии соединения показывается ошибка
- [ ] API ошибки отображаются пользователю
- [ ] Loading состояния показываются

### Валидация
- [ ] Обязательные поля проверяются
- [ ] Форматы полей валидируются
- [ ] Сообщения об ошибках информативные

### Edge Cases
- [ ] Пустые списки показывают подходящие сообщения
- [ ] Очень длинный текст обрезается или скролится
- [ ] Большие таблицы скролятся

---

## 🚀 Перформанс

- [ ] Main Site загружается быстро
- [ ] Admin Panel загружается быстро
- [ ] API запросы выполняются в < 1 сек
- [ ] При выборе мест нет задержек
- [ ] Фильтрация происходит в реальном времени

---

## 📊 Функциональность

- [ ] Фильтрация работает корректно
- [ ] Места правильно отображают занятость
- [ ] Цена считается верно (seats × €12)
- [ ] Админ-панель CRUD операции работают
- [ ] Данные синхронизируются между БД и UI

---

## 🎉 Финальная Проверка

- [ ] Все файлы на месте
- [ ] Нет ошибок в консоли браузера (F12)
- [ ] Нет ошибок на сервере
- [ ] Документация актуальна
- [ ] Проект готов к использованию
