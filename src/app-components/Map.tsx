import React from "react";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, LatLngTuple } from "leaflet";
import { MapUpdater } from "./MapUpdater"
import mapPin from '../chrome-extension/public/map-pin.png';

interface MapProps {
  userLocation: LatLngTuple | null;
}

const Map: React.FC<MapProps> = ({ userLocation }) => {
  const ukCenter: LatLngTuple = [54.00, -2.00];
  const center = userLocation || ukCenter;
  const zoom = userLocation ? 13 : 5.4;


  const customIcon = new Icon({

    iconUrl: mapPin,
    iconSize: [38, 38]
  })

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "50vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={zoom} />
      {userLocation && (
        <Marker position={userLocation} icon={customIcon}>
          <Popup>Your location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;