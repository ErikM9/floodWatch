const FLOOD_API_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floods';

// user geolocation
function getLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        resolve({ lat, lon });
      },
      (error) => reject(error)
    );
  });
}

// flood data
async function getFloodData() {
  try {
    const response = await fetch(FLOOD_API_URL);
    const data = await response.json();
    return data.items; // list of floods
  } catch (error) {
    console.error('Error fetching flood data:', error);
    return [];
  }
}

// check for local floods
async function checkForFloods() {
  try {
    const userLocation = await getLocation();
    const floodEvents = await getFloodData();

    // Filter floods based on proximity to user's location
    const localFloods = floodEvents.filter((flood: any) => {
      const { lat, lon } = flood;
      return isNearby(userLocation.lat, userLocation.lon, lat, lon);
    });

    if (localFloods.length > 0) {
      floodNotifs(localFloods);
    }
  } catch (error) {
    console.error('Error checking for floods:', error);
  }
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

// show flood notification
function floodNotifs(floods: any[]) {
  const floodTitles = floods.map(flood => flood.description || 'Unknown flood event').join(', ');

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/flood-icon.png', // we need to find an icon for this
    title: 'Local Flood Alert!',
    message: `Flood events detected near you: ${floodTitles}`,
    priority: 2,
  });
}

// periodically check for floods (e.g., every 30 minutes)
chrome.alarms.create('checkFloods', { timeMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkFloods') {
    checkForFloods();
  }
});
