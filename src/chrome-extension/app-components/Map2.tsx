// import React, { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import { getAndLogFloodData, MapPolygon } from '../services/FloodDataService';
// import { Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson';

// const mapStyle = {
//   height: '500px',
//   width: '100%',
// };

// const UkMap2: React.FC = () => {
//   const [floodData, setFloodData] = useState<FeatureCollection | null>(null); // State to store flood data

//   // Fetch flood data when the component mounts
//   useEffect(() => {
//     getAndLogFloodData((data) => {
//       const processedData = MapPolygon(data); // Process the flood data into GeoJSON FeatureCollection
//       setFloodData(processedData); // Save the processed data to the state
//     });
//   }, []);

//   const styleFeature = (feature: Feature<Geometry, GeoJsonProperties> | undefined) => {
//     let fillColor = '#000000';

//     if (feature && feature.properties) {
//       switch (feature.properties.severityLevel) {
//         case 1:
//           fillColor = '#2DC937';
//           break;
//         case 2:
//           fillColor = '#E7B416';
//           break;
//         case 3:
//           fillColor = '#CC3232';
//           break;
//         default:
//           fillColor = '#000000';
//       }
//     }

//     return {
//       color: fillColor,
//       weight: 2,
//       opacity: 1,
//       fillOpacity: 0.5,
//     };
//   };

//   return (
//     <div>
//       <h1>Flood Data</h1>
//       {floodData ? (
//         <MapContainer center={[51.505, -0.09]} zoom={10} style={mapStyle}>
//           <TileLayer
//             attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />
//           <GeoJSON data={floodData} style={styleFeature} />
//         </MapContainer>
//       ) : (
//         <p>Loading flood data...</p>
//       )}
//     </div>
//   );
// };

// export default UkMap2;

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getAndLogFloodData, MapPolygon } from '../services/FloodDataService';
import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';
import { Icon, LatLngTuple } from "leaflet";
import { MapUpdater } from './MapUpdater';

interface MapProps {
  userLocation: LatLngTuple | null;
}

const mapStyle = {
  height: '50vh',
  width: '100%',
};

const UkMap2: React.FC<MapProps> = ({ userLocation }) => {
  const ukCenter: LatLngTuple = [54.00, -2.00];
  const center = userLocation || ukCenter;
  const zoom = userLocation ? 13 : 5.4;

  const [floodData, setFloodData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    getAndLogFloodData((data) => {
      const processedData = MapPolygon(data);
      setFloodData(processedData);
    });
  }, []);


  const styleFeature = (feature: Feature<Geometry, GeoJsonProperties> | undefined) => {
    let fillColor = '#000000';

    if (feature && feature.properties) {
      const severityLevel = feature.properties.severityLevel;

      switch (severityLevel) {
        case 1:
          fillColor = '#FF0000'; // red - Severe Flooding, Danger to Life.
          break;
        case 2:
          fillColor = '#FFA500'; // orange - Flooding is Expected, Immediate Action Required.
          break;
        case 3:
          fillColor = '#218ced'; // blue - Flooding is Possible, Be Prepared.
          break;
        case 4:
          fillColor = '#008000'; // green - Warning no Longer in Force
          break;
        default:
          console.warn('Unknown severity level:', severityLevel);
          fillColor = '#000000';
      }
    } else {
      console.warn('severityLevel missing');
    }

    return {
      color: fillColor,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.5,
    };
  };

  const customIcon = new Icon({

    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })



  return (
    <div>
      <h1>Flood Data</h1>
      {floodData ? (
        <>

          <MapContainer
            center={center}
            zoom={zoom}
            style={mapStyle}>

            <TileLayer
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON
              data={floodData}
              style={styleFeature} />
            <MapUpdater center={center} zoom={zoom} />

            {userLocation && (
              <Marker position={userLocation} icon={customIcon}>
                <Popup>Your location</Popup>
              </Marker>
            )
            }

          </MapContainer>

          <h2>Severity Levels</h2>
          <ul>
            {floodData.features.map((feature, index) => (
              <li key={index}>
                <strong>Severity Level:</strong> {feature.properties?.severityLevel ?? 'Unknown'}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Loading flood data...</p>
      )}
    </div>
  );
};

export default UkMap2;
