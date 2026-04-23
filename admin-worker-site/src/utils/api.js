const ADMIN_TOKEN_KEY = 'absoluteCinemaAdminToken';

function normalizeApiBase(rawBase) {
  const value = String(rawBase || '').trim();
  if (!value) return '';
  return value.replace(/\/+$/, '');
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

export function setAdminToken(token) {
  if (!token) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    return;
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getApiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with /, got: ${path}`);
  }
  return `${API_BASE}${path}`;
}

export async function apiFetch(path, options = {}, config = {}) {
  const { withAuth = false } = config;
  const token = getAdminToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(getApiUrl(path), {
    ...options,
    headers,
  });
}
