import React from 'react';

export default function ComingSoon() {
  const items = [1,2,3];
  return (
    <section className="section">
      <div className="title">Coming Soon</div>
      <div className="cards">
        {items.map((i)=>(
          <div key={i} className="card medium">
            <div className="visual" />
            <div className="meta">Coming soon</div>
          </div>
        ))}
      </div>
    </section>
  );
}