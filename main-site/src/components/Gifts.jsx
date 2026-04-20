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
              onClick={() => {
                setSelectedGift(gift);
                setQuantity(1);
              }}
              className={`card medium gift-card${gift.name.toLowerCase().includes('duo') ? ' gift-duo' : ''}`}
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
          className="gift-modal-overlay"
          onClick={() => setSelectedGift(null)}
        >
          <div
            className="gift-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedGift(null)}
              className="gift-modal-close"
              aria-label="Close"
            >
              ×
            </button>
            <div className="gift-modal-content">
              <img
                src={giftImages[selectedGift.name.toLowerCase()] ?? ticketSingle}
                alt={selectedGift.name}
                className="gift-modal-image"
              />
              <h2 className="gift-modal-title">{selectedGift.name}</h2>
              <p className="gift-modal-type">{selectedGift.type}</p>
              <div className="gift-modal-description">{selectedGift.description || 'No description.'}</div>
              <div className="gift-modal-price">
                Price: {selectedGift.price} €
              </div>
              <div className="gift-modal-qty-row">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="gift-modal-qty-btn"
                >
                  −
                </button>
                <span className="gift-modal-qty-value">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(20, q + 1))}
                  className="gift-modal-qty-btn"
                >
                  +
                </button>
              </div>
              <div className="gift-modal-total">
                Total: <b>{(selectedGift.price * quantity).toFixed(2)} €</b>
              </div>
              <button
                className="gift-modal-add-btn"
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