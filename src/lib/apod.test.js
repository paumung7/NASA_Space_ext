import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchApodRange, shiftDate, validateRange } from './apod.js';
import { featuredImages, libraryHighlights } from './nasa-images.js';

test('curated galleries have nine distinct NASA images with original links', () => {
  assert.equal(featuredImages.length, 9);
  assert.equal(libraryHighlights.length, 9);
  const images = [...featuredImages.map((entry) => entry.image), ...libraryHighlights.map((entry) => entry.url)];
  assert.equal(new Set(images).size, 18);
  assert.equal(featuredImages[0].image, 'https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~medium.jpg');
  assert.equal(libraryHighlights[0].url, 'https://images-assets.nasa.gov/image/PIA21775/PIA21775~medium.jpg');
  assert.equal(libraryHighlights[0].hdurl, 'https://images-assets.nasa.gov/image/PIA21775/PIA21775~orig.jpg');
  assert.ok(libraryHighlights.every((entry) => entry.source === 'NASA Image Library' && entry.media_type === 'image' && entry.hdurl));
});

test('validates archive, ordering, future, and range limits', () => {
  assert.equal(validateRange('2024-01-01', '2024-03-30', '2024-12-31'), '');
  assert.match(validateRange('1995-06-15', '1995-06-16', '2024-12-31'), /archive/);
  assert.match(validateRange('2024-01-02', '2024-01-01', '2024-12-31'), /start date/);
  assert.match(validateRange('2025-01-01', '2025-01-01', '2024-12-31'), /Future/);
  assert.match(validateRange('2024-01-01', '2024-03-31', '2024-12-31'), /90 days/);
  assert.match(validateRange('2024-02-30', '2024-03-01', '2024-12-31'), /valid/);
  assert.equal(shiftDate('2024-03-01', -1), '2024-02-29');
});

test('requests contiguous chunks with video thumbnails', async () => {
  const requests = [];
  const fetcher = async (url) => {
    requests.push(new URL(url));
    return { ok: true, json: async () => [{ date: requests.at(-1).searchParams.get('start_date') }] };
  };
  const entries = await fetchApodRange('2024-01-01', '2024-02-01', { fetcher });
  assert.equal(entries.length, 2);
  assert.equal(requests[0].searchParams.get('end_date'), '2024-01-30');
  assert.equal(requests[1].searchParams.get('start_date'), '2024-01-31');
  assert.equal(requests[1].searchParams.get('end_date'), '2024-02-01');
  assert.equal(requests[0].searchParams.get('thumbs'), 'true');
});

test('reports rate limits and connection failures', async () => {
  await assert.rejects(fetchApodRange('2024-01-01', '2024-01-01', { fetcher: async () => ({ ok: false, status: 429 }) }), /API limit/);
  await assert.rejects(fetchApodRange('2024-01-01', '2024-01-01', { fetcher: async () => { throw new TypeError('network'); } }), /connection/);
});

test('rejects NASA logo placeholders instead of displaying them as astronomy images', async () => {
  const fetcher = async () => ({ ok: true, json: async () => [{ title: 'NASA Science', url: 'https://science.nasa.gov/assets/images/nasa-logo@2x.png' }] });
  await assert.rejects(fetchApodRange('2024-01-01', '2024-01-01', { fetcher }), /placeholder logos/);
});