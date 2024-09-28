import * as turf from '@turf/turf';

const FLOOD_API_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floods';

// user geolocation
function getLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['lat', 'lon'], (result) => {
      if (result.lat && result.lon) {
        console.log('Location found in storage', result);
        resolve({ lat: result.lat, lon: result.lon })
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            console.log('location retrieved from geolocation:', { lat, lon })

            chrome.storage.local.set({ lat, lon }, () => {
              console.log('Location saved in storage:', { lat, lon });
            })
            resolve({ lat, lon });
          },
          (error) => {
            console.error('Error fetching geolocation:', error);
            reject('Unable to access your location.');
          }
        );
      }
    })
  });
}

// fetch polygon data from flood area if available
async function fetchPolygonData(polygonUrl: string): Promise<any> {
  try {
    const response = await fetch(polygonUrl);
    if (response.ok) {
      const polygonData = await response.json(); // assuming GeoJSON
      if (polygonData && polygonData.features) {
        return polygonData;
      } else {
        console.warn('Invalid polygon data format received');
      }
    }
  } catch (error) {
    console.error('Error fetching polygon data:', error);
  }
  return null; // return null if the fetch failed or data is invalid
}

// fetch flood data from the API
async function getFloodData() {
  try {
    const response = await fetch(FLOOD_API_URL);
    if (!response.ok) {
      console.error('Error fetching flood data:', response.statusText);
      return [];
    }
    const data = await response.json();
    return data.items; // list of flood events
  } catch (error) {
    console.error('Error fetching flood data:', error);
    return [];
  }
}

// check for local floods using polygons or proximity
async function checkForFloods() {
  try {
    const userLocation = await getLocation();
    const floodEvents = await getFloodData();

    const localFloods = [];

    // iterate over flood events and check if any are near the user
    for (const flood of floodEvents) {
      const { floodArea, timeRaised } = flood;

      // filter out the outdated flood events by checking the timeRaised
      if (timeRaised && !isRecentFlood(timeRaised)) {
        continue; // skip floods that are not recent
      }

      // fetch polygon data (if it exists) and check if user is inside the polygon
      if (floodArea && floodArea.polygon) {
        const polygonData = await fetchPolygonData(floodArea.polygon);

        if (polygonData && isWithinPolygon(userLocation, polygonData)) {
          localFloods.push(flood);
        }
      }
      // fallback to proximity check based on lat/lon
      else if (floodArea && floodArea.lat && floodArea.lon && isNearby(userLocation.lat, userLocation.lon, floodArea.lat, floodArea.lon)) {
        localFloods.push(flood);
      }
    }

    // notify the user if there are floods near them
    if (localFloods.length > 0) {
      floodNotifs(localFloods);
    }
  } catch (error) {
    console.error('Error checking for floods:', error);
  }
}

// check if a point is inside the polygon using Turf.js
function isWithinPolygon(userLocation: { lat: number; lon: number }, polygonData: any): boolean {
  const point = turf.point([userLocation.lon, userLocation.lat]);

  // ensure the polygon coordinates are valid and check inclusion
  if (polygonData.features && polygonData.features[0].geometry.coordinates) {
    const polygon = turf.polygon(polygonData.features[0].geometry.coordinates);
    return turf.booleanPointInPolygon(point, polygon);
  }
  return false;
}

// check if a flood event is nearby (adjust the radius to whatever we need)
function isNearby(userLat: number, userLon: number, floodLat: number, floodLon: number, radius = 50): boolean {
  const distance = calculateDistance(userLat, userLon, floodLat, floodLon);
  return distance <= radius; // within 50 km radius
}

// calculate distance between two lat/lon points (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// check if the flood event is recent (e.g., in the past 24 hours)
function isRecentFlood(timeRaised: string): boolean {
  const eventTime = new Date(timeRaised);
  const currentTime = new Date();
  const diffHours = Math.abs(currentTime.getTime() - eventTime.getTime()) / 36e5; // difference in hours
  return diffHours <= 24; // consider recent if within 24 hours
}

// show detailed flood notification
function floodNotifs(floods: any[]) {
  floods.forEach(flood => {
    const floodTitle = flood.description || 'Unknown flood event';
    const floodMessage = flood.message || 'No detailed message available';
    const floodSeverity = flood.severity || 'Unknown severity';
    const floodSeverityLevel = flood.severityLevel || 0;
    const floodArea = flood.floodArea?.county || 'Unknown area';
    const riverOrSea = flood.floodArea?.riverOrSea || 'Unknown water source';

    // icons based on flood severity
    let iconUrl = 'icons/flood-icon.png'; // default flood icon, we are yet to pick some
    if (floodSeverityLevel === 2) {
      iconUrl = 'icons/moderate-flood-icon.png';  // icon for moderate floods
    } else if (floodSeverityLevel === 1) {
      iconUrl = 'icons/severe-flood-icon.png';  // icon for severe floods
    }

    // higher severity should have higher priority
    let notifPriority = 0;
    if (floodSeverityLevel === 2) {
      notifPriority = 1;  // medium priority
    } else if (floodSeverityLevel === 1) {
      notifPriority = 2;  // high priority
    }

    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconUrl,
      title: `Flood Alert: ${floodTitle}`,
      message: `Area: ${floodArea}\nSeverity: ${floodSeverity}\nRiver/Sea: ${riverOrSea}\n\nDetails: ${floodMessage}`,
      priority: notifPriority,  // priotitize by severity
    });
  });
}

// periodically check for floods (e.g., every 30 minutes)
chrome.alarms.create('checkFloods', { minutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkFloods') {
    checkForFloods();
  }
});
