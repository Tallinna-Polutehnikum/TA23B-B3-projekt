(async ()=>{
  try{
    const base = 'http://localhost:4000';
    const resp = await fetch(base + '/api/genres');
    console.log('genres status', resp.status);
    const genres = await resp.json();
    console.log('genres:', genres.map(g => `${g.id}:${g.type}`));
    for (const g of genres.slice(0,6)){
      const url = `${base}/api/genres/${encodeURIComponent(g.type)}/movies`;
      console.log('\nTesting', g.type, '->', url);
      const r = await fetch(url);
      console.log(' status', r.status);
      const text = await r.text();
      try{ console.log(' body (json):', JSON.parse(text)); }catch(e){ console.log(' body (text):', text.substring(0,300)); }
    }
  }catch(e){ console.error(e); }
})();
