const imageUrl = (id, size = 'orig') => `https://images-assets.nasa.gov/image/${id}/${id}~${size}.jpg`;

export const featuredImages = [
  { title: 'The Cosmic Cliffs', category: 'STAR-FORMING NEBULA', credit: 'NASA, ESA, CSA, STScI', id: 'carina_nebula', size: 'medium' },
  { title: 'Our Blue Marble', category: 'PLANET EARTH', credit: 'NASA / NOAA / GSFC / Suomi NPP', id: 'GSFC_20171208_Archive_e001386', size: 'medium' },
  { title: 'The Eagle Nebula', category: 'DEEP SPACE', credit: 'NASA / JPL-Caltech', id: 'PIA25433', size: 'medium' },
  { title: 'The Orion Nebula', category: 'STELLAR NURSERY', credit: 'ESA / NASA / JPL-Caltech', id: 'PIA25434', size: 'medium' },
  { title: 'The Andromeda Galaxy', category: 'NEIGHBORING GALAXY', credit: 'NASA / JPL / Caltech', id: 'PIA04921', size: 'medium' },
  { title: 'The Sombrero Galaxy', category: 'DISTANT GALAXY', credit: 'NASA / JPL-Caltech', id: 'PIA15426' },
  { title: 'The Crab Nebula', category: 'SUPERNOVA REMNANT', credit: 'NASA / ESA', id: 'GSFC_20171208_Archive_e002159', size: 'medium' },
  { title: 'Solar Flares', category: 'OUR SUN', credit: 'NASA / GSFC / Solar Dynamics Observatory', id: 'PIA17912' },
  { title: 'Mount Sharp on Mars', category: 'THE RED PLANET', credit: 'NASA / JPL-Caltech / ESA / DLR / FU Berlin / MSSS', id: 'PIA15293', size: 'medium' },
].map(({ size, ...image }) => ({ ...image, image: imageUrl(image.id, size) }));

export const libraryHighlights = [
  { id: 'PIA21775', size: 'medium', date: '2017-07-27', title: "Jupiter's Great Red Spot in True Color", copyright: 'Björn Jónsson (CC-NC-SA), NASA / JPL-Caltech / SwRI / MSSS', explanation: 'Citizen scientist Björn Jónsson created this natural-color view of Jupiter’s Great Red Spot using images captured by NASA’s Juno spacecraft during its close flyby on July 10, 2017.' },
  { id: 'PIA17172', size: 'medium', date: '2013-11-12', title: 'The Day the Earth Smiled', copyright: 'NASA / JPL-Caltech / SSI', explanation: 'NASA’s Cassini spacecraft captured this panoramic mosaic of Saturn and its rings while the planet eclipsed the Sun. Earth appears as a pale blue dot in the background.' },
  { id: 'PIA12235', size: 'medium', date: '2009-09-24', title: 'Nearside of the Moon', copyright: 'ISRO / NASA / JPL-Caltech / Brown University', explanation: 'A view of the Moon’s near side from the Chandrayaan-1 mission, shared by NASA’s Image and Video Library.' },
  { id: 'PIA02210', date: '1999-08-19', title: 'Neptune from Voyager 2', copyright: 'NASA / JPL', explanation: 'Voyager 2 captured this contrast-enhanced view of Neptune on August 14, 1989, as the spacecraft approached the distant planet.' },
  { id: 'PIA09246', date: '2007-04-02', title: 'Jupiter’s Moon Europa', copyright: 'NASA / Johns Hopkins APL / Southwest Research Institute', explanation: 'A view of Europa, Jupiter’s icy moon, from NASA’s Image and Video Library.' },
  { id: 'PIA20199', size: 'medium', date: '2015-12-05', title: 'Pluto’s Icy Badlands', copyright: 'NASA / Johns Hopkins APL / Southwest Research Institute', explanation: 'NASA’s New Horizons spacecraft revealed rugged terrain sculpted by erosion and faulting in Pluto’s icy crust.' },
  { id: 'PIA18326', date: '2015-07-13', title: 'Titan and Saturn', copyright: 'NASA / JPL-Caltech / Space Science Institute', explanation: 'Saturn’s largest moon, Titan, appears small beside its parent planet in this view from NASA’s Cassini mission.' },
  { id: 'PIA01391', date: '1999-01-08', title: 'A Sliver of Uranus', copyright: 'NASA / JPL', explanation: 'A crescent of Uranus seen by Voyager 2, using three color filters combined to produce this image.' },
  { id: 'PIA16908', date: '2013-03-29', title: 'Mercury, Mercury!', copyright: 'NASA / Johns Hopkins APL / Carnegie Institution of Washington', explanation: 'A view of Mercury from NASA’s MESSENGER mission, shared by NASA’s Image and Video Library.' },
].map(({ id, size, ...entry }) => ({
  ...entry,
  media_type: 'image',
  source: 'NASA Image Library',
  url: imageUrl(id, size),
  hdurl: imageUrl(id),
}));