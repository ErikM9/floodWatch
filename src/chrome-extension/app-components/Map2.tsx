import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getAndLogFloodData, MapPolygon } from '../services/FloodDataService';
import { Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson';

const mapStyle = {
  height: '500px',
  width: '100%',
};

const UkMap2: React.FC = () => {
  const [floodData, setFloodData] = useState<FeatureCollection | null>(null); // State to store flood data

  // Fetch flood data when the component mounts
  useEffect(() => {
    getAndLogFloodData((data) => {
      const processedData = MapPolygon(data); // Process the flood data into GeoJSON FeatureCollection
      setFloodData(processedData); // Save the processed data to the state
    });
  }, []);

  const styleFeature = (feature: Feature<Geometry, GeoJsonProperties> | undefined) => {
    let fillColor = '#000000';

    if (feature && feature.properties) {
      switch (feature.properties.severityLevel) {
        case 1:
          fillColor = '#2DC937';
          break;
        case 2:
          fillColor = '#E7B416';
          break;
        case 3:
          fillColor = '#CC3232';
          break;
        default:
          fillColor = '#000000';
      }
    }

    return {
      color: fillColor,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.5,
    };
  };

  return (
    <div>
      <h1>Flood Data</h1>
      {floodData ? (
        <MapContainer center={[51.505, -0.09]} zoom={10} style={mapStyle}>
          <TileLayer
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON data={floodData} style={styleFeature} />
        </MapContainer>
      ) : (
        <p>Loading flood data...</p>
      )}
    </div>
  );
};

export default UkMap2;
