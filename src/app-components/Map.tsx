import React from "react";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, LatLngTuple } from "leaflet";
import { MapUpdater } from "./MapUpdater"


interface MapProps {
  userLocation: LatLngTuple | null;
}

const Map: React.FC<MapProps> = ({ userLocation }) => {
  const ukCenter: LatLngTuple = [54.00, -2.00];
  const center = userLocation || ukCenter;
  const zoom = userLocation ? 13 : 5.4;


  const customIcon = new Icon({

    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
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
      )
      }
    </MapContainer >
  );
};

export default Map;