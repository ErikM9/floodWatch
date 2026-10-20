export type GeocodingLocation = {
  latitude: number;
  longitude: number;
};

export type AddressLookup =
  | ({ status: 'found' } & GeocodingLocation)
  | { status: 'not-found' | 'outside-england' | 'failed' };

export interface NominatimPlace {
  lat: string;
  lon: string;
  address?: Record<string, string>;
}