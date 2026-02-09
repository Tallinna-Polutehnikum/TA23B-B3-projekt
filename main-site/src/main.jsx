import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import MovieDetails from './components/MovieDetails.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/showtime" element={<App />} />
        <Route path="/family" element={<App />} />
        <Route path="/birthday" element={<App />} />
        <Route path="/vaartkino" element={<App />} />
        <Route path="/pancake-morning" element={<App />} />
        <Route path="/events" element={<App />} />
        <Route path="/admin" element={<App />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
