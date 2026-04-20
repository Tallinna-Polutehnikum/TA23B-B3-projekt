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
import { getPosterSrc } from "./utils/movieUi";

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
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches
  );

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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 700px)');
    const onChange = (event) => setIsPhone(event.matches);

    setIsPhone(media.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const headerInitial = (authUser?.username || authUser?.email || "U").slice(0, 1).toUpperCase();
  const hasHeaderAvatar = Boolean(authUser?.avatarUrl);

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
    if (authUser?.isAdmin) {
      content = <AdminDashboard />;
    } else {
      content = (
        <main className="site-container main-content">
          <section className="profile">
            <div className="profile-card">
              <h2 className="profile-name">Admin access required</h2>
              <p className="profile-meta">Sign in with an admin account to open this page.</p>
              <div className="header-auth header-auth--inline-start">
                <Link to="/profile?mode=login" className="header-auth-link header-auth-link--primary">
                  Log in
                </Link>
              </div>
            </div>
          </section>
        </main>
      );
    }
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
          <div className="site-container site-header-inner">
            <div className="site-brand">
              <Link to="/" className="site-brand-link">
                Absolute Cinema
                <small className="site-brand-sub">KINO·CINEMA</small>
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
                className="icon-cart-button"
                title="Cart"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="icon-cart-badge">
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
          className="cart-overlay"
          onClick={() => setShowCart(false)}
        >
          <div
            className={`cart-modal${isPhone ? ' cart-modal--phone' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCart(false)}
              className="cart-close-btn"
            >
              ×
            </button>
            <h2 className="cart-title">Shopping Cart</h2>
            {cart.length === 0 ? (
              <p className="cart-empty">Your cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => {
                    const isSeatItem = item.type === 'seats';
                    return (
                      <div
                        key={item.id}
                        className={`cart-item-row${isPhone ? ' cart-item-row--phone' : ''}`}
                      >
                        <div className="cart-item-info">
                          <div className="cart-item-name">
                            {isSeatItem
                              ? `${item.title || 'Session'}${item.time ? ' · ' + item.time : ''}`
                              : item.name}
                          </div>
                          {isSeatItem ? (
                            <>
                              {item.cinema && (
                                <div className="cart-item-cinema">
                                  {item.cinema}
                                </div>
                              )}
                              <div className="cart-item-seats-label">
                                Seats:
                              </div>
                              <div className="cart-seat-chips">
                                {item.seats?.map((seatLabel) => (
                                  <span
                                    key={seatLabel}
                                    className="cart-seat-chip"
                                  >
                                    {seatLabel}
                                    <button
                                      onClick={() => removeSeatFromCartItem(item.id, seatLabel)}
                                      className="cart-seat-remove"
                                      aria-label={`Remove seat ${seatLabel}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="cart-seat-price-note">
                                €{item.price} per seat
                              </div>
                            </>
                          ) : (
                            <div className="cart-item-unit-price">
                              {item.price} € each
                            </div>
                          )}
                        </div>
                        <div className={`cart-item-actions${isPhone ? ' cart-item-actions--phone' : ''}`}>
                          {isSeatItem ? (
                            <div className="cart-seat-qty">
                              × {item.quantity} seat{item.quantity > 1 ? 's' : ''}
                            </div>
                          ) : (
                            <div className="cart-qty-controls">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="cart-qty-btn"
                              >
                                −
                              </button>
                              <span className="cart-qty-value">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="cart-qty-btn"
                              >
                                +
                              </button>
                            </div>
                          )}
                          <span className="cart-item-total">
                            {(item.price * item.quantity).toFixed(2)} €
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="cart-remove-btn"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="cart-summary">
                  <div className="cart-total-row">
                    <span>Total:</span>
                    <span>{getTotalPrice().toFixed(2)} €</span>
                  </div>
                  <button
                    className="cart-checkout-btn"
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
          className="genre-overlay"
          onClick={() => { setSelectedGenre(null); setSelectedMovie(null); }}
        >
          <div
            className={`genre-modal${isPhone ? ' genre-modal--phone' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setSelectedGenre(null); setSelectedMovie(null); }}
              className="genre-close-btn"
            >
              ×
            </button>
            <h3 className="genre-title">{selectedGenre}</h3>
            {genreLoading ? (
              <div className="genre-status">Loading movies...</div>
            ) : selectedMovie ? (
              <div className="genre-content">
                <div className="genre-main">
                  <div className="genre-poster-col">
                    <Link
                      to={`/movie/${selectedMovie.id}`}
                      onClick={() => { setSelectedGenre(null); setSelectedMovie(null); setSelectedMovies([]); }}
                      className="genre-link-reset"
                    >
                      <img src={getPosterSrc(selectedMovie.poster, 'w780')} alt={selectedMovie.title} className="genre-main-poster" />
                    </Link>
                  </div>
                  <div className="genre-details">
                    <Link
                      to={`/movie/${selectedMovie.id}`}
                      onClick={() => { setSelectedGenre(null); setSelectedMovie(null); setSelectedMovies([]); }}
                      className="genre-link-reset"
                    >
                      <h2 className="genre-main-title">{selectedMovie.title}</h2>
                    </Link>
                    <div className="genre-main-meta">{selectedMovie.genre}</div>
                    <p className="genre-main-overview">{selectedMovie.overview}</p>
                  </div>
                </div>

                {selectedMovies && selectedMovies.length > 1 && (
                  <div className="genre-more-section">
                    <div className="genre-more-title">Also in this genre:</div>
                    <div className="genre-more-list">
                      {selectedMovies.map((m) => (
                        <div key={m.id} className="genre-more-item">
                          <Link
                            to={`/movie/${m.id}`}
                            onClick={() => { setSelectedGenre(null); setSelectedMovie(null); setSelectedMovies([]); }}
                            className="genre-link-reset"
                          >
                            <img src={getPosterSrc(m.poster, 'w342')} alt={m.title} className="genre-more-poster" />
                            <div className="genre-more-name">{m.title.length > 36 ? m.title.substring(0,36)+'…' : m.title}</div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="genre-status">No movies found for this genre.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;