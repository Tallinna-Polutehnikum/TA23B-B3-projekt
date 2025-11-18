import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer">
      © {new Date().getFullYear()} Our Kino • All rights reserved
    </footer>
  );
}