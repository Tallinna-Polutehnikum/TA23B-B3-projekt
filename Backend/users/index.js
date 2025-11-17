const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_prod';

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8') || 'null') || fallback;
  } catch (e) {
    console.error('readJson error', e && e.message);
    return fallback;
  }
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}

// simple helpers
function generateId(list) {
  const max = list.reduce((m, i) => Math.max(m, i.id || 0), 0);
  return max + 1;
}

// Auth middleware
function authRequired(req, res, next){
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // contains id,email
    next();
  }catch(e){
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = readJson(USERS_FILE, []);
  if(users.find(u=>u.email===email)) return res.status(400).json({ error: 'email exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: generateId(users), name: name || '', email, passwordHash: hash, settings: { theme: 'light' }, avatarUrl: null, membership: null };
  users.push(user);
  writeJson(USERS_FILE, users);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const safe = { id: user.id, name: user.name, email: user.email, settings: user.settings, avatarUrl: user.avatarUrl, membership: user.membership };
  res.json({ token, user: safe });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = readJson(USERS_FILE, []);
  const user = users.find(u=>u.email===email);
  if(!user) return res.status(400).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if(!ok) return res.status(400).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const safe = { id: user.id, name: user.name, email: user.email, settings: user.settings, avatarUrl: user.avatarUrl, membership: user.membership };
  res.json({ token, user: safe });
});

// Get current user
router.get('/me', authRequired, (req, res) => {
  const users = readJson(USERS_FILE, []);
  const user = users.find(u=>u.id===req.user.id);
  if(!user) return res.status(404).json({ error: 'user not found' });
  const safe = { id: user.id, name: user.name, email: user.email, settings: user.settings, avatarUrl: user.avatarUrl, membership: user.membership };
  res.json(safe);
});

// Update settings (e.g., theme)
router.post('/me/settings', authRequired, (req, res) => {
  const { settings } = req.body || {};
  if(!settings) return res.status(400).json({ error: 'missing settings' });
  const users = readJson(USERS_FILE, []);
  const idx = users.findIndex(u=>u.id===req.user.id);
  if(idx===-1) return res.status(404).json({ error: 'user not found' });
  // allow updating nested fields: settings, avatarUrl, membership, name
  if(settings.theme) users[idx].settings = Object.assign({}, users[idx].settings || {}, { theme: settings.theme });
  if(settings.lang) users[idx].settings = Object.assign({}, users[idx].settings || {}, { lang: settings.lang });
  if(typeof settings.avatarUrl !== 'undefined') users[idx].avatarUrl = settings.avatarUrl;
  if(typeof settings.membership !== 'undefined') users[idx].membership = settings.membership;
  if(typeof settings.name !== 'undefined') users[idx].name = settings.name;
  writeJson(USERS_FILE, users);
  const safe = { id: users[idx].id, name: users[idx].name, email: users[idx].email, settings: users[idx].settings, avatarUrl: users[idx].avatarUrl, membership: users[idx].membership };
  res.json(safe);
});

// Get tickets for current user
router.get('/me/tickets', authRequired, (req, res) => {
  const tickets = readJson(TICKETS_FILE, []);
  const my = tickets.filter(t=>t.userId===req.user.id);
  res.json(my);
});

module.exports = router;
