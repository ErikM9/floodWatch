import { GeocodingLocation } from '@/types/geocoding';

export async function userAddress(
  address: string,
): Promise<GeocodingLocation | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=gb`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Could not fetch geocoding data: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } else {
      console.warn('No results found for the given address');
      return null;
    }
  } catch (error) {
    console.error('Geocoding error: ', error);
    return null;
  }
}
