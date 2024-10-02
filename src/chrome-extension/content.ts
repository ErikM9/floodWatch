import { LatLngTuple } from 'leaflet';

console.log("Content script loaded");

chrome.runtime.sendMessage({ type: 'fetchFloodData' }, (floodData: any[]) => {
  console.log("received flood data:", floodData);
  if (floodData.length > 0) {
    const polygons = floodData.map(async (flood) => {
      if (flood.polygonUrl) {
        const response = await fetch(flood.polygonUrl);
        console.log("response:", response);
        const geoJsonData = await response.json();
        console.log("geodata:", geoJsonData)
        if (geoJsonData.features && geoJsonData.features.length > 0) {
          const geometry = geoJsonData.features[0].geometry;
          if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            const latLngs: LatLngTuple[][] = geometry.coordinates[0].map(
              (coord: [number, number]) => [coord[1], coord[0]]
            );
            return { id: flood.id, latLngs };
          }
        }
      }
    });

    Promise.all(polygons).then((polygonData) => {
      // Send polygons to Map.tsx via messaging
      chrome.runtime.sendMessage({ type: 'polygonData', polygons: polygonData });
    });
  }
});
