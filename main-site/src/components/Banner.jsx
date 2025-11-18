import React from 'react';
import './Banner.css';

export default function Banner() {
  return (
    <div className="hero section" role="region" aria-label="Featured movies">
      <div style={{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",color:"#7b7b7b"}}>
        Featured slider — add images or a carousel here
      </div>
    </div>
  );
}