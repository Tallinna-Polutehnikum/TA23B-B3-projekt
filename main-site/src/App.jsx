import "./index.css";
import "./App.css";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import HeroBanner from "./components/HeroBanner";
import Showtimes from "./components/Showtimes";
import TopMovies from "./components/TopMovies";
import Genres from "./components/Genres";
import Gifts from "./components/Gifts";
import ComingSoon from "./components/ComingSoon";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";

function App() {
  const location = useLocation();
  const isShowtime = location.pathname === "/showtime";
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const addToCart = (gift, quantity) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === gift.id);
      if (existing) {
        return prev.map(item =>
          item.id === gift.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...gift, quantity }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    if (newQuantity > 20) return;
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="site-container" style={{display:"flex",alignItems:"center",width:"100%",padding:0}}>
          <div className="site-brand">
            <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
              Absolute Cinema
              <small style={{fontSize:10, color:"#fff2", marginLeft:6}}>KINO·CINEMA</small>
            </Link>
          </div>
          <nav className="site-nav">
            <Link to="/showtime">Showtime</Link>
            <a href="#">Cinemas</a>
            <a href="#">Movies</a>
            <a href="#">Events</a>
            <a href="#">Cinema gifts</a>
          </nav>
          <div className="search-wrap">
            <SearchBar />
            <div
              className="icon-cart"
              onClick={() => setShowCart(true)}
              style={{
                position: 'relative',
                width: 28,
                height: 28,
                cursor: 'pointer',
                marginLeft: 20,
                marginRight: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Cart"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {getTotalItems() > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#a020f0',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: 11,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getTotalItems()}
                </span>
              )}
            </div>
            <div className="icon-user" title="Account" />
          </div>
        </div>
      </header>

      {isShowtime ? (
        <main className="site-container main-content">
          <Showtimes />
        </main>
      ) : (
        <main className="site-container main-content">
          <HeroBanner />
          <TopMovies />
          <Genres />
          <Gifts addToCart={addToCart} />
          <ComingSoon />
        </main>
      )}

      <Footer />

      {showCart && (
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
          onClick={() => setShowCart(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0a001a 0%, #1a0033 40%, #2a0845 70%, #3d1a5a 100%)',
              color: '#fff',
              borderRadius: 20,
              minWidth: 400,
              maxWidth: 500,
              maxHeight: '80vh',
              padding: 32,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCart(false)}
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
            >
              ×
            </button>
            <h2 style={{ margin: '0 0 20px' }}>Shopping Cart</h2>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.7, padding: '40px 0' }}>Your cart is empty</p>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
                  {cart.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                          {item.price} € each
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{
                              background: 'rgba(255,255,255,0.15)',
                              border: 'none',
                              color: '#fff',
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 16,
                              fontWeight: 'bold'
                            }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: 20, textAlign: 'center', fontSize: 15 }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{
                              background: 'rgba(255,255,255,0.15)',
                              border: 'none',
                              color: '#fff',
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 16,
                              fontWeight: 'bold'
                            }}
                          >
                            +
                          </button>
                        </div>
                        <span style={{ fontWeight: 'bold', minWidth: 60, textAlign: 'right' }}>
                          {(item.price * item.quantity).toFixed(2)} €
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 16
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                    <span>Total:</span>
                    <span>{getTotalPrice().toFixed(2)} €</span>
                  </div>
                  <button
                    style={{
                      width: '100%',
                      background: '#fff',
                      color: '#18122b',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 24px',
                      fontWeight: 'bold',
                      fontSize: 16,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      alert('Proceeding to checkout...');
                      setShowCart(false);
                    }}
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;