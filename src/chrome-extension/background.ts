// import { LatLngTuple, polygon as LPolygon } from 'leaflet';

// const FLOOD_API_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floods';

// // Fetch flood data from the API
// async function getFloodData(): Promise<any[]> {
//   try {
//     const response = await fetch(FLOOD_API_URL);
//     if (!response.ok) {
//       console.error('Error fetching flood data:', response.statusText);
//       return [];
//     }
//     const data = await response.json();
//     return data.items;
//   } catch (error) {
//     console.error('Error fetching flood data:', error);
//     return [];
//   }
// }

// // Get flood area location using Leaflet for polygon
// async function getFloodAreaLocation(polygonUrl: string): Promise<[number, number] | null> {
//   try {
//     const response = await fetch(polygonUrl);
//     if (!response.ok) {
//       throw new Error(`Failed to fetch polygon data: ${response.statusText}`);
//     }

//     const geoJsonData = await response.json();

//     if (geoJsonData.features && geoJsonData.features.length > 0) {
//       const geometry = geoJsonData.features[0].geometry;

//       if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
//         const latLngs: LatLngTuple[][] = geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);

//         // Create a Leaflet polygon
//         const leafletPolygon = LPolygon(latLngs);

//         // Calculate the centroid using the Leaflet polygon bounds
//         const bounds = leafletPolygon.getBounds();
//         const center = bounds.getCenter();
//         return [center.lng, center.lat];
//       } else {
//         throw new Error('Unexpected geometry type');
//       }
//     } else {
//       throw new Error('No valid features or coordinates found in polygon data');
//     }
//   } catch (error) {
//     console.error('Error fetching or processing polygon data:', error);
//     return null;
//   }
// }


// // Check for local floods using polygons or proximity
// async function checkForFloods(userLocation: { lat: number; lon: number }): Promise<void> {
//   try {
//     const floodEvents = await getFloodData();
//     const localFloods = [];

//     for (const flood of floodEvents) {
//       const { floodArea, timeRaised } = flood;

//       // Skip floods that are not recent
//       if (timeRaised && !isRecentFlood(timeRaised)) {
//         continue;
//       }

//       // Check for polygon data
//       if (floodArea && floodArea.polygon) {
//         const centroidCoordinates = await getFloodAreaLocation(floodArea.polygon);
//         if (centroidCoordinates) {
//           const [floodLon, floodLat] = centroidCoordinates;
//           if (isNearby(userLocation.lat, userLocation.lon, floodLat, floodLon)) {
//             localFloods.push(flood);
//           }
//         }
//       } else if (floodArea && floodArea.lat && floodArea.lon) {
//         const floodLat = parseFloat(floodArea.lat);
//         const floodLon = parseFloat(floodArea.lon);

//         if (!isNaN(floodLat) && !isNaN(floodLon) && isNearby(userLocation.lat, userLocation.lon, floodLat, floodLon)) {
//           localFloods.push(flood);
//         }
//       }
//     }

//     if (localFloods.length > 0) {
//       floodNotifs(localFloods);
//     }
//   } catch (error) {
//     console.error("Error checking for floods:", error);
//   }
// }

// // Check if a point is nearby
// function isNearby(userLat: number, userLon: number, floodLat: number, floodLon: number, radius = 50): boolean {
//   const distance = calculateDistance(userLat, userLon, floodLat, floodLon);
//   return distance <= radius; // Within the specified radius
// }

// // Calculate distance between two lat/lon points (in km)
// function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   const R = 6371; // Earth radius in km
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in km
// }

// function deg2rad(deg: number): number {
//   return deg * (Math.PI / 180);
// }

// // Check if the flood event is recent
// function isRecentFlood(timeRaised: string): boolean {
//   const eventTime = new Date(timeRaised);
//   const currentTime = new Date();
//   const diffHours = Math.abs(currentTime.getTime() - eventTime.getTime()) / 36e5;
//   return diffHours <= 24; // Consider recent if within 24 hours
// }

// // Show detailed flood notification
// function floodNotifs(floods: any[]): void {
//   floods.forEach(flood => {
//     const floodTitle = flood.description || 'Unknown flood event';
//     const floodMessage = flood.message || 'No detailed message available';
//     const floodSeverity = flood.severity || 'Unknown severity';
//     const floodSeverityLevel = flood.severityLevel || 0;
//     const floodArea = flood.floodArea?.county || 'Unknown area';
//     const riverOrSea = flood.floodArea?.riverOrSea || 'Unknown water source';

//     let iconUrl = 'icons/flood-icon.png';
//     if (floodSeverityLevel === 2) {
//       iconUrl = 'icons/moderate-flood-icon.png';
//     } else if (floodSeverityLevel === 1) {
//       iconUrl = 'icons/severe-flood-icon.png';
//     }

//     let notifPriority = 0;
//     if (floodSeverityLevel === 2) {
//       notifPriority = 1;
//     } else if (floodSeverityLevel === 1) {
//       notifPriority = 2;
//     }

//     chrome.notifications.create({
//       type: 'basic',
//       iconUrl: iconUrl,
//       title: `Flood Alert: ${floodTitle}`,
//       message: `Area: ${floodArea}\nSeverity: ${floodSeverity}\nRiver/Sea: ${riverOrSea}\n\nDetails: ${floodMessage}`,
//       priority: notifPriority,
//     });
//   });
// }

// // Listen for user location messages from the popup
// chrome.runtime.onMessage.addListener((message) => {
//   if (message.type === 'userLocation') {
//     const { lat, lon } = message;
//     const userLocation = { lat: parseFloat(lat), lon: parseFloat(lon) };

//     chrome.storage.local.set({ userLocation }, () => {
//       checkForFloods(userLocation); // Check for floods after saving location
//     });
//   }
// });

// // Periodically check for floods
// chrome.alarms.create('checkFloods', { periodInMinutes: 1 });

// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'checkFloods') {
//     chrome.storage.local.get(['userLocation'], (result) => {
//       const userLocation = result.userLocation;
//       if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lon === 'number') {
//         checkForFloods(userLocation);
//       }
//     });
//   }
// });

// export { };
const FLOOD_API_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floods';

// Fetch flood data from the API
async function getFloodData(): Promise<any[]> {
  try {
    const response = await fetch(FLOOD_API_URL);
    console.log("response from background:", response)
    if (!response.ok) {
      console.error('Error fetching flood data:', response.statusText);
      return [];
    }
    const data = await response.json();
    return data.items.map((event: any) => ({
      id: event.floodAreaID,
      description: event.description,
      polygonUrl: event.floodArea.polygon,
      severity: event.severity,
      severityLevel: event.severityLevel,
    }));
  } catch (error) {
    console.error('Error fetching flood data:', error);
    return [];
  }
}

// Chrome message listener to fetch flood data
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message.type === 'fetchFloodData') {
    const floodEvents = await getFloodData();
    chrome.storage.local.set({ floodData: floodEvents });
    sendResponse(floodEvents);
  }
  return true;
});

// Periodically check for floods
chrome.alarms.create('checkFloods', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFloods') {
    const floodEvents = await getFloodData();
    chrome.storage.local.set({ floodData: floodEvents });
  }
});