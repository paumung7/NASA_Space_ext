import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, Compass, Heart, ImageOff, Play, Search, Shuffle, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { FIRST_APOD_DATE, fetchApodRange, shiftDate, todayString, validateRange } from './lib/apod';
import { featuredImages, libraryHighlights } from './lib/nasa-images';

const formatDate = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const entryKey = (entry) => entry.source ? `${entry.source}:${entry.url}` : `APOD:${entry.date}`;

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('space-explorer-favorites') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function Brand() {
  return <a className="brand" href="#top" aria-label="NASA Space Explorer home"><span className="brand-mark"><Sparkles size={20} strokeWidth={1.7} /></span><span className="brand-name">SPACE<span>EXPLORER</span><small>POWERED BY NASA APOD</small></span></a>;
}

function GalleryCard({ entry, favorite, onFavorite, onOpen, index }) {
  const image = entry.media_type === 'image' ? entry.url : entry.thumbnail_url;
  return <article className="gallery-card" style={{ '--card-index': index }}>
    <button className="card-image" onClick={() => onOpen(entry)} aria-label={`View ${entry.title}`}>
      {image ? <img src={image} alt="" loading="lazy" /> : <span className="image-placeholder"><ImageOff size={28} /><span>Preview unavailable</span></span>}
      <span className="card-image-shade" />
      <span className="card-type">{entry.media_type === 'video' ? <><Play size={11} fill="currentColor" /> VIDEO</> : entry.source ? 'NASA IMAGE LIBRARY' : 'APOD COLLECTION'}</span>
      <span className="image-arrow"><ArrowUpRight size={17} /></span>
    </button>
    <div className="card-content">
      <div className="card-meta"><span>{formatDate(entry.date)}</span><span className="meta-line" /><span>{entry.source ? 'NASA IMAGE LIBRARY' : 'APOD'}</span></div>
      <div className="card-title-row"><button className="card-title" onClick={() => onOpen(entry)}>{entry.title}</button><button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={() => onFavorite(entry)} aria-label={favorite ? `Remove ${entry.title} from favorites` : `Add ${entry.title} to favorites`} aria-pressed={favorite} title={favorite ? 'Remove from favorites' : 'Save to favorites'}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></button></div>
      <p>{entry.explanation}</p>
      <button className="card-link" onClick={() => onOpen(entry)}>EXPLORE IMAGE <ArrowRight size={14} /></button>
    </div>
  </article>;
}

