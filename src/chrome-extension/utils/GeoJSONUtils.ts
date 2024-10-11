import { FeatureCollection, Geometry } from 'geojson';

export function convertToGeoJSON(fetchedPolygons: any[]): FeatureCollection {
  const features = fetchedPolygons.map((polygonData) => {

    const geometryType: 'Polygon' | 'MultiPolygon' = Array.isArray(polygonData.coordinates[0][0]) ? 'MultiPolygon' : 'Polygon';

    return {
      type: 'Feature' as const,
      properties: {
        area: polygonData.AREA,
        description: polygonData.DESCRIP,
        localAuthority: polygonData.LA_NAME,
        riverOrSea: polygonData.RIVER_SEA,
        targetAreaName: polygonData.TA_NAME
      },
      geometry: {
        type: geometryType,
        coordinates: polygonData.coordinates
      } as Geometry
    };
  });

  return {
    type: 'FeatureCollection',
    features: features
  };
}
