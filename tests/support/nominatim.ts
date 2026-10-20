export const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface PlaceFixture {
  name: string;
  type: string;
  lat: string;
  lon: string;
  displayName: string;
  address: Record<string, string>;
}

const england = { state: 'England', 'ISO3166-2-lvl4': 'GB-ENG' };
const wales = { state: 'Wales', 'ISO3166-2-lvl4': 'GB-WLS' };
const unitedKingdom = { country: 'United Kingdom', country_code: 'gb' };

/* Listed in the order Nominatim ranks them, so the Welsh Newport comes before the one on the Isle of Wight */
const places: PlaceFixture[] = [
  {
    name: 'York',
    type: 'city',
    lat: '53.9590555',
    lon: '-1.0815361',
    displayName: 'York, England, United Kingdom',
    address: { city: 'York', ...england, ...unitedKingdom },
  },
  {
    name: 'Tewkesbury',
    type: 'town',
    lat: '51.9925',
    lon: '-2.1601',
    displayName: 'Tewkesbury, Gloucestershire, England, United Kingdom',
    address: {
      town: 'Tewkesbury',
      county: 'Gloucestershire',
      ...england,
      ...unitedKingdom,
    },
  },
  {
    name: 'Leeds',
    type: 'city',
    lat: '53.7974185',
    lon: '-1.5437941',
    displayName: 'Leeds, West Yorkshire, England, United Kingdom',
    address: {
      city: 'Leeds',
      county: 'West Yorkshire',
      ...england,
      ...unitedKingdom,
    },
  },
  {
    name: 'Cardiff',
    type: 'city',
    lat: '51.4816546',
    lon: '-3.1791934',
    displayName: 'Cardiff, Wales, CF10 1EP, United Kingdom',
    address: { city: 'Cardiff', ...wales, ...unitedKingdom },
  },
  {
    name: 'Newport',
    type: 'city',
    lat: '51.5882332',
    lon: '-2.9974967',
    displayName: 'Newport, Wales, United Kingdom',
    address: { city: 'Newport', ...wales, ...unitedKingdom },
  },
  {
    name: 'Newport',
    type: 'town',
    lat: '50.7006345',
    lon: '-1.2938823',
    displayName: 'Newport, Isle of Wight, England, PO30 1UD, United Kingdom',
    address: {
      town: 'Newport',
      county: 'Isle of Wight',
      ...england,
      ...unitedKingdom,
    },
  },
];

/* Answers a search the way Nominatim's JSON format does, honouring its limit, country and address details parameters */
export function searchPlaces(url: URL) {
  const query = (url.searchParams.get('q') ?? '').toLowerCase();
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const countries = url.searchParams.get('countrycodes')?.split(',');
  const withAddress = url.searchParams.get('addressdetails') === '1';

  return places
    .filter((place) => query.includes(place.name.toLowerCase()))
    .filter(
      (place) => !countries || countries.includes(place.address.country_code),
    )
    .slice(0, limit)
    .map((place, index) => ({
      place_id: 100000 + index,
      licence:
        'Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright',
      osm_type: 'relation',
      osm_id: 20000 + index,
      lat: place.lat,
      lon: place.lon,
      class: 'place',
      type: place.type,
      place_rank: place.type === 'city' ? 16 : 18,
      importance: 0.7 - index / 100,
      addresstype: place.type,
      name: place.name,
      display_name: place.displayName,
      ...(withAddress && { address: place.address }),
      boundingbox: [
        String(Number(place.lat) - 0.1),
        String(Number(place.lat) + 0.1),
        String(Number(place.lon) - 0.1),
        String(Number(place.lon) + 0.1),
      ],
    }));
}