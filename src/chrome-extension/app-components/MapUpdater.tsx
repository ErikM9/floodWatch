import { LatLngTuple } from 'leaflet';
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export const MapUpdater: React.FC<{ center: LatLngTuple; zoom: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};