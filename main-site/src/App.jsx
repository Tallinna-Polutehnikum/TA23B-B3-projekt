import "./index.css";
import "./App.css";
import { Link, useLocation } from "react-router-dom";
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
            <div className="icon-user" title="Account" />
          </div>
        </div>
      </header>

      <main className="site-container main-content">
        {isShowtime ? (
          <Showtimes />
        ) : (
          <>
            <HeroBanner />
            <TopMovies />
            <Genres />
            <Gifts />
            <ComingSoon />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;