import fetchFloodData from './api/ukFloodAPI';
// import * as turf from "@turf/turf"

// function checkUserInPolygon(userLocation, polygons) {
//   const userPoint = turf.point([userLocation.lon, userLocation.lat])
// }
fetchFloodData();


// function getUserLocationFromStorage(callback) {
//   chrome.storage.local.get(['userLocation'], ())
// }

// Function to get and log the user location
function getUserLocationAndLog() {
  chrome.storage.local.get(['userLocation'], function (result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving userLocation:', chrome.runtime.lastError);
    } else if (result.userLocation) {
      const userLocationObj = result.userLocation;
      const userLocationArr = Object.entries(userLocationObj);
      const extractedLocation = userLocationArr.map(item => item[1])
      console.log("extractedLocation", extractedLocation)
      console.log('User location retrieved in background:', result.userLocation);
      console.log('Latitude:', extractedLocation[0]);
      console.log('Longitude:', extractedLocation[1]);
    } else {
      console.log('No user location found in storage');
    }
  });
}

// Listen for changes in storage
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === 'local' && changes.userLocation) {
    console.log('User location updated in storage');
    getUserLocationAndLog();
  }
});

// Initial check for user location when the background script starts
getUserLocationAndLog();

