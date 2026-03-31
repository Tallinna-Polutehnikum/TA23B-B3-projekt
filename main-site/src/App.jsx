import "./index.css";
import "./App.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import HeroBanner from "./components/HeroBanner";
import Showtimes from "./components/Showtimes";
import AllMovies from "./components/AllMovies";
import TopMovies from "./components/TopMovies";
import Genres from "./components/Genres";
import Gifts from "./components/Gifts";
import ComingSoon from "./components/ComingSoon";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import AdminDashboard from "./components/AdminDashboard";
import Profile from "./components/Profile";
import FamilyScreeningPage from "./components/FamilyScreeningPage";
import BirthdayPage from "./components/BirthdayPage";
import VaartKinoPage from "./components/VaartKinoPage";
import PancakeMorningPage from "./components/PancakeMorningPage";
import EventsPage from "./components/EventsPage";
import CinemasPage from "./components/CinemasPage";
import CheckoutPage from "./components/CheckoutPage";

const AUTH_USER_KEY = "ac_auth_user";

function getStoredHeaderUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isShowtime = location.pathname === "/showtime";
  const isMovies = location.pathname === "/movies";
  const isAdmin = location.pathname === "/admin";
  const isProfile = location.pathname === "/profile";
  const isFamily = location.pathname === "/family";
  const isBirthday = location.pathname === "/birthday";
  const isVaart = location.pathname === "/vaartkino";
  const isPancake = location.pathname === "/pancake-morning";
  const isEvents = location.pathname === "/events";
  const isCinemas = location.pathname === "/cinemas";
  const isCheckout = location.pathname === "/checkout";

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [authUser, setAuthUser] = useState(() => getStoredHeaderUser());

  // Ensure route changes land at the top of the page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  // Keep the viewport at the top whenever we land on a route
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const syncAuthUser = () => {
      setAuthUser(getStoredHeaderUser());
    };

    syncAuthUser();
    window.addEventListener("storage", syncAuthUser);
    window.addEventListener("ac-auth-changed", syncAuthUser);
    return () => {
      window.removeEventListener("storage", syncAuthUser);
      window.removeEventListener("ac-auth-changed", syncAuthUser);
    };
  }, []);

  const headerInitial = (authUser?.username || authUser?.email || "U").slice(0, 1).toUpperCase();
  const hasHeaderAvatar = Boolean(authUser?.avatarUrl);

  const getPosterUrl = (poster, size = 'w500') => {
    if (!poster) return `https://via.placeholder.com/${size === 'w780' ? '640x360' : '300x450'}?text=No+Image`;
    if (poster.startsWith('http')) return poster;
    return `https://image.tmdb.org/t/p/${size}${poster}`;
  };

  const handleGenreSelect = async (genre) => {
    setSelectedGenre(genre);
    setGenreLoading(true);
    setSelectedMovie(null);
    setSelectedMovies([]);
    try {
      const res = await fetch(`/api/genres/${encodeURIComponent(genre)}/movies`);
      if (!res.ok) {
        throw new Error("Failed to fetch movies by genre");
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSelectedMovies(data);
        setSelectedMovie(data[0]);
      } else {
        setSelectedMovies([]);
        setSelectedMovie(null);
      }
    } catch (err) {
      console.error("Failed to fetch movies by genre", err);
      setSelectedMovies([]);
      setSelectedMovie(null);
    } finally {
      setGenreLoading(false);
    }
  };

  const addToCart = (gift, quantity) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === gift.id && item.type !== 'seats');
      if (existing) {
        return prev.map(item =>
          item.id === gift.id && item.type !== 'seats'
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...gift, quantity, type: 'gift' }];
    });
  };

  const addSeatsToCart = (sessionInfo, seats) => {
    if (!sessionInfo || !seats || seats.length === 0) return;

    const seatEntries = seats.map((s) => ({
      label: `${s.row}${s.number}`,
      // Keep numeric seat ids for checkout booking API.
      seatId: Number.isFinite(Number(s.id)) ? Number(s.id) : null,
    }));

    const seatLabels = seatEntries.map((entry) => entry.label);
    const seatIds = seatEntries.map((entry) => entry.seatId);

    const seatItem = {
      id: `seats-${sessionInfo.id ?? sessionInfo.sessionId ?? sessionInfo.movie_id ?? 'session'}-${Date.now()}`,
      type: 'seats',
      title: sessionInfo.title || 'Cinema Session',
      cinema: sessionInfo.cinema,
      time: sessionInfo.time,
      sessionId: sessionInfo.id ?? sessionInfo.sessionId,
      price: 12,
      quantity: seatLabels.length,
      seats: seatLabels,
      seatIds,
    };

    setCart(prev => [...prev, seatItem]);
    setShowCart(true);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const removeSeatFromCartItem = (itemId, seatLabel) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== itemId || item.type !== 'seats' || !item.seats) return item;
      const remainingIndexes = item.seats
        .map((label, idx) => ({ label, idx }))
        .filter(({ label }) => label !== seatLabel)
        .map(({ idx }) => idx);

      const remainingSeats = remainingIndexes.map((idx) => item.seats[idx]);
      const remainingSeatIds = Array.isArray(item.seatIds)
        ? remainingIndexes.map((idx) => item.seatIds[idx] ?? null)
        : [];

      if (remainingSeats.length === 0) {
        return [];
      }
      return {
        ...item,
        seats: remainingSeats,
        seatIds: remainingSeatIds,
        quantity: remainingSeats.length,
      };
    }));
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

  const clearCart = () => setCart([]);

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  let content = null;
  if (isAdmin) {
    content = <AdminDashboard />;
  } else if (isCheckout) {
    content = (
      <main className="site-container main-content">
        <CheckoutPage
          cart={cart}
          totalPrice={getTotalPrice()}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onRemoveSeat={removeSeatFromCartItem}
          onPaymentSuccess={() => {
            clearCart();
            setShowCart(false);
          }}
          onBack={() => navigate(-1)}
          onNavigateHome={() => navigate("/")}
          onComplete={() => {
            clearCart();
            setShowCart(false);
            navigate("/");
          }}
        />
      </main>
    );
  } else if (isShowtime) {
    content = (
      <main className="site-container main-content">
        <Showtimes addSeatsToCart={addSeatsToCart} />
      </main>
    );
  } else if (isMovies) {
    content = (
      <main className="site-container main-content">
        <AllMovies />
      </main>
    );
  } else if (isProfile) {
    content = (
      <main className="site-container main-content">
        <Profile />
      </main>
    );
  } else if (isFamily) {
    content = (
      <main className="main-content">
        <FamilyScreeningPage />
      </main>
    );
  } else if (isBirthday) {
    content = (
      <main className="main-content">
        <BirthdayPage />
      </main>
    );
  } else if (isVaart) {
    content = (
      <main className="main-content">
        <VaartKinoPage />
      </main>
    );
  } else if (isPancake) {
    content = (
      <main className="main-content">
        <PancakeMorningPage />
      </main>
    );
  } else if (isEvents) {
    content = (
      <main className="main-content">
        <EventsPage />
      </main>
    );
  } else if (isCinemas) {
    content = (
      <main className="main-content">
        <CinemasPage />
      </main>
    );
  } else {
    content = (
      <main className="site-container main-content">
        <HeroBanner />
        <TopMovies />
        <Genres onSelect={handleGenreSelect} />
        <Gifts addToCart={addToCart} />
        <ComingSoon />
      </main>
    );
  }

  return (
    <div className="app-root">
      {!isAdmin && (
        <header className="site-header">
          <div className="site-container" style={{ display: "flex", alignItems: "center", width: "100%", padding: 0 }}>
            <div className="site-brand">
              <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
                Absolute Cinema
                <small style={{ fontSize: 10, color: "#fff2", marginLeft: 6 }}>KINO·CINEMA</small>
              </Link>
            </div>
            <nav className="site-nav">
              <Link to="/showtime">Showtime</Link>
              <Link to="/cinemas" className={isCinemas ? "showtimes-active" : ""}>Cinemas</Link>
              <Link to="/events" className={isEvents ? "showtimes-active" : ""}>Events</Link>
              <Link to="/movies">Movies</Link>
              <a
                href="#gifts"
                onClick={(e) => {
                  e.preventDefault();
                  if (location.pathname !== '/') {
                    window.location.href = '/#gifts';
                  } else {
                    document.querySelector('.gifts-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                Cinema gifts
              </a>
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
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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
              {authUser ? (
                <Link
                  to="/profile"
                  className="icon-user icon-user--authed"
                  title="User profile"
                  aria-label="Go to profile"
                >
                  {hasHeaderAvatar ? (
                    <img
                      src={authUser.avatarUrl}
                      alt="Profile"
                      className="icon-user-avatar"
                    />
                  ) : (
                    headerInitial
                  )}
                </Link>
              ) : (
                <div className="header-auth">
                  <Link to="/profile?mode=login" className="header-auth-link" aria-label="Go to login">
                    Log in
                  </Link>
                  <Link to="/profile?mode=register" className="header-auth-link header-auth-link--primary" aria-label="Go to register">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {content}

      {!isAdmin && <Footer />}

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
                  {cart.map(item => {
                    const isSeatItem = item.type === 'seats';
                    return (
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
                          <div style={{ fontWeight: 'bold' }}>
                            {isSeatItem
                              ? `${item.title || 'Session'}${item.time ? ' · ' + item.time : ''}`
                              : item.name}
                          </div>
                          {isSeatItem ? (
                            <>
                              {item.cinema && (
                                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
                                  {item.cinema}
                                </div>
                              )}
                              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                                Seats:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                                {item.seats?.map((seatLabel) => (
                                  <span
                                    key={seatLabel}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      background: 'rgba(255,255,255,0.08)',
                                      borderRadius: 999,
                                      padding: '4px 10px',
                                      fontSize: 13,
                                    }}
                                  >
                                    {seatLabel}
                                    <button
                                      onClick={() => removeSeatFromCartItem(item.id, seatLabel)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        lineHeight: 1,
                                        padding: 0,
                                      }}
                                      aria-label={`Remove seat ${seatLabel}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                                €{item.price} per seat
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                              {item.price} € each
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {isSeatItem ? (
                            <div style={{ fontSize: 14, opacity: 0.85 }}>
                              × {item.quantity} seat{item.quantity > 1 ? 's' : ''}
                            </div>
                          ) : (
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
                          )}
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
                    );
                  })}
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
                      cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: cart.length === 0 ? 0.4 : 1,
                    }}
                    disabled={cart.length === 0}
                    onClick={() => {
                      if (cart.length === 0) return;
                      setShowCart(false);
                      navigate('/checkout');
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

      {selectedGenre && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { setSelectedGenre(null); setSelectedMovie(null); }}
        >
          <div
            style={{
              background: '#0b0b0d',
              color: '#fff',
              borderRadius: 12,
              minWidth: 540,
              maxWidth: 1100,
              width: '90vw',
              padding: 28,
              maxHeight: '85vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
              boxShadow: '0 12px 60px rgba(0,0,0,0.7)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setSelectedGenre(null); setSelectedMovie(null); }}
              style={{
                position: 'absolute',
                top: 10,
                right: 12,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 22,
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0 }}>{selectedGenre}</h3>
            {genreLoading ? (
              <div style={{ padding: 24, opacity: 0.8 }}>Loading movies...</div>
            ) : selectedMovie ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '0 0 auto' }}>
                    <Link
                      to={`/movie/${selectedMovie.id}`}
                      onClick={() => { setSelectedGenre(null); setSelectedMovie(null); setSelectedMovies([]); }}
                      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                    >
                        <img src={getPosterUrl(selectedMovie.poster, 'w780')} alt={selectedMovie.title} style={{ flex: '0 0 320px', width: '100%', maxWidth: 360, borderRadius: 8, boxShadow: '0 8px 28px rgba(0,0,0,0.6)' }} />
                    </Link>
                  </div>
                    <div style={{ flex: 1, minWidth: 0, overflowWrap: 'break-word', wordBreak: 'break-word', maxHeight: '70vh', overflowY: 'auto', paddingRight: 6 }}>
                    <Link
                      to={`/movie/${selectedMovie.id}`}
                      onClick={() => { setSelectedGenre(null); setSelectedMovie(null); setSelectedMovies([]); }}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(20px, 4vw, 30px)' }}>{selectedMovie.title}</h2>
                    </Link>
                    <div style={{ opacity: 0.85, fontSize: 14, marginBottom: 12 }}>{selectedMovie.genre}</div>
                      <p style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.5, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{selectedMovie.overview}</p>
                  </div>
                </div>

                {selectedMovies && selectedMovies.length > 1 && (
                  <div>
                    <div style={{ marginBottom: 8, color: '#ddd', fontSize: 14 }}>Also in this genre:</div>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
                      {selectedMovies.map((m) => (
                        <div key={m.id} style={{ minWidth: 140, maxWidth: 180, cursor: 'pointer' }}>
                          <Link
                            to={`/movie/${m.id}`}
                            onClick={() => { setSelectedGenre(null); setSelectedMovie(null); setSelectedMovies([]); }}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <img src={getPosterUrl(m.poster, 'w342')} alt={m.title} style={{ width: '100%', borderRadius: 6, display: 'block', boxShadow: '0 6px 18px rgba(0,0,0,0.5)' }} />
                            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>{m.title.length > 36 ? m.title.substring(0,36)+'…' : m.title}</div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 24, opacity: 0.8 }}>No movies found for this genre.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;