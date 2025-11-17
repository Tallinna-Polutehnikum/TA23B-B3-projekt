// Shared script: films data and page initializers
const films = [
  {id:1,title:'Elnar Monkey',poster:'assets/poster-1.svg',gallery:['assets/poster-1.svg','assets/poster-2.svg'],director:'E. Director',cast:['Elnar A.','Katrin B.','M. Tamm'],genre:'comedy',genreLabel:'Comedy',country:'USA',runtime:'1h 45m',rating:'7.2',description:'A short description of Elnar Monkey. A funny and light-hearted story.',synopsis:'Elnar Monkey is a warm and funny tale about friendship and unexpected fortune. Suitable for the whole family.',showtimes:['12:30','15:00','18:45'],upcoming:false},
  {id:2,title:'Artur Monkey',poster:'assets/poster-2.svg',gallery:['assets/poster-2.svg','assets/poster-3.svg'],director:'A. Director',cast:['Artur K.','L. Levin'],genre:'documentary,music',genreLabel:'Documentary • Music',country:'UK',runtime:'1h 30m',rating:'8.1',description:'A concert documentary and artistic portrait.',synopsis:'A deep and visual documentary about the band’s journey and creative process.',showtimes:['13:15','17:00'],upcoming:false},
  {id:3,title:'Sofja',poster:'assets/poster-3.svg',gallery:['assets/poster-3.svg','assets/poster-4.svg'],director:'S. Director',cast:['Sofja P.','D. Grey'],genre:'horror',genreLabel:'Horror',country:'USA',runtime:'1h 50m',rating:'6.8',description:'A tense horror film that keeps you on edge.',synopsis:'A chilling drama that explores fear and memories.',showtimes:['20:00','22:30'],upcoming:false},
  {id:4,title:'Venom 3: The Last Dance',poster:'assets/poster-4.svg',gallery:['assets/poster-4.svg','assets/poster-1.svg'],director:'V. Director',cast:['Ven','Tom R.'],genre:'action,scifi',genreLabel:'Action • Sci‑Fi',country:'USA',runtime:'2h 10m',rating:'7.5',description:'Another epic showdown with Venom.',synopsis:'A big-budget sci‑fi action film full of thrills and spectacular moments.',showtimes:['14:00','19:00'],upcoming:true},
  // upcoming example
  {id:5,title:'Aurora: Coming Soon',poster:'assets/poster-2.svg',gallery:['assets/poster-2.svg'],director:'A. Nova',cast:['L. Star'],genre:'scifi',genreLabel:'Sci‑Fi',country:'EE',runtime:'1h 50m',rating:'-',description:'Upcoming major sci‑fi film.',synopsis:'A brief description of the upcoming film. Stay tuned.',showtimes:[],upcoming:true}
];

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

  function applyFilter(){
    const val = genreSelect.value;
    filmLinks.forEach(link=>{
      const genres = (link.dataset.genre||'').split(',').map(s=>s.trim());
      if (val === 'all' || genres.includes(val)) link.style.display = '';
      else link.style.display = 'none';
    });
  }

  genreSelect.addEventListener('change', applyFilter);
  applyFilter();
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
});

// Auth modal logic
function initAuthModal(){
  const modal = document.getElementById('authModal');
  if(!modal) return;
  const overlay = modal.querySelector('.auth-overlay');
  const closeBtns = modal.querySelectorAll('[data-close]');
  const authBtn = document.querySelector('.auth-btn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');

  function openModal(){ modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeModal(){ modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  if(authBtn) authBtn.addEventListener('click', (e)=>{ e.preventDefault(); openModal(); });
  if(overlay) overlay.addEventListener('click', closeModal);
  closeBtns.forEach(b=>b.addEventListener('click', closeModal));

  // toggle forms
  if(showRegister) showRegister.addEventListener('click', (e)=>{ e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); modal.querySelector('#authTitle').textContent='Register'; });
  if(showLogin) showLogin.addEventListener('click', (e)=>{ e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); modal.querySelector('#authTitle').textContent='Log in'; });

  // handle submit (demo only)
  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = new FormData(loginForm);
    // simple demo feedback
    alert('Logged in as: ' + data.get('login'));
    closeModal();
  });

  registerForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = new FormData(registerForm);
    alert('Account created for: ' + data.get('email'));
    closeModal();
  });
}
