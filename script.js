// Shared script: films data and page initializers
const films = [
  {id:1,title:'Elnar Monkey',poster:'assets/poster-1.svg',gallery:['assets/poster-1.svg','assets/poster-2.svg'],director:'E. Director',cast:['Elnar A.','Katrin B.','M. Tamm'],genre:'comedy',genreLabel:'Comedy',country:'USA',runtime:'1h 45m',rating:'7.2',description:'A short description of Elnar Monkey. A funny and light-hearted story.',synopsis:'Elnar Monkey is a warm and funny tale about friendship and unexpected fortune. Suitable for the whole family.',showtimes:['12:30','15:00','18:45'],upcoming:false},
  {id:2,title:'Artur Monkey',poster:'assets/poster-2.svg',gallery:['assets/poster-2.svg','assets/poster-3.svg'],director:'A. Director',cast:['Artur K.','L. Levin'],genre:'documentary,music',genreLabel:'Documentary • Music',country:'UK',runtime:'1h 30m',rating:'8.1',description:'A concert documentary and artistic portrait.',synopsis:'A deep and visual documentary about the band’s journey and creative process.',showtimes:['13:15','17:00'],upcoming:false},
  {id:3,title:'Sofja',poster:'assets/poster-3.svg',gallery:['assets/poster-3.svg','assets/poster-4.svg'],director:'S. Director',cast:['Sofja P.','D. Grey'],genre:'horror',genreLabel:'Horror',country:'USA',runtime:'1h 50m',rating:'6.8',description:'A tense horror film that keeps you on edge.',synopsis:'A chilling drama that explores fear and memories.',showtimes:['20:00','22:30'],upcoming:false},
  {id:4,title:'Venom 3: The Last Dance',poster:'assets/poster-4.svg',gallery:['assets/poster-4.svg','assets/poster-1.svg'],director:'V. Director',cast:['Ven','Tom R.'],genre:'action,scifi',genreLabel:'Action • Sci‑Fi',country:'USA',runtime:'2h 10m',rating:'7.5',description:'Another epic showdown with Venom.',synopsis:'A big-budget sci‑fi action film full of thrills and spectacular moments.',showtimes:['14:00','19:00'],upcoming:true},
  // upcoming example
  {id:5,title:'Aurora: Coming Soon',poster:'assets/poster-2.svg',gallery:['assets/poster-2.svg'],director:'A. Nova',cast:['L. Star'],genre:'scifi',genreLabel:'Sci‑Fi',country:'EE',runtime:'1h 50m',rating:'-',description:'Upcoming major sci‑fi film.',synopsis:'A brief description of the upcoming film. Stay tuned.',showtimes:[],upcoming:true}
];

// --- TMDB enrichment (uses backend proxy at /tmdb/search)
async function searchTMDB(title){
  try{
    const res = await fetch(`/tmdb/search?q=${encodeURIComponent(title)}`);
    if(!res.ok) return null;
    const data = await res.json();
    if(data && Array.isArray(data.results) && data.results.length>0) return data.results[0];
    return null;
  }catch(e){
    console.warn('TMDB search failed', e && e.message);
    return null;
  }
}

// Try to replace placeholder posters with TMDB posters where available
async function enrichPosters(){
  for(const f of films){
    // only attempt if poster looks like a local placeholder (assets/)
    if(!f.poster || !f.poster.startsWith('assets/')) continue;
    const hit = await searchTMDB(f.title);
    if(hit && hit.poster){
      f.poster = hit.poster; // update data model
      // update any rendered img if present
      const link = document.querySelector(`.film-link[href="movie.html?id=${f.id}"]`);
      if(link){
        const img = link.querySelector('img');
        if(img){
          img.src = f.poster;
        }
      }
      // also update movie detail poster if currently viewing that page
      const mainPoster = document.getElementById('mainPoster');
      if(mainPoster && location.pathname.endsWith('movie.html')){
        // verify we are on same film
        const id = parseInt(getQueryParam('id'),10);
        if(id===f.id) mainPoster.src = f.poster;
      }
    }
  }
}

