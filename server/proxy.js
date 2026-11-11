import http from 'node:http';

const port = Number(process.env.PORT || 3001);
const apiKey = process.env.NASA_API_KEY;
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

if (!apiKey) {
  console.error('Set NASA_API_KEY before starting the proxy.');
  process.exit(1);
}

http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Vary', 'Origin');
  const incoming = new URL(request.url, `http://${request.headers.host}`);
  if (request.method !== 'GET' || incoming.pathname !== '/api/apod') {
    response.writeHead(404).end('Not found');
    return;
  }
  const url = new URL('https://api.nasa.gov/planetary/apod');
  for (const parameter of ['start_date', 'end_date', 'thumbs']) {
    if (incoming.searchParams.has(parameter)) url.searchParams.set(parameter, incoming.searchParams.get(parameter));
  }
  url.searchParams.set('api_key', apiKey);
  try {
    const upstream = await fetch(url);
    response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' });
    response.end(await upstream.text());
  } catch {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'NASA API unavailable' }));
  }
}).listen(port, () => console.log(`APOD proxy listening on port ${port}`));