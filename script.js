// Shared script: films data and page initializers
const films = [
  {id:1,title:'Elnar Monkey',poster:'assets/poster-1.svg',gallery:['assets/poster-1.svg','assets/poster-2.svg'],director:'E. Director',cast:['Elnar A.','Katrin B.','M. Tamm'],genre:'comedy',genreLabel:'Komöödia',country:'USA',runtime:'1h 45m',rating:'7.2',description:'Lühikirjeldus Elnar Monkeyst. Naljakas ja kerge süžee.',synopsis:'Elnar Monkey on soe ja naljakas lugu sõprusest ja ootamatust rikkusest. Sobib kogu perele.',showtimes:['12:30','15:00','18:45']},
  {id:2,title:'Artur Monkey',poster:'assets/poster-2.svg',gallery:['assets/poster-2.svg','assets/poster-3.svg'],director:'A. Director',cast:['Artur K.','L. Levin'],genre:'documentary,music',genreLabel:'Dokumentaal • Muusika',country:'UK',runtime:'1h 30m',rating:'8.1',description:'Kontsertdokumentaal ja kunstiline portree.',synopsis:'Sügav ja visuaalne dokumentaal bändi teekonnast ja loomeprotsessist.',showtimes:['13:15','17:00']},
  {id:3,title:'Sofja',poster:'assets/poster-3.svg',gallery:['assets/poster-3.svg','assets/poster-4.svg'],director:'S. Director',cast:['Sofja P.','D. Grey'],genre:'horror',genreLabel:'Õudus',country:'USA',runtime:'1h 50m',rating:'6.8',description:'Õudusfilm, mis hoiab sind pinges.',synopsis:'Õuduslik draama, mis uurib hirmu ja mälestusi.',showtimes:['20:00','22:30']},
  {id:4,title:'Venom 3: The Last Dance',poster:'assets/poster-4.svg',gallery:['assets/poster-4.svg','assets/poster-1.svg'],director:'V. Director',cast:['Ven','Tom R.'],genre:'action,scifi',genreLabel:'Märul • Ulme',country:'USA',runtime:'2h 10m',rating:'7.5',description:'Järjekordne epiline võitlus Venomiga.',synopsis:'Suure eelarvega ulmefilm täis kihutust ja pööraseid hetki.',showtimes:['14:00','19:00']}
];

function initIndex(){
  const genreSelect = document.getElementById('genreFilter');
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
  if (!id) return app.innerHTML = '<div class="notfound"><h2>Filmi ei leitud</h2><p>Proovi tagasi minna ja valida teine film.</p></div>';

  const film = films.find(f=>f.id===id);
  if (!film) return app.innerHTML = '<div class="notfound"><h2>Filmi ei leitud</h2><p>Proovi tagasi minna ja valida teine film.</p></div>';

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

// auto-init depending on page
document.addEventListener('DOMContentLoaded', ()=>{
  if (document.querySelector('.film-grid')) initIndex();
  if (document.getElementById('app') && location.pathname.endsWith('movie.html')) initMovie();
});