function renderFilmCard(f){
  // create anchor wrapper
  const a = document.createElement('a');
  a.className = 'film-link';
  a.href = `movie.html?id=${f.id}`;
  a.setAttribute('aria-label', `${f.title} details`);
  a.dataset.genre = f.genre || '';

  const div = document.createElement('div');
  div.className = 'film';

  const img = document.createElement('img');
  img.src = f.poster;
  img.alt = f.title;

  const info = document.createElement('div');
  info.className = 'film-info';
  info.innerHTML = `<h3>${f.title}</h3><p>${f.genreLabel || f.genre} • ${f.country}</p>`;

  div.appendChild(img);
  div.appendChild(info);
  a.appendChild(div);
  return a;
}

function initIndex(){
  const genreSelect = document.getElementById('genreFilter');
  const filmGrid = document.getElementById('filmGrid');
  const upcomingGrid = document.getElementById('upcomingGrid');
  if (!filmGrid) return;

  // clear and render
  filmGrid.innerHTML = '';
  upcomingGrid.innerHTML = '';

  films.forEach(f => {
    const node = renderFilmCard(f);
    if (f.upcoming) upcomingGrid.appendChild(node);
    else filmGrid.appendChild(node);
  });

  // now wire up filtering across both grids
  const filmLinks = Array.from(document.querySelectorAll('.film-link'));
  if (!genreSelect) return;

  // Get section elements and their headings
  const upcomingSection = document.getElementById('upcomingSection');
  const nowShowingSection = document.getElementById('nowShowing');
  const upcomingHeading = upcomingSection ? upcomingSection.querySelector('h2') : null;
  const nowShowingHeading = nowShowingSection ? nowShowingSection.querySelector('h2') : null;

  function applyFilter(){
    const val = genreSelect.value;
    filmLinks.forEach(link=>{
      const genres = (link.dataset.genre||'').split(',').map(s=>s.trim());
      if (val === 'all' || genres.includes(val)) link.style.display = '';
      else link.style.display = 'none';
    });

    // Update section visibility and headings based on filter
    if (val === 'all') {
      // Show both sections with original headings
      if (upcomingSection) upcomingSection.style.display = '';
      if (nowShowingSection) nowShowingSection.style.display = '';
      if (upcomingHeading) upcomingHeading.textContent = 'Coming soon';
      if (nowShowingHeading) nowShowingHeading.textContent = 'Top films';
    } else {
      // Find genre label from films array for display
      let genreLabel = val.charAt(0).toUpperCase() + val.slice(1);
      const matchingFilm = films.find(f => (f.genre || '').split(',').map(s => s.trim()).includes(val));
      if (matchingFilm) {
        // Map selected genre value to its display label
        const genreMap = {
          'comedy': 'Comedy',
          'documentary': 'Documentary',
          'music': 'Music',
          'horror': 'Horror',
          'action': 'Action',
          'scifi': 'Sci‑Fi'
        };
        genreLabel = genreMap[val] || (val.charAt(0).toUpperCase() + val.slice(1));
      }
      
      // Check if there are films in upcoming section with this genre
      const upcomingHasFilms = films.filter(f => f.upcoming && (f.genre || '').split(',').map(s => s.trim()).includes(val)).length > 0;
      // Check if there are films in now showing section with this genre
      const nowShowingHasFilms = films.filter(f => !f.upcoming && (f.genre || '').split(',').map(s => s.trim()).includes(val)).length > 0;
      
      // Show/hide sections based on whether they have films of this genre
      if (upcomingSection) upcomingSection.style.display = upcomingHasFilms ? '' : 'none';
      if (nowShowingSection) nowShowingSection.style.display = nowShowingHasFilms ? '' : 'none';
      
      // Update headings only in visible sections
      if (upcomingHasFilms && upcomingHeading) upcomingHeading.textContent = genreLabel;
      if (nowShowingHasFilms && nowShowingHeading) nowShowingHeading.textContent = genreLabel;
    }
  }

  genreSelect.addEventListener('change', applyFilter);
  applyFilter();
  // try to enrich posters from TMDB in background
  enrichPosters();
}

