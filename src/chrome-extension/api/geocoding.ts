import { AddressLookup, NominatimPlace } from '@/types/geocoding';

/* Picks the first match in England, as the Environment Agency only issues warnings for England */
export async function userAddress(address: string): Promise<AddressLookup> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5&countrycodes=gb&addressdetails=1`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { status: 'failed' };
    }

    const places: NominatimPlace[] = await response.json();
    const place = places.find(
      (match) => match.address?.['ISO3166-2-lvl4'] === 'GB-ENG',
    );

    if (!place) {
      return { status: places.length ? 'outside-england' : 'not-found' };
    }

    return {
      status: 'found',
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    };
  } catch {
    return { status: 'failed' };
  }
}