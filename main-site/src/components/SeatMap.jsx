import React, { useState, useEffect } from "react";
import "./SeatMap.css";

export default function SeatMap({ sessionId, onClose, onAddSeatsToCart, sessionMeta }) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(600); // 10 minutes

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/seats`)
      .then((res) => res.json())
      .then((data) => {
        const normalizedSeats = (data.seats || generateSeatsGrid(data.sessionInfo?.seatsAvailable))
          .map((seat, idx) => {
            const seatLabel = seat.seat_number || seat.seatNumber || `S${idx + 1}`;
            const rowMatch = seatLabel.match(/^[A-Za-z]/);
            const numMatch = seatLabel.match(/(\d+)/);
            return {
              id: seat.id ?? seatLabel,
              row: (rowMatch ? rowMatch[0] : 'A').toUpperCase(),
              number: numMatch ? Number(numMatch[1]) : idx + 1,
              occupied: Boolean(seat.occupied),
              seatNumber: seatLabel,
              type: seat.type,
              price: seat.price
            };
          });
        setSeats(normalizedSeats);
        setSessionInfo(data.sessionInfo || sessionMeta || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load seats', err);
        setSeats(generateSeatsGrid());
        setSessionInfo(sessionMeta || null);
        setLoading(false);
      });
  }, [sessionId, sessionMeta]);

  useEffect(() => {
    setRemainingSeconds(600); // reset timer on open or session change
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const generateSeatsGrid = (seatsAvailable = 150) => {
    const total = Number(seatsAvailable) || 150;
    const columns = 15;
    const rows = Math.max(1, Math.ceil(total / columns));
    const grid = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const seatNumber = row * columns + col + 1;
        if (seatNumber > total) break;
        grid.push({
          id: `seat-${row}-${col}`,
          row: String.fromCharCode(65 + row), // A, B, C, ...
          number: col + 1,
          occupied: false,
          seatNumber
        });
      }
    }
    return grid;
  };

  const handleSeatClick = (seat) => {
    if (seat.occupied || remainingSeconds === 0) return;
    
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const getTotalPrice = () => {
    return selectedSeats.length * 12; // 12€ per seat
  };

  const handleConfirm = () => {
    if (selectedSeats.length === 0 || remainingSeconds === 0) return;
    const info = sessionInfo || sessionMeta || { id: sessionId, title: 'Session' };
    onAddSeatsToCart?.(info, selectedSeats);
    onClose();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return <div className="seat-map-loading">Loading seats...</div>;
  }

  return (
    <div className="seat-map-overlay" onClick={onClose}>
      <div className="seat-map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="seat-map-header">
          <h2>Select Seats</h2>
          <div className="seat-map-timer">
            Time left: {formatTime(remainingSeconds)}
          </div>
          {sessionInfo && (
            <div className="seat-map-info">
              <span>{sessionInfo.title}</span>
              <span>{sessionInfo.cinema}</span>
              <span>{sessionInfo.time}</span>
            </div>
          )}
          <button className="seat-map-close" onClick={onClose}>✕</button>
        </div>

        <div className="seat-map-screen">
          <div className="screen-label">SCREEN</div>
        </div>

        <div className="seat-map-grid">
          {Object.entries(groupedSeats).map(([row, rowSeats]) => (
            <div key={row} className="seat-row">
              <div className="row-label">{row}</div>
              <div className="seats-container">
                {rowSeats.map((seat) => (
                  <button
                    key={seat.id}
                    className={`seat ${seat.occupied ? 'occupied' : ''} ${
                      selectedSeats.some(s => s.id === seat.id) ? 'selected' : ''
                    }`}
                    disabled={seat.occupied}
                    onClick={() => handleSeatClick(seat)}
                    title={`Row ${seat.row}, Seat ${seat.number}`}
                  >
                    {seat.number}
                  </button>
                ))}
              </div>
              <div className="row-label">{row}</div>
            </div>
          ))}
        </div>

        <div className="seat-map-legend">
          <div className="legend-item">
            <div className="legend-seat available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat occupied"></div>
            <span>Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat selected"></div>
            <span>Selected</span>
          </div>
        </div>

        <div className="seat-map-footer">
          <div className="selected-seats-info">
            {selectedSeats.length > 0 ? (
              <>
                <div className="seats-list">
                  Selected: {selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}
                </div>
                <div className="price-info">
                  <span>{selectedSeats.length} seat(s) × €12 = <strong>€{getTotalPrice()}</strong></span>
                </div>
              </>
            ) : (
              <span style={{ color: '#999' }}>No seats selected</span>
            )}
          </div>
          <div className="seat-map-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button 
              className="btn-confirm"
              disabled={selectedSeats.length === 0 || remainingSeconds === 0}
              onClick={handleConfirm}
            >
              {remainingSeconds === 0 ? 'Time expired' : `Book Seats (€${getTotalPrice()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
