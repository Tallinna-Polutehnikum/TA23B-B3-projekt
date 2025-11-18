export default function Gifts() {
  const items = [1,2,3];
  return (
    <section className="section">
      <div className="title">Gifts</div>
      <div className="cards">
        {items.map((i)=>(
          <div key={i} className="card medium">
            <div className="visual" />
            <div className="meta">Gift item</div>
          </div>
        ))}
      </div>
    </section>
  );
}