function DetailModal({ entry, favorite, onFavorite, onClose }) {
  const closeRef = useRef(null);
  const modalRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = [...modalRef.current.querySelectorAll('button, a[href], iframe')].filter((element) => !element.disabled);
        if (!focusable.length) return;
        if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);

  const isImage = entry.media_type === 'image';
  let videoUrl;
  try {
    const parsed = new URL(entry.url);
    if (parsed.protocol === 'https:' && ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'].includes(parsed.hostname)) videoUrl = parsed.href;
  } catch { videoUrl = null; }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="detail-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close details"><X size={21} /></button>
      <div className="detail-media">{isImage ? <img src={entry.url} alt={entry.title} /> : videoUrl ? <iframe src={videoUrl} title={entry.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <div className="video-fallback"><Play size={32} /><p>Video preview is unavailable.</p><a href={entry.url} target="_blank" rel="noreferrer">Watch original video <ArrowUpRight size={15} /></a></div>}</div>
      <div className="detail-content"><div className="eyebrow"><span className="red-dot" /> {entry.source ? 'NASA IMAGE LIBRARY' : 'ASTRONOMY PICTURE OF THE DAY'} <span className="detail-date">{formatDate(entry.date)}</span></div><h2 id="detail-title">{entry.title}</h2><p className="detail-description">{entry.explanation}</p><div className="detail-credit"><span>IMAGE CREDIT &amp; COPYRIGHT</span><strong>{entry.copyright?.trim() || 'NASA / APOD'}</strong></div><div className="detail-actions">{isImage && entry.hdurl && <a className="primary-button" href={entry.hdurl} target="_blank" rel="noreferrer">View original image <ArrowUpRight size={16} /></a>}<button className="secondary-button" onClick={() => onFavorite(entry)}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Saved to favorites' : 'Save to favorites'}</button></div></div>
    </div>
  </div>;
}

function App() {
  const today = todayString();
  const [start, setStart] = useState(() => shiftDate(today, -6));
  const [end, setEnd] = useState(today);
  const [preset, setPreset] = useState('7');
  const [entries, setEntries] = useState([]);
  const [favorites, setFavorites] = useState(readFavorites);
  const [view, setView] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [activeRange, setActiveRange] = useState({ start: shiftDate(today, -6), end: today });
  const [selected, setSelected] = useState(null);
  const requestRef = useRef(null);

  async function loadRange(rangeStart, rangeEnd) {
    const validation = validateRange(rangeStart, rangeEnd);
    if (validation) { setRangeError(validation); return; }
    setRangeError('');
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    setView('all');
    try {
      const results = await fetchApodRange(rangeStart, rangeEnd, { signal: controller.signal });
      if (!controller.signal.aborted) { setEntries(results); setActiveRange({ start: rangeStart, end: rangeEnd }); }
    } catch (requestError) {
      if (!controller.signal.aborted) { setError(requestError.message); setEntries(libraryHighlights); }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => { loadRange(shiftDate(todayString(), -6), todayString()); return () => requestRef.current?.abort(); }, []);
  useEffect(() => { try { localStorage.setItem('space-explorer-favorites', JSON.stringify(favorites)); } catch {} }, [favorites]);
  useEffect(() => { setPage(0); }, [view, query, sort, entries]);

  function choosePreset(value) {
    setPreset(value);
    setRangeError('');
    if (value !== 'custom') { setStart(shiftDate(today, 1 - Number(value))); setEnd(today); }
  }
  function toggleFavorite(entry) {
    setFavorites((current) => current.some((item) => entryKey(item) === entryKey(entry)) ? current.filter((item) => entryKey(item) !== entryKey(entry)) : [entry, ...current]);
  }
  function discoverRandom() {
    const first = Date.parse(`${FIRST_APOD_DATE}T00:00:00Z`);
    const last = Date.parse(`${today}T00:00:00Z`);
    const randomDate = shiftDate(FIRST_APOD_DATE, Math.floor(Math.random() * ((last - first) / 86400000 + 1)));
    setStart(randomDate); setEnd(randomDate); setPreset('custom'); setQuery('');
    loadRange(randomDate, randomDate);
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
  }
  const visibleEntries = (view === 'favorites' ? favorites : entries)
    .filter((entry) => entry.title?.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => sort === 'newest' ? second.date.localeCompare(first.date) : first.date.localeCompare(second.date));
  const pageCount = Math.ceil(visibleEntries.length / 9);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const pageEntries = visibleEntries.slice(currentPage * 9, currentPage * 9 + 9);
  const isFavorite = (entry) => favorites.some((item) => entryKey(item) === entryKey(entry));

  return <div id="top" className="app-shell">
    <header className="site-header"><div className="header-inner"><Brand /><nav aria-label="Main navigation"><a className="nav-link active" href="#gallery">Explore</a><button className="nav-link" onClick={() => { setView('favorites'); document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }); }}>Favorites <span className="nav-count">{favorites.length}</span></button><a className="nav-link nav-about" href="https://apod.nasa.gov/apod/astropix.html" target="_blank" rel="noreferrer">About APOD <ArrowUpRight size={13} /></a></nav><a className="header-nasa" href="https://www.nasa.gov/" target="_blank" rel="noreferrer">NASA.GOV <ArrowUpRight size={14} /></a></div></header>

    <main>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-image" /><div className="hero-overlay" /><div className="hero-inner"><div className="hero-copy"><div className="eyebrow hero-eyebrow"><span className="red-dot" /> YOUR WINDOW TO THE COSMOS <span className="eyebrow-line" /> EST. 1995</div><h1 id="hero-title">Explore the Universe,<br /><em>One Day at a Time.</em></h1><p>Somewhere, something incredible is waiting to be discovered. Explore the cosmos through NASA's Astronomy Picture of the Day.</p><div className="hero-actions"><a className="primary-button" href="#explore">Start exploring <ArrowRight size={17} /></a><button className="hero-random" onClick={discoverRandom}><Shuffle size={16} /> Surprise me</button></div></div><div className="hero-bottom"><span><span className="red-dot" /> A NEW PERSPECTIVE, EVERY DAY</span><a href="#explore">SCROLL TO EXPLORE <ArrowDown size={14} /></a></div></div><div className="hero-side-label">THE UNIVERSE IS YOURS TO DISCOVER <span>01 / 01</span></div></section>

      <section className="featured-section" aria-labelledby="featured-title"><div className="content-wrap"><div className="featured-heading"><div><div className="eyebrow"><span className="red-dot" /> A CLOSER LOOK</div><h2 id="featured-title">A universe of perspectives.</h2></div><a href="https://images.nasa.gov/" target="_blank" rel="noreferrer">NASA IMAGE LIBRARY <ArrowUpRight size={15} /></a></div><div className="featured-grid">{featuredImages.map((image) => <a className="featured-card" key={image.id} href={`https://images.nasa.gov/details/${image.id}`} target="_blank" rel="noreferrer" aria-label={`${image.title}, view in NASA Image Library`}><img src={image.image} alt="" loading="lazy" /><span className="featured-shade" /><span className="featured-copy"><span className="featured-category">{image.category}</span><strong>{image.title}</strong><span className="featured-credit">{image.credit}</span></span><span className="featured-arrow"><ArrowUpRight size={18} /></span></a>)}</div></div></section>

      <section id="explore" className="explore-section"><div className="content-wrap"><div className="section-intro"><div><div className="eyebrow"><span className="red-dot" /> THE APOD ARCHIVE</div><h2>Discover the extraordinary.</h2><p>Every day, a new window into our universe. Where will you begin?</p></div><div className="archive-note"><Compass size={21} /><span>EXPLORING SINCE<br /><strong>JUNE 16, 1995</strong></span></div></div>

        <form className="range-panel" onSubmit={(event) => { event.preventDefault(); loadRange(start, end); }}><div className="range-heading"><div className="range-icon"><CalendarDays size={20} /></div><div><h3>Choose your time frame</h3><p>Travel through the archive, one day at a time.</p></div></div><div className="range-controls"><div className="preset-group" role="group" aria-label="Date range presets"><button type="button" className={preset === '7' ? 'selected' : ''} onClick={() => choosePreset('7')}>Last 7 days</button><button type="button" className={preset === '30' ? 'selected' : ''} onClick={() => choosePreset('30')}>Last 30 days</button><button type="button" className={preset === 'custom' ? 'selected' : ''} onClick={() => choosePreset('custom')}>Custom</button></div><div className="date-fields"><label><span>FROM</span><input type="date" min={FIRST_APOD_DATE} max={today} value={start} onChange={(event) => { setStart(event.target.value); setPreset('custom'); }} /></label><span className="date-divider">—</span><label><span>TO</span><input type="date" min={FIRST_APOD_DATE} max={today} value={end} onChange={(event) => { setEnd(event.target.value); setPreset('custom'); }} /></label></div><button className="primary-button apply-button" type="submit">Explore <ArrowRight size={16} /></button></div><div className="range-foot"><span>Explore up to 90 days at a time.</span>{rangeError && <span className="form-error" role="alert">{rangeError}</span>}</div></form>

        <div id="gallery" className="gallery-section"><div className="gallery-heading"><div><div className="eyebrow"><span className="red-dot" /> {view === 'favorites' ? 'YOUR PERSONAL COLLECTION' : 'WONDERS OF THE UNIVERSE'}</div><h2>{view === 'favorites' ? 'Saved discoveries' : 'The latest discoveries'} <span className="result-count">{visibleEntries.length}</span></h2><p>{view === 'favorites' ? 'A little corner of the universe, saved for later.' : `${formatDate(activeRange.start)} — ${formatDate(activeRange.end)}`}</p></div><div className="gallery-tools"><div className="view-toggle" role="group" aria-label="Gallery view"><button className={view === 'all' ? 'selected' : ''} onClick={() => setView('all')}>All images</button><button className={view === 'favorites' ? 'selected' : ''} onClick={() => setView('favorites')}><Heart size={15} /> Saved <span>{favorites.length}</span></button></div><label className="search-box"><Search size={16} /><span className="sr-only">Search image titles</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the cosmos" /></label><label className="sort-box"><ArrowDownUp size={15} /><span className="sr-only">Sort by date</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select><ChevronDown size={14} /></label></div></div>
          {error && view === 'all' && !loading && <div className="gallery-notice" role="status"><div><strong>Showing NASA Image Library highlights</strong><p>{error} These images are not filtered by the selected dates.</p></div><button className="secondary-button" onClick={() => loadRange(start, end)}>Retry APOD</button></div>}
          {loading && view === 'all' ? <div className="gallery-grid" aria-label="Loading discoveries" aria-busy="true">{Array.from({ length: 9 }, (_, index) => <div className="skeleton-card" key={index}><div /><span /><span /></div>)}</div> : visibleEntries.length ? <div className="gallery-grid">{pageEntries.map((entry, index) => <GalleryCard key={entryKey(entry)} entry={entry} favorite={isFavorite(entry)} onFavorite={toggleFavorite} onOpen={setSelected} index={index} />)}</div> : <div className="empty-state"><SlidersHorizontal size={27} /><h3>{query ? 'No matching discoveries.' : view === 'favorites' ? 'Your collection starts here.' : 'No discoveries found.'}</h3><p>{query ? 'Try another search term.' : view === 'favorites' ? 'Save an image to keep it close.' : 'Try another date range.'}</p>{view === 'favorites' && <button className="secondary-button" onClick={() => setView('all')}>Explore the archive <ArrowRight size={15} /></button>}</div>}
          {!(loading && view === 'all') && pageCount > 1 && <nav className="pagination" aria-label="Discovery pages"><button className="secondary-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} of {pageCount}</span><button className="secondary-button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
          {!loading && !error && view === 'all' && visibleEntries.length > 0 && currentPage === pageCount - 1 && <div className="end-note"><span /><Sparkles size={15} /><p>YOU'VE REACHED THE END OF THIS SLICE OF THE UNIVERSE</p><span /></div>}
        </div></div></section>
    </main>
    <footer><div className="content-wrap footer-inner"><div><Brand /><p>Curiosity is our favorite destination.</p></div><div className="footer-right"><p>Imagery and data provided by NASA's Astronomy Picture of the Day.</p><div><a href="https://apod.nasa.gov/apod/" target="_blank" rel="noreferrer">NASA APOD <ArrowUpRight size={13} /></a><a href="https://api.nasa.gov/" target="_blank" rel="noreferrer">NASA API <ArrowUpRight size={13} /></a><a href="https://www.nasa.gov/about/highlights/HP_Privacy.html" target="_blank" rel="noreferrer">Privacy <ArrowUpRight size={13} /></a></div><small>AN INDEPENDENT PROJECT · NOT AFFILIATED WITH NASA</small></div></div></footer>
    {selected && <DetailModal entry={selected} favorite={isFavorite(selected)} onFavorite={toggleFavorite} onClose={() => setSelected(null)} />}
  </div>;
}

export default App;