export function createInitialSessionFormData() {
  return {
    movieId: '',
    cinemaId: '',
    date: '',
    time: '',
    hallId: '',
    seatsAvailable: '100',
    language: 'Estonian',
    subtitles: 'English',
    format: '2D'
  };
}

export function buildHallsEndpoint(cinemaId) {
  return `/api/hall?cinemaId=${cinemaId}`;
}
