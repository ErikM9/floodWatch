// import fetchFloodData from './api/ukFloodAPI';
// import * as turf from "@turf/turf"


// async function checkUserLocation(userLocation: { lat: number, lon: number }) {
//   try {
//     const polygons = await fetchFloodData();
//     console.log("fetched polygons", polygons)

//     const userPoint = turf.point([userLocation.lon, userLocation.lat]);

//     let isInPolygon = false;

//     polygons.forEach((polygon: any, polygonIndex: number) => {
//       polygon.forEach((p: any, pIndex: number) => {
//         const poly = turf.polygon(p.coordinates);

//         const isInside = turf.booleanPointInPolygon(userPoint, poly);
//         if (isInside) {
//           console.log('user is inside polygon ${polygonIndex}, ${pIndex}');
//           isInPolygon = true;
//         }
//       });
//     });

//     if (!isInPolygon) {
//       console.log("user is not inside any polygon")
//     }
//   } catch (error) {
//     console.error("error fetching polygons or checking location:", error);
//   }
// }
// // function checkUserInPolygon(userLocation, polygons) {
// //   const userPoint = turf.point([userLocation.lon, userLocation.lat])
// // }
// fetchFloodData();


// // function getUserLocationFromStorage(callback) {
// //   chrome.storage.local.get(['userLocation'], ())
// // }

// // Function to get and log the user location
// function checkUserLocation() {
//   chrome.storage.local.get(['userLocation'], function (result) {
//     if (chrome.runtime.lastError) {
//       console.error('Error retrieving userLocation:', chrome.runtime.lastError);
//     } else if (result.userLocation) {
//       const userLocationObj = result.userLocation;
//       const userLocationArr = Object.entries(userLocationObj);
//       const extractedLocation = userLocationArr.map(item => item[1])
//       console.log("extractedLocation", extractedLocation)
//       console.log('User location retrieved in background:', result.userLocation);
//       console.log('Latitude:', extractedLocation[0]);
//       console.log('Longitude:', extractedLocation[1]);
//     } else {
//       console.log('No user location found in storage');
//     }
//   });
// }

// // Listen for changes in storage
// chrome.storage.onChanged.addListener(function (changes, namespace) {
//   if (namespace === 'local' && changes.userLocation) {
//     console.log('User location updated in storage');
//     checkUserLocation();
//   }
// });

// // Initial check for user location when the background script starts
// checkUserLocation();

// import fetchFloodData from './api/ukFloodAPI';
// import { point } from "@turf/helpers";  // Import point creation
// import booleanPointInPolygon from "@turf/boolean-point-in-polygon";  // Import booleanPointInPolygon

// // Function to fetch polygons and check if user is inside
// async function fetchAndCheckUserLocation(userLocation: { lat: number; lon: number }) {
//   try {
//     const polygons = await fetchFloodData();  // Fetch polygons from the API
//     console.log("Fetched polygons:", polygons);

//     const userPoint = point([userLocation.lon, userLocation.lat]);  // Create a Turf.js point from user location

//     let isInsideAnyPolygon = false;

//     // Loop through polygons and check if user is inside
//     polygons.forEach((polygon: any, polygonIndex: number) => {
//       polygon.forEach((p: any, pIndex: number) => {
//         const poly = turf.polygon(p.coordinates);  // Convert polygon coordinates to Turf.js polygon

//         const isInside = booleanPointInPolygon(userPoint, poly);  // Check if user point is inside the polygon
//         if (isInside) {
//           console.log(`User is inside polygon ${polygonIndex}, ${pIndex}`);
//           isInsideAnyPolygon = true;
//         }
//       });
//     });

//     if (!isInsideAnyPolygon) {
//       console.log('User is NOT inside any polygon');
//     }

//   } catch (error) {
//     console.error('Error fetching polygons or checking location:', error);
//   }
// }

// // Function to get and log the user location, then check against polygons
// function getUserLocationAndCheck() {
//   chrome.storage.local.get(['userLocation'], function (result) {
//     if (chrome.runtime.lastError) {
//       console.error('Error retrieving userLocation:', chrome.runtime.lastError);
//     } else if (result.userLocation) {

