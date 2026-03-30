export function getPosterSrc(poster) {
  if (!poster) {
    return 'https://via.placeholder.com/200x300?text=No+Image';
  }

  if (poster.startsWith('http')) {
    return poster;
  }

  return `https://image.tmdb.org/t/p/w342${poster}`;
}

export function formatDurationLabel(value) {
  if (!value) return '—';

  const [h = '0', m = '00'] = String(value).split(':');
  return `${Number(h)}h ${m}min`;
}

export function normalizeDisplayText(value, fallback = '—') {
  return value?.trim() ? value : fallback;
}
