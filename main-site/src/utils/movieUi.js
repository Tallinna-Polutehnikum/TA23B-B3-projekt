const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

function getPosterPlaceholder(size) {
  if (size === 'w780') return 'https://via.placeholder.com/640x360?text=No+Image';
  if (size === 'w500') return 'https://via.placeholder.com/300x450?text=No+Image';
  if (size === 'w92') return 'https://via.placeholder.com/92x138?text=No+Image';
  return 'https://via.placeholder.com/200x300?text=No+Image';
}

export function getPosterSrc(poster, size = 'w342') {
  const value = typeof poster === 'string' ? poster.trim() : '';
  if (!value) return getPosterPlaceholder(size);

  if (/^data:image\//i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `${TMDB_IMAGE_BASE}${size}${value}`;
  if (/^www\./i.test(value)) return `https://${value}`;

  // Accept host/path values without a scheme, e.g. cdn.example.com/poster.jpg
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`;

  return getPosterPlaceholder(size);
}

export function formatDurationLabel(value) {
  if (!value) return '—';

  const [h = '0', m = '00'] = String(value).split(':');
  return `${Number(h)}h ${m}min`;
}

export function normalizeDisplayText(value, fallback = '—') {
  return value?.trim() ? value : fallback;
}
