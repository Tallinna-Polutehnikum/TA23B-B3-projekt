import React from 'react';

export default function Genres() {
  const items = new Array(6).fill(0).map((_,i)=>i+1);
  return (
    <section className="section">
      <div className="title">Genres</div>
      <div className="cards">
        {items.map((i)=>(
          <div key={i} className="card small" aria-hidden="false">
            <div className="visual" />
            <div className="meta" style={{padding:"8px", textAlign:"center", fontSize:13}}>Genre</div>
          </div>
        ))}
      </div>
    </section>
  );
}