export const FIRST_APOD_DATE = '1995-06-16';
export const MAX_RANGE_DAYS = 90;
const CHUNK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function shiftDate(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function validateRange(start, end, today = todayString()) {
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return 'Choose a valid start and end date.';
  }
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || new Date(startTime).toISOString().slice(0, 10) !== start || new Date(endTime).toISOString().slice(0, 10) !== end) {
    return 'Choose a valid start and end date.';
  }
  if (start < FIRST_APOD_DATE) return 'The APOD archive begins on June 16, 1995.';
  if (end > today || start > today) return 'Future dates are not available yet.';
  if (start > end) return 'The start date must be before the end date.';
  if ((endTime - startTime) / DAY_MS + 1 > MAX_RANGE_DAYS) return `Choose a range of ${MAX_RANGE_DAYS} days or less.`;
  return '';
}

export async function fetchApodRange(start, end, { signal, fetcher = fetch } = {}) {
  const error = validateRange(start, end);
  if (error) throw new Error(error);

  const endpoint = import.meta.env?.VITE_APOD_PROXY_URL || 'https://api.nasa.gov/planetary/apod';
  const apiKey = import.meta.env?.VITE_NASA_API_KEY || 'DEMO_KEY';
  const entries = [];

  for (let cursor = start; cursor <= end;) {
    const lastChunkDate = shiftDate(cursor, CHUNK_DAYS - 1);
    const chunkEnd = lastChunkDate < end ? lastChunkDate : end;
    const url = new URL(endpoint, globalThis.location?.origin || 'http://localhost');
    url.searchParams.set('start_date', cursor);
    url.searchParams.set('end_date', chunkEnd);
    url.searchParams.set('thumbs', 'true');
    if (!import.meta.env?.VITE_APOD_PROXY_URL) url.searchParams.set('api_key', apiKey);

    let response;
    try {
      response = await fetcher(url.toString(), { signal });
    } catch (requestError) {
      if (requestError.name === 'AbortError') throw requestError;
      throw new Error('Could not reach NASA. Check your connection and try again.');
    }
    if (!response.ok) {
      if (response.status === 429 || response.status === 403) throw new Error('NASA’s API limit may have been reached. Try again later or configure your own API key.');
      throw new Error(`NASA could not complete this request (${response.status}). Please try again.`);
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('NASA returned an unexpected response. Please try again.');
    }
    if (!Array.isArray(data)) throw new Error('NASA returned an unexpected response. Please try again.');
    if (data.some((entry) => entry.title === 'NASA Science' && entry.url?.includes('/nasa-logo'))) {
      throw new Error('NASA APOD is currently returning placeholder logos instead of images.');
    }
    entries.push(...data);
    cursor = shiftDate(chunkEnd, 1);
  }
  return entries;
}