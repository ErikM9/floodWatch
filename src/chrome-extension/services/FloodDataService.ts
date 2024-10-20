import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { point } from '@turf/helpers';
import { getFloodWarningsFromDB } from '../background2';
import { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';


interface PolygonData {
  area: string;
  description: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface PolygonDataTwo {
  area: string;
  description: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface FloodWarning {
  id: string;
  description: string;
  county: string;
  severity: string;
  severityLevel: number;
  message: string;
  polygonData: PolygonDataTwo[];
  riverOrSea: string;
  timeMessageChanged: string;
}

interface FloodWithPolygonData {
  id: string;
  description: string;
  county: string;
  severity: string;
  severityLevel: number;
  message: string;
  polygonData: PolygonData[];
  riverOrSea: string;
  timeMessageChanged: string;
}

let listenerAdded = false;

export function getAndLogFloodData(callback: (floodData: FloodWarning[]) => void): void {
  console.log("getAndLogFloodData invoked");

  getFloodWarningsFromDB()
    .then((floodData) => {
      console.log('floodData from service IndexedDB T', floodData);

      // const geoJsonData = MapPolygon(floodData);

      // console.log('GeoJSON Data:', geoJsonData); // Log processed GeoJSON data



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
          console.log('Updated flood data detected in service IndexedDB', updatedFloodData);
          callback(updatedFloodData);

          if (updatedFloodData.length > 0) {
            isUserFlooded(updatedFloodData);
          }
        })
        .catch((error) => {
          console.error('Error fetching updated flood data from IndexedDB', error);
        });
    }, 900000); // 15min interval
    listenerAdded = true;
  }
}


export function logPolygonsFromFloodWarnings(): Promise<any[]> {
  const allFloodData: any[] = [];
  console.log('allFloodData:', allFloodData)

  return new Promise((resolve) => {
    getAndLogFloodData((floodData) => {
      allFloodData.length = 0;
      // TODO make sure that floodData is an array
      console.log('floodData in service of XXXX', floodData)
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
          timeMessageChanged,
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
          timeMessageChanged,
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

        if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygonCoordinates })) {
          isFlooded = true;
          floodedPolygonData = flood;
          break;
        }
      } else if (geometry.type === 'MultiPolygon') {
        const multiPolygonCoordinates = geometry.coordinates as number[][][][];

        for (const polygon of multiPolygonCoordinates) {
          if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygon })) {
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
    console.log(floodedPolygonData.message);
  } else {
    console.log('The user is safe');
  }
};

getAndLogFloodData((floodData) => {
  MapPolygon(floodData);
});


export const MapPolygon = (floodData: FloodWarning[]): FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: floodData.map((data): Feature => {
      const geometry = data.polygonData[0].geometry;

      if (geometry.type === 'Polygon') {
        return {
          type: 'Feature',
          properties: {
            severityLevel: data.severityLevel,
          },
          geometry: geometry as Polygon,
        };
      } else if (geometry.type === 'MultiPolygon') {
        return {
          type: 'Feature',
          properties: {
            severityLevel: data.severityLevel,
          },
          geometry: geometry as MultiPolygon,
        };
      } else {
        throw new Error(`unsupported geometry type: ${geometry.type}`);
      }
    }).filter(feature => feature !== undefined),
  };
};