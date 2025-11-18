import "./index.css";
import "./App.css";
import HeroBanner from "./components/HeroBanner";
import TopMovies from "./components/TopMovies";
import Genres from "./components/Genres";
import Gifts from "./components/Gifts";
import ComingSoon from "./components/ComingSoon";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="app-root">
      <header className="site-header">
        <div className="site-container" style={{display:"flex",alignItems:"center",width:"100%",padding:0}}>
          <div className="site-brand">Absolute Cinema <small style={{fontSize:10, color:"#fff2", marginLeft:6}}>KINO·CINEMA</small></div>
          <nav className="site-nav">
            <a href="#">Showtime</a>
            <a href="#">Cinemas</a>
            <a href="#">Movies</a>
            <a href="#">Events</a>
            <a href="#">Cinema gifts</a>
          </nav>
          <div className="search-wrap">
            <input className="search-input" placeholder="Movie search" />
            <div className="icon-user" title="Account" />
          </div>
        </div>
      </header>

      <main className="site-container main-content">
        <HeroBanner />
        <TopMovies />
        <Genres />
        <Gifts />
        <ComingSoon />
      </main>

      <Footer />
    </div>
  );
}

export default App;