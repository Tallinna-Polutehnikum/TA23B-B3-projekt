import React, { useState, useEffect } from "react";
import "./SeatMap.css";

export default function SeatMap({ sessionId, onClose }) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/seats`)
      .then((res) => res.json())
      .then((data) => {
        setSeats(data.seats || generateSeatsGrid());
        setSessionInfo(data.sessionInfo);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load seats', err);
        setSeats(generateSeatsGrid());
        setLoading(false);
      });
  }, [sessionId]);

  const generateSeatsGrid = () => {
    // 10 рядов, 15 мест в каждом
    const grid = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 15; col++) {
        const seatNumber = row * 15 + col + 1;
        const isOccupied = Math.random() < 0.3; // 30% занято
        grid.push({
          id: `seat-${row}-${col}`,
          row: String.fromCharCode(65 + row), // A, B, C, ...
          number: col + 1,
          occupied: isOccupied,
          seatNumber
        });
      }
    }
    return grid;
  };

  const handleSeatClick = (seat) => {
    if (seat.occupied) return;
    
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

  if (loading) {
    return <div className="seat-map-loading">Loading seats...</div>;
  }

  return (
    <div className="seat-map-overlay" onClick={onClose}>
      <div className="seat-map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="seat-map-header">
          <h2>Select Seats</h2>
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
              disabled={selectedSeats.length === 0}
              onClick={() => {
                console.log('Booking seats:', selectedSeats);
                onClose();
              }}
            >
              Book Seats (€{getTotalPrice()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
