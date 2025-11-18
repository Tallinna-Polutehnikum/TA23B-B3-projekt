export default function TopMovies() {
  // Replace with real data / map over props later
  const items = [1,2,3];
  return (
    <section className="section">
      <div className="title">Top Movies</div>
      <div className="cards">
        {items.map((i) => (
          <article key={i} className="card large" aria-label={`Top movie ${i}`}>
            <div className="visual" />
            <div className="meta">Movie title</div>
          </article>
        ))}
      </div>
    </section>
  );
}