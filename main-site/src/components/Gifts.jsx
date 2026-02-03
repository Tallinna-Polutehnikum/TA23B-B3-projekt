import { useEffect, useState } from 'react';
import ticketSingle from '../assets/gifts/ticket.jpg';
import ticketDuo from '../assets/gifts/duo.jpg';
import './Gifts.css';

const giftImages = {
  'children giftcard': ticketSingle,
  'classic giftcard': ticketSingle,
  'duo giftcard': ticketDuo,
};


export default function Gifts({ addToCart }) {
  const [gifts, setGifts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState(null);
  const [quantity, setQuantity] = useState(1);

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
            <div
              key={gift.id}
              className={`card medium${gift.name.toLowerCase().includes('duo') ? ' gift-duo' : ''}`}
              onClick={() => {
                setSelectedGift(gift);
                setQuantity(1);
              }}
              style={{ cursor: 'pointer' }}
            >
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

      {selectedGift && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedGift(null)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0a001a 0%, #1a0033 40%, #2a0845 70%, #3d1a5a 100%)',
              color: '#fff',
              borderRadius: 20,
              minWidth: 320,
              maxWidth: 400,
              padding: 32,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedGift(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer',
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div style={{ textAlign: 'center' }}>
              <img
                src={giftImages[selectedGift.name.toLowerCase()] ?? ticketSingle}
                alt={selectedGift.name}
                style={{ width: '70%', borderRadius: 12, marginBottom: 16 }}
              />
              <h2 style={{ margin: '8px 0 4px' }}>{selectedGift.name}</h2>
              <p style={{ margin: '0 0 8px', opacity: 0.85 }}>{selectedGift.type}</p>
              <div style={{ margin: '0 0 12px', fontSize: 16 }}>{selectedGift.description || 'No description.'}</div>
              <div style={{ margin: '12px 0', fontWeight: 'bold', fontSize: 18 }}>
                Price: {selectedGift.price} €
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ fontSize: 20, width: 32, height: 32, borderRadius: 8, border: 'none', background: '#28204a', color: '#fff', cursor: 'pointer' }}
                >
                  −
                </button>
                <span style={{ fontSize: 18 }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(20, q + 1))}
                  style={{ fontSize: 20, width: 32, height: 32, borderRadius: 8, border: 'none', background: '#28204a', color: '#fff', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
              <div style={{ fontSize: 18, marginBottom: 12 }}>
                Total: <b>{(selectedGift.price * quantity).toFixed(2)} €</b>
              </div>
              <button
                style={{
                  background: '#fff',
                  color: '#18122b',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  addToCart(selectedGift, quantity);
                  setSelectedGift(null);
                  setQuantity(1);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}