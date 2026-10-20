import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BarLoader } from 'react-spinners';
import {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
} from 'geojson';
import { Icon, LatLngTuple } from 'leaflet';
import markerIcon from 'leaflet-color-markers/img/marker-icon-2x-green.png';
import markerShadow from 'leaflet-color-markers/img/marker-shadow.png';

import { getFloodWarningsFromDB } from '../services/floodDatabase';
import { toMapFeatures } from '../services/FloodDataService';
import { severityLevels } from '../severity';
import { MapUpdater } from './MapUpdater';

interface MapProps {
  userLocation: LatLngTuple | null;
}

const mapStyle = {
  height: '560px',
  width: '100%',
};

const ukCenter: LatLngTuple = [54.0, -2.0];

const customIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const styleFeature = (
  feature: Feature<Geometry, GeoJsonProperties> | undefined,
) => ({
  color:
    severityLevels[feature?.properties?.severityLevel]?.colour ?? '#000000',
  weight: 2,
  opacity: 1,
  fillOpacity: 0.5,
});

const UkMap: React.FC<MapProps> = ({ userLocation }) => {
  const center = userLocation || ukCenter;
  const zoom = userLocation ? 13 : 5.4;

  const [floodData, setFloodData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    getFloodWarningsFromDB()
      .catch(() => [])
      .then((floods) => setFloodData(toMapFeatures(floods)));
  }, []);

  return (
    <div>
      {floodData ? (
        <MapContainer
          className="rounded-lg"
          center={center}
          zoom={zoom}
          style={mapStyle}>
          <TileLayer
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON data={floodData} style={styleFeature} />
          <MapUpdater center={center} zoom={zoom} />

          {userLocation && (
            <Marker position={userLocation} icon={customIcon}>
              <Popup>Your location</Popup>
            </Marker>
          )}
        </MapContainer>
      ) : (
        <div className="flex justify-center items-center h-[560px]">
          <BarLoader />
        </div>
      )}
    </div>
  );
};

export default UkMap;