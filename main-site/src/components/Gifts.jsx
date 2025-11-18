import { useEffect, useState } from 'react';
import ticketSingle from '../assets/gifts/ticket.jpg';
import ticketDuo from '../assets/gifts/duo.jpg';
import './Gifts.css';

const giftImages = {
  'children giftcard': ticketSingle,
  'classic giftcard': ticketSingle,
  'duo giftcard': ticketDuo,
};

export default function Gifts() {
  const [gifts, setGifts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gifts')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load gifts');
        return res.json();
      })
      .then(setGifts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section gifts-section">
      <div className="title">Gifts</div>
      <div className="cards">
        {loading && <div className="card medium">Loading…</div>}
        {error && !loading && <div className="card medium">{error}</div>}
        {!loading &&
          !error &&
          gifts.map((gift) => (
            <div key={gift.id} className="card medium">
              <div className="visual">
                <img
                  src={giftImages[gift.name.toLowerCase()] ?? ticketSingle}
                  alt={gift.name}
                  loading="lazy"
                />
              </div>
              <div className="meta">
                <h3>{gift.name}</h3>
                <p>{gift.type}</p>
                <strong>{gift.price} €</strong>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}