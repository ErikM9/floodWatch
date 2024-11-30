import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { getFloodWarningsFromDB } from '../background';
import { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import { FloodWithPolygonData } from '@/types/floodDataService';

let listenerAdded = false;

export function getAndLogFloodData(
  callback: (floodData: FloodWithPolygonData[]) => void
): void {
  getFloodWarningsFromDB()
    .then((floodData) => {
      callback(floodData);
    })
    .catch((error) => {
      console.error('Error fetching flood data from IndexedDB', error);
      callback([]);
    });

  if (!listenerAdded) {
    setInterval(() => {
      getFloodWarningsFromDB()
        .then((updatedFloodData) => {
          console.log(
            'Updated flood data detected in service IndexedDB',
            updatedFloodData
          );
          callback(updatedFloodData);

          if (updatedFloodData.length > 0) {
            isUserFlooded(updatedFloodData);
          }
        })
        .catch((error) => {
          console.error(
            'Error fetching updated flood data from IndexedDB',
            error
          );
        });
    }, 900000); // 15min interval
    listenerAdded = true;
  }
}

export function logPolygonsFromFloodWarnings(): Promise<
  FloodWithPolygonData[]
> {
  const allFloodData: FloodWithPolygonData[] = [];
  console.log('allFloodData:', allFloodData);

  return new Promise((resolve) => {
    getAndLogFloodData((floodData) => {
      allFloodData.length = 0;

      floodData.forEach((flood) => {
        const {
          id,
          description,
          county,
          severity,
          severityLevel,
          message,
          polygonData,
          riverOrSea,
          timeMessageChanged
        } = flood;

        allFloodData.push({
          id,
          description,
          county,
          severity,
          severityLevel,
          message,
          polygonData,
          riverOrSea,
          timeMessageChanged
        });
      });

      resolve(allFloodData);
    });
  });
}

let isUserFloodedCallCount = 0;

export const isUserFlooded = async (floodData: FloodWithPolygonData[]) => {
  isUserFloodedCallCount++;
  console.log(`isUserFlooded called: ${isUserFloodedCallCount} times`);

  const result = await chrome.storage.local.get(['userLocation']);
  const savedLocation = result.userLocation;

  if (!savedLocation || savedLocation.length !== 2) {
    console.error('Invalid user location in Chrome storage:', savedLocation);
    return;
  }

  const userLocation = point([savedLocation[1], savedLocation[0]]);
  console.log('User location in service:', userLocation);
  console.log('Flood data inside isUserFlooded:', floodData);

  let isFlooded = false;
  let floodedPolygonData: FloodWithPolygonData | null = null;

  for (const flood of floodData) {
    for (const polygonData of flood.polygonData) {
      const geometry = polygonData.geometry;

      if (geometry.type === 'Polygon') {
        const polygonCoordinates = geometry.coordinates as number[][][];

        if (
          booleanPointInPolygon(userLocation, {
            type: 'Polygon',
            coordinates: polygonCoordinates
          })
        ) {
          isFlooded = true;
          floodedPolygonData = flood;
          break;
        }
      } else if (geometry.type === 'MultiPolygon') {
        const multiPolygonCoordinates = geometry.coordinates as number[][][][];

        for (const polygon of multiPolygonCoordinates) {
          if (
            booleanPointInPolygon(userLocation, {
              type: 'Polygon',
              coordinates: polygon
            })
          ) {
            isFlooded = true;
            floodedPolygonData = flood;
            break;
          }
        }
      }
      if (isFlooded) break;
    }
    if (isFlooded) break;
  }

  if (isFlooded && floodedPolygonData) {
    console.log('severity level:', floodedPolygonData);
    return { isFlooded: true, floodedPolygonData };
  } else {
    console.log('The user is safe');
    return { isFlooded: false, floodedPolygonData: null };
  }
};

getAndLogFloodData((floodData) => {
  MapPolygon(floodData);
});

export const MapPolygon = (
  floodData: FloodWithPolygonData[]
): FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: floodData
      .map((data): Feature => {
        const geometry = data.polygonData[0].geometry;

        if (geometry.type === 'Polygon') {
          return {
            type: 'Feature',
            properties: {
              severityLevel: data.severityLevel
            },
            geometry: geometry as Polygon
          };
        } else if (geometry.type === 'MultiPolygon') {
          return {
            type: 'Feature',
            properties: {
              severityLevel: data.severityLevel
            },
            geometry: geometry as MultiPolygon
          };
        } else {
          throw new Error(`unsupported geometry type: ${geometry.type}`);
        }
      })
      .filter((feature) => feature !== undefined)
  };
};