function getQueryParam(name){
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

function initMovie(){
  const id = parseInt(getQueryParam('id'),10);
  const app = document.getElementById('app');
  if (!app) return;
  if (!id) return app.innerHTML = '<div class="notfound"><h2>Movie not found</h2><p>Please go back and select another movie.</p></div>';

  const film = films.find(f=>f.id===id);
  if (!film) return app.innerHTML = '<div class="notfound"><h2>Movie not found</h2><p>Please go back and select another movie.</p></div>';

  app.innerHTML = `
    <div class="detail-wrap">
      <div class="card sidebar">
        <div class="poster"><img id="mainPoster" src="${film.poster}" alt="${film.title} poster"></div>
        <div class="gallery" id="gallery">
          ${film.gallery.map((g,i)=>`<div class="thumb ${i===0? 'active':''}" data-src="${g}"><img src="${g}" alt="thumb"></div>`).join('')}
        </div>
        <div style="margin-top:1rem">
          <small>Režissöör</small>
          <div style="font-weight:600">${film.director}</div>
        </div>
        <div style="margin-top:.6rem">
          <small>Näitlejad</small>
          <div style="color:var(--muted)">${film.cast.join(', ')}</div>
        </div>
      </div>

      <div>
        <div class="card">
          <h1>${film.title}</h1>
          <div class="submeta">${film.genreLabel} • ${film.country} • ${film.runtime} • Rating: ${film.rating}</div>
          <div class="meta-grid">
            <div class="meta-item"><strong>Kestus</strong><div>${film.runtime}</div></div>
            <div class="meta-item"><strong>Hind</strong><div>7.50€</div></div>
          </div>
          <div class="desc"><strong>Synopsis</strong><p>${film.synopsis}</p></div>

          <div>
            <strong>Näitamise ajad</strong>
            <div class="showtimes">
              ${film.showtimes.map(t=>`<button class="time" data-time="${t}">${t}</button>`).join('')}
            </div>
          </div>

          <div class="actions">
            <button class="buy" id="buyBtn">Osta pilet</button>
            <button class="reserve">Broneeri koht</button>
          </div>
        </div>

        <div class="card" style="margin-top:1rem">
          <small>Treiler</small>
          <div class="trailer">
            <img src="${film.gallery[0]}" alt="trailer thumbnail">
            <div class="play">▶</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // gallery handlers
  const gallery = app.querySelectorAll('.thumb');
  gallery.forEach(t=>t.addEventListener('click', ()=>{
    gallery.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const src = t.getAttribute('data-src');
    const main = document.getElementById('mainPoster');
    if(main) main.src = src;
  }));

  const buyBtn = document.getElementById('buyBtn');
  if(buyBtn) buyBtn.addEventListener('click', ()=>{
    alert('Demo: suunatakse ostule (implementeri tegelik checkout).');
  });
}

// Slideshow functionality
function initSlideshow() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;

  function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    slides[n].classList.add('active');
    dots[n].classList.add('active');
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  // Initialize first slide
  showSlide(0);

  // Add click events to dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentSlide = index;
      showSlide(currentSlide);
    });
  });

  // Auto advance slides every 30 seconds
  setInterval(nextSlide, 30000);
}

// auto-init depending on page
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the main page (index.html)
  if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/')) {
    initIndex();
    // Only initialize slideshow on main page
    if (document.querySelector('.slideshow-container')) {
      initSlideshow();
    }
    // initialize auth modal handlers
    initAuthModal();
  }
  // Movie detail page initialization
  if (document.getElementById('app') && location.pathname.endsWith('movie.html')) {
    initMovie();
  }
  // update header UI on all pages if header exists
  updateHeaderFromToken();
});

// Update header UI based on stored token (works across pages)
async function updateHeaderFromToken(){
  const tok = localStorage.getItem('token');
  const openAuthBtn = document.getElementById('openAuth');
  const userBtn = document.getElementById('userBtn');
  const elInitials = document.getElementById('userInitials');
  if(!openAuthBtn && !userBtn) return; // no header on this page
  if(!tok){ if(openAuthBtn) openAuthBtn.style.display=''; if(userBtn) userBtn.style.display='none'; return; }
  try{
    const res = await fetch('/api/users/me', { headers: { 'Authorization': 'Bearer '+ tok } });
    if(!res.ok){ localStorage.removeItem('token'); if(openAuthBtn) openAuthBtn.style.display=''; if(userBtn) userBtn.style.display='none'; return; }
    const me = await res.json();
    if(openAuthBtn) openAuthBtn.style.display='none';
    if(userBtn){ userBtn.style.display=''; if(elInitials){ const initials = (me.name && me.name.split(' ').map(s=>s[0]).slice(0,2).join('')) || (me.email && me.email[0].toUpperCase()) || 'U'; elInitials.textContent = initials; } }
  }catch(e){ console.warn('header auth check failed', e && e.message); }
}

// Auth modal logic
function initAuthModal(){
  const modal = document.getElementById('authModal');
  if(!modal) return;
  const overlay = modal.querySelector('.auth-overlay');
  const closeBtns = modal.querySelectorAll('[data-close]');
  const openAuthBtn = document.getElementById('openAuth');
  const userBtn = document.getElementById('userBtn');
  const userDropdown = document.getElementById('userDropdown');
  const headerLogout = document.getElementById('headerLogout');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');

  function openModal(){ modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeModal(){ modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  if(openAuthBtn) openAuthBtn.addEventListener('click', (e)=>{ e.preventDefault(); openModal(); });
  if(overlay) overlay.addEventListener('click', closeModal);
  closeBtns.forEach(b=>b.addEventListener('click', closeModal));

  // toggle forms
  if(showRegister) showRegister.addEventListener('click', (e)=>{ e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); modal.querySelector('#authTitle').textContent='Register'; });
  if(showLogin) showLogin.addEventListener('click', (e)=>{ e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); modal.querySelector('#authTitle').textContent='Log in'; });

  // helper: set UI when logged in
  function setUserUI(user){
    if(!user){
      // show login button
      if(openAuthBtn) openAuthBtn.style.display = '';
      if(userBtn) userBtn.style.display = 'none';
      if(userDropdown) userDropdown.style.display = 'none';
      return;
    }
    // show user button with initials
    if(openAuthBtn) openAuthBtn.style.display = 'none';
    if(userBtn) {
      userBtn.style.display = '';
      const initials = (user.name && user.name.split(' ').map(s=>s[0]).slice(0,2).join('')) || (user.email && user.email[0].toUpperCase()) || 'U';
      const elInitials = document.getElementById('userInitials');
      if(elInitials) elInitials.textContent = initials;
    }
  }

  function logout(){
    localStorage.removeItem('token');
    setUserUI(null);
    // hide dropdown
    if(userDropdown) userDropdown.style.display = 'none';
  }

  // toggle dropdown
  if(userBtn) userBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    if(!userDropdown) return;
    userDropdown.style.display = (userDropdown.style.display === 'block') ? 'none' : 'block';
  });
  if(headerLogout) headerLogout.addEventListener('click', (e)=>{ e.preventDefault(); logout(); });

  // handle submit with real API
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = new FormData(loginForm);
    const body = { email: data.get('login'), password: data.get('password') };
    try{
      const r = await fetch('/api/users/login', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
      const j = await r.json();
      if(!r.ok) return alert(j && j.error ? j.error : 'Login failed');
      localStorage.setItem('token', j.token);
      closeModal();
      // fetch profile and update UI
      const meRes = await fetch('/api/users/me', { headers: { 'Authorization': 'Bearer '+ j.token } });
      if(meRes.ok){ const me = await meRes.json(); setUserUI(me); }
    }catch(err){ console.error(err); alert('Login error'); }
  });

  registerForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = new FormData(registerForm);
    const body = { name: data.get('name'), email: data.get('email'), password: data.get('password') };
    try{
      const r = await fetch('/api/users/register', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
      const j = await r.json();
      if(!r.ok) return alert(j && j.error ? j.error : 'Register failed');
      localStorage.setItem('token', j.token);
      closeModal();
      const meRes = await fetch('/api/users/me', { headers: { 'Authorization': 'Bearer '+ j.token } });
      if(meRes.ok){ const me = await meRes.json(); setUserUI(me); }
    }catch(err){ console.error(err); alert('Registration error'); }
  });

  // on init: if token exists, try to fetch profile
  (async function(){
    const tok = localStorage.getItem('token');
    if(!tok) return setUserUI(null);
    try{
      const meRes = await fetch('/api/users/me', { headers: { 'Authorization': 'Bearer '+ tok } });
      if(meRes.ok){ const me = await meRes.json(); setUserUI(me); }
      else { localStorage.removeItem('token'); setUserUI(null); }
    }catch(e){ console.warn('profile fetch failed', e && e.message); setUserUI(null); }
  })();
}
