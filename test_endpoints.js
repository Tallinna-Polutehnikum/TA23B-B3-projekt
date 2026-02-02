import fetch from 'node-fetch';

console.log('=== Testing API endpoints ===\n');

async function testEndpoint(url) {
  console.log(`GET ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data)) {
      console.log(`  Count: ${data.length}`);
      data.slice(0, 3).forEach(item => {
        if (item.title) console.log(`  - ${item.title} (id: ${item.id})`);
      });
    } else {
      console.log('  Response:', JSON.stringify(data).slice(0, 100));
    }
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
  }
  console.log();
}

await testEndpoint('http://localhost:4000/api/movies/coming-soon');
await testEndpoint('http://localhost:4000/api/movies/top');
await testEndpoint('http://localhost:4000/api/gifts');