//       const userLocationObj = result.userLocation;
//       const userLocationArr = Object.entries(userLocationObj);
//       const extractedLocation = userLocationArr.map(item => item[1])
//       console.log("extractedLocation", extractedLocation)
//       console.log('User location retrieved in background:', result.userLocation);
//       console.log('Latitude:', extractedLocation[0]);
//       console.log('Longitude:', extractedLocation[1]);




//       // const userLocationObj = result.userLocation;
//       // const userLocationArr = Object.entries(userLocationObj);
//       // const extractedLocation = userLocationArr.map(item => item[1]);

//       const userLocation = [extractedLocation[0], extractedLocation[1]];

//       console.log("User location:", userLocation);
//       fetchAndCheckUserLocation(userLocation);  // Fetch polygons and check user location
//     } else {
//       console.log('No user location found in storage');
//     }
//   });
// }

// // Listen for changes in storage and trigger location checking
// chrome.storage.onChanged.addListener(function (changes, namespace) {
//   if (namespace === 'local' && changes.userLocation) {
//     console.log('User location updated in storage');
//     getUserLocationAndCheck();
//   }
// });

// // Initial check for user location when the background script starts
// getUserLocationAndCheck();


import fetchFloodData from './api/ukFloodAPI';
import { point } from "@turf/helpers";  // Import point creation
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";  // Import booleanPointInPolygon

// Function to fetch polygons and check if user is inside
async function fetchAndCheckUserLocation(userLocation: { lat: number; lon: number }) {
  try {
    const polygons = await fetchFloodData();  // Fetch polygons from the API
    console.log("Fetched polygons:", polygons);

    const userPoint = point([userLocation.lon, userLocation.lat]);  // Create a Turf.js point from user location

    let isInsideAnyPolygon = false;

    // Loop through polygons and check if user is inside
    polygons.forEach((polygon: any, polygonIndex: number) => {
      polygon.forEach((p: any, pIndex: number) => {
        const poly = turf.polygon(p.coordinates);  // Convert polygon coordinates to Turf.js polygon
        console.log('POLY', poly)
        const isInside = booleanPointInPolygon(userPoint, poly);  // Check if user point is inside the polygon
        if (isInside) {
          console.log(`User is inside polygon ${polygonIndex}, ${pIndex}`);
          isInsideAnyPolygon = true;
        }
      });
    });

    if (!isInsideAnyPolygon) {
      console.log('User is NOT inside any polygon');
    }

  } catch (error) {
    console.error('Error fetching polygons or checking location:', error);
  }
}

// Function to get and log the user location, then check against polygons
// function getUserLocationAndCheck() {
//   chrome.storage.local.get(['userLocation'], function (result) {
//     if (chrome.runtime.lastError) {
//       console.error('Error retrieving userLocation:', chrome.runtime.lastError);
//     } else if (result.userLocation) {
//       const userLocationObj = result.userLocation;
//       const userLocationArr = Object.entries(userLocationObj);
//       const extractedLocation = userLocationArr.map(item => item[1]);

//       const userLocation = { lat: extractedLocation[0], lon: extractedLocation[1] };

//       console.log("User location:", userLocation);
//       fetchAndCheckUserLocation(userLocation);  // Fetch polygons and check user location
//     } else {
//       console.log('No user location found in storage');
//     }
//   });
// }


// Function to get and log the user location, then check against polygons
function getUserLocationAndCheck() {
  chrome.storage.local.get(['userLocation'], function (result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving userLocation:', chrome.runtime.lastError);
    } else if (result.userLocation) {
      const userLocationObj = result.userLocation;

      // Type assertion to ensure lat and lon are numbers
      const userLocation = {
        lat: Number(userLocationObj.lat), // Explicitly cast to number
        lon: Number(userLocationObj.lon)  // Explicitly cast to number
      };

      // Now TypeScript knows lat and lon are numbers
      console.log("User location:", userLocation);

      // Proceed with checking user location
      fetchAndCheckUserLocation(userLocation);  // Fetch polygons and check user location
    } else {
      console.log('No user location found in storage');
    }
  });
}



// Listen for changes in storage and trigger location checking
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === 'local' && changes.userLocation) {
    console.log('User location updated in storage');
    getUserLocationAndCheck();
  }
});

// Initial check for user location when the background script starts
getUserLocationAndCheck();